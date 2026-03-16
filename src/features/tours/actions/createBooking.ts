'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// ✅ ДОБАВЛЕНО: Импорт лимитера и функции получения IP
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';

// Безопасное получение URL сайта для кнопок в Telegram
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

// ── 1. СХЕМА ВАЛИДАЦИИ ────────────────────────────────────────────────────────
const BookingSchema = z.object({
  tourId:      z.string().uuid('Неверный ID тура'),
  tourTitle:   z.string().min(1),
  tourDate:    z.string().min(1, 'Укажите дату'),

  name:        z.string().min(2,  'Введите имя (минимум 2 символа)'),
  phone:       z.string().min(7,  'Введите корректный номер телефона'),
  social:      z.string().optional(),
  comment:     z.string().optional(),

  ticketsAdult:  z.number().int().min(0).default(1),
  ticketsChild:  z.number().int().min(0).default(0),
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

  // ✅ ДОБАВЛЕНО: Rate Limiting (защита от спам-бронирований)
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
    // При ошибке Redis (например, сеть упала) пропускаем запрос, чтобы не блокировать реальных клиентов
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
  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember;

  try {
    // 3.2 Быстрая проверка тура (и получение SLUG для кэша)
    const tour = await prisma.tour.findUnique({
      where: { id: data.tourId },
      // 🔥 ИСПРАВЛЕНИЕ: Добавили slug в выборку
      select: { id: true, title: true, slug: true, spotsLeft: true, isActive: true, coverImage: true },
    });

    if (!tour) {
      return { success: false, error: 'Тур не найден' };
    }

    if (!tour.isActive) {
      return { success: false, error: 'Этот тур больше не доступен для записи' };
    }

    // Предварительная (быстрая) проверка мест, чтобы отсеять явные ошибки
    if (tour.spotsLeft < totalTickets) {
      return {
        success: false,
        error: `Недостаточно мест. Осталось: ${tour.spotsLeft}`,
      };
    }

    // 3.3 Транзакция: АТОМАРНОЕ уменьшение мест + создание брони
    const booking = await prisma.$transaction(async (tx) => {
      
      // 🔥 ИСПРАВЛЕНИЕ: Пессимистичная блокировка (Защита от гонки данных)
      // Пытаемся отнять места, ТОЛЬКО если их >= totalTickets в данную миллисекунду
      const updatedTour = await tx.tour.updateMany({
        where: { 
            id: data.tourId,
            spotsLeft: { gte: totalTickets } // Условие прямо в запросе
        },
        data:  { spotsLeft: { decrement: totalTickets } },
      });

      // Если count === 0, значит пока юзер заполнял форму, места уже кто-то выкупил
      if (updatedTour.count === 0) {
        throw new Error('SPOTS_GONE');
      }

      // Если места списались успешно, создаём саму запись брони
      const newBooking = await tx.booking.create({
        data: {
          tourId:     data.tourId,
          name:       data.name,
          phone:      data.phone,
          email:      data.social?.includes('@') ? data.social : null,
          tickets:    {
            adult:   data.ticketsAdult,
            child:   data.ticketsChild,
            member:  data.ticketsMember,
            date:    data.tourDate,
            comment: data.comment ?? '',
            social:  data.social ?? '',
          },
          totalPrice: data.totalPrice,
          status:     'pending',
          bookedDate: new Date(),
        },
      });

      return newBooking;
    });

    // 3.4 Telegram-уведомление (не блокирует ответ пользователю)
    notifyTelegram(data, booking.id, tour.coverImage).catch(console.error);

    // 3.5 🔥 ИСПРАВЛЕНИЕ: Инвалидируем кэш по правильному SLUG
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
            error: 'Извините, пока вы оформляли заявку, последние места были выкуплены.',
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

  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember;

  const lines = [
    `🎯 <b>НОВАЯ БРОНЬ</b>`,
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
      data.ticketsMember > 0 ? `${data.ticketsMember} чл`  : null,
    ].filter(Boolean).join(' + ')} = <b>${totalTickets} чел.</b>`,
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

  await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

// ── 5. ХЕЛПЕР ─────────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}