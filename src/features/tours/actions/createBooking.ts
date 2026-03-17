'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';

// Безопасное получение URL сайта для кнопок в Telegram
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

// ── 1. СХЕМА ВАЛИДАЦИИ ────────────────────────────────────────────────────────
const BookingSchema = z.object({
  tourId:      z.string().uuid('Неверный ID тура'),
  tourDateId:  z.string().uuid('Пожалуйста, выберите конкретную дату').optional().nullable(), // ✅ Опционально для обратной совместимости со старыми турами
  tourTitle:   z.string().min(1),
  tourDate:    z.string().min(1, 'Укажите дату'),

  name:        z.string().min(2,  'Введите имя (минимум 2 символа)'),
  phone:       z.string().min(7,  'Введите корректный номер телефона'),
  social:      z.string().optional(),
  comment:     z.string().optional(),

  ticketsAdult:  z.number().int().min(0).default(1),
  ticketsChild:  z.number().int().min(0).default(0),
  ticketsFamily: z.number().int().min(0).default(0), // ✅ ДОБАВЛЕНО (Семейный пакет)
  ticketsMember: z.number().int().min(0).default(0),

  totalPrice:  z.number().int().min(0),
  currency:    z.string().default('MDL'),
});

export type BookingInput = z.infer<typeof BookingSchema>;

// ── 2. ТИПЫ ОТВЕТА ────────────────────────────────────────────────────────────
export type BookingResult =
  | { success: true;  bookingId: string }
  | { success: false; error: string; fields?: Record<string, string> };

// ── 3. ГЛАВНЫЙ ACTION ─────────────────────────────────────────────────────────
export async function createBookingAction(raw: BookingInput): Promise<BookingResult> {

  // Rate Limiting (защита от спам-бронирований)
  try {
    const ip = await getClientIp();
    const { success: rateLimitSuccess } = await basicRateLimit.limit(ip);

    if (!rateLimitSuccess) {
      return { 
        success: false, 
        error: 'Слишком много попыток бронирования. Пожалуйста, подождите одну минуту.' 
      };
    }
  } catch (error) {
    console.error('Rate limit error in createBooking:', error);
  }

  // 3.1 Валидация входных данных
  const parsed = BookingSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    
    parsed.error.issues.forEach((e: z.ZodIssue) => {
      const key = e.path[0]?.toString() ?? 'unknown';
      fields[key] = e.message;
    });
    
    return { success: false, error: 'Ошибка валидации формы. Проверьте данные.', fields };
  }
  const data = parsed.data;
  
  // ✅ Учитываем, что 1 Семейный билет обычно = 3 места
  const familySpots = data.ticketsFamily * 3;
  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember + familySpots;

  try {
    // 3.2 Быстрая проверка тура
    const tour = await prisma.tour.findUnique({
      where: { id: data.tourId },
      select: { id: true, title: true, slug: true, spotsLeft: true, isActive: true, coverImage: true },
    });

    if (!tour) {
      return { success: false, error: 'Тур не найден' };
    }

    if (!tour.isActive) {
      return { success: false, error: 'Этот тур больше не доступен для записи' };
    }

    // 3.3 Транзакция: АТОМАРНОЕ уменьшение мест + создание брони
    const booking = await prisma.$transaction(async (tx) => {
      
      let spotsUpdated = false;

      // ✅ ИСПРАВЛЕНИЕ: Пытаемся отнять места с конкретной даты, если она передана
      if (data.tourDateId) {
        const updatedTourDate = await tx.tourDate.updateMany({
          where: { 
              id: data.tourDateId,
              spotsLeft: { gte: totalTickets } 
          },
          data:  { spotsLeft: { decrement: totalTickets } },
        });
        if (updatedTourDate.count > 0) spotsUpdated = true;
      } else {
        // Фолбэк для старых туров без привязки дат
        const updatedTour = await tx.tour.updateMany({
          where: { 
              id: data.tourId,
              spotsLeft: { gte: totalTickets } 
          },
          data:  { spotsLeft: { decrement: totalTickets } },
        });
        if (updatedTour.count > 0) spotsUpdated = true;
      }

      // Если ни один счетчик мест не обновился — места кончились в эту секунду
      if (!spotsUpdated) {
        throw new Error('SPOTS_GONE');
      }

      // ✅ ИСПРАВЛЕНИЕ: Создаем бронь с плоскими полями и привязкой к TourDate
      const newBooking = await tx.booking.create({
        data: {
          tourId:        data.tourId,
          tourDateId:    data.tourDateId || null,
          name:          data.name,
          phone:         data.phone,
          email:         data.social?.includes('@') ? data.social : null,
          social:        data.social || null,
          ticketsAdult:  data.ticketsAdult,
          ticketsChild:  data.ticketsChild,
          ticketsFamily: data.ticketsFamily,
          ticketsMember: data.ticketsMember,
          comment:       data.comment || null,
          totalPrice:    data.totalPrice,
          source:        'website', // Указываем жестко для аналитики CRM
          status:        'pending',
          bookedDate:    new Date(),
        },
      });

      return newBooking;
    });

    // 3.4 Telegram-уведомление
    // 🔥 ГЛАВНЫЙ ФИКС VERCEL BUG: Жесткий await, чтобы процесс дожил до отправки
    await notifyTelegram(data, booking.id, tour.coverImage);

    // 3.5 Инвалидируем кэш
    if (tour.slug) {
        revalidatePath(`/tour/${tour.slug}`);
    }
    revalidatePath('/tour');
    revalidatePath('/admin');

    return { success: true, bookingId: booking.id };

  } catch (error: any) {
    console.error('createBooking error:', error);
    
    // Перехватываем нашу специфичную ошибку овербукинга
    if (error.message === 'SPOTS_GONE') {
        return {
            success: false,
            error: 'Извините, пока вы оформляли заявку, последние места на эту дату были выкуплены.',
        };
    }

    return {
      success: false,
      error: 'Произошла ошибка при сохранении. Попробуйте ещё раз или свяжитесь с нами напрямую.',
    };
  }
}

// ── 4. TELEGRAM УВЕДОМЛЕНИЕ ───────────────────────────────────────────────────
async function notifyTelegram(
  data: BookingInput,
  bookingId: string,
  coverImage?: string | null,
): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  
  if (!token || !chatId) {
    console.warn("Telegram tokens not found in environment variables.");
    return;
  }

  const familySpots = data.ticketsFamily * 3;
  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember + familySpots;

  const lines = [
    `🎯 <b>НОВАЯ БРОНЬ (Сайт)</b>`,
    ``,
    `🏕 <b>${escapeHtml(data.tourTitle)}</b>`,
    `📅 ${escapeHtml(data.tourDate)}`,
    ``,
    `👤 <b>${escapeHtml(data.name)}</b>`,
    `📞 <a href="tel:${data.phone.replace(/\s/g, '')}">${escapeHtml(data.phone)}</a>`,
    data.social ? `💬 ${escapeHtml(data.social)}` : null,
    ``,
    `🎟 Билеты: ${[
      data.ticketsAdult  > 0 ? `${data.ticketsAdult} взр`  : null,
      data.ticketsChild  > 0 ? `${data.ticketsChild} дет`  : null,
      data.ticketsFamily > 0 ? `${data.ticketsFamily} сем` : null,
      data.ticketsMember > 0 ? `${data.ticketsMember} чл`  : null,
    ].filter(Boolean).join(' + ')} = <b>${totalTickets} мест</b>`,
    `💰 Итого: <b>${data.totalPrice} ${data.currency}</b>`,
    data.comment ? `\n💬 Комментарий: ${escapeHtml(data.comment)}` : null,
    ``,
    `🆔 <code>${bookingId}</code>`,
  ].filter((l): l is string => l !== null).join('\n');

  const body: Record<string, unknown> = {
    chat_id:    chatId,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      inline_keyboard: [[
        { text: '👤 Открыть в Админке', url: `${SITE_URL}/admin` },
      ]],
    }),
  };

  if (coverImage) {
    body.method  = 'sendPhoto';
    body.photo   = coverImage;
    body.caption = lines.slice(0, 1024);
  } else {
    body.method = 'sendMessage';
    body.text   = lines;
  }

  const method = coverImage ? 'sendPhoto' : 'sendMessage';

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    
    if (!response.ok) {
       console.error('Telegram notification failed:', await response.text());
    }
  } catch (error) {
     console.error('Telegram fetch error:', error);
  }
}

// ── 5. ХЕЛПЕР ─────────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}