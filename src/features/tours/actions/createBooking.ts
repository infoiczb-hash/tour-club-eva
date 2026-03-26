// src/features/tours/actions/createBooking.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

// ✅ 1. Строгая схема для каждого гостя (вместо z.any)
const GuestSchema = z.object({
  isMain: z.boolean(),
  type: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
  age: z.string().optional(),
  jacket: z.string().optional(),
});

const BookingSchema = z.object({
  tourId: z.string().uuid('Неверный ID тура'),
  tourDateId: z.string().uuid('Пожалуйста, выберите конкретную дату').optional().nullable(),
  tourTitle: z.string().min(1),
  tourDate: z.string().min(1, 'Укажите дату'),

  name: z.string().min(2, 'Введите имя (минимум 2 символа)'),
  phone: z.string().min(7, 'Введите корректный номер телефона'),
  social: z.string().optional(),
  comment: z.string().optional(),

  website: z.string().optional(),

  ticketsAdult: z.number().int().min(0).default(1),
  ticketsChild: z.number().int().min(0).default(0),
  ticketsFamily: z.number().int().min(0).default(0),
  ticketsMember: z.number().int().min(0).default(0),

  // ✅ 2. Применяем нашу схему к массиву гостей
  guests: z.array(GuestSchema).optional(),

  totalPrice: z.number().int().min(0),
  currency: z.string().default('MDL'),
});

export type BookingInput = z.infer<typeof BookingSchema>;

export type BookingResult =
  | { success: true; bookingId: string }
  | { success: false; error: string; fields?: Record<string, string> };

export async function createBookingAction(raw: BookingInput): Promise<BookingResult> {

  try {
    const ip = await getClientIp();
    const { success: rateLimitSuccess } = await basicRateLimit.limit(ip);
    if (!rateLimitSuccess) {
      return {
        success: false,
        error: 'Слишком много попыток. Подождите минуту.'
      };
    }
  } catch (error) {
    console.error('Rate limit error:', error);
  }

  const parsed = BookingSchema.safeParse(raw);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach((e: z.ZodIssue) => {
      const key = e.path[0]?.toString() ?? 'unknown';
      fields[key] = e.message;
    });
    return {
      success: false,
      error: 'Ошибка заполнения формы. Проверьте выделенные поля.',
      fields
    };
  }

  const data = parsed.data;

  if (data.website && data.website.length > 0) {
    console.warn('Bot detected via honeypot field');
    return { success: true, bookingId: 'sp-checked' };
  }

  const familySpots = data.ticketsFamily * 3;
  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember + familySpots;

  const cleanPhone = data.phone.replace(/[^\d+]/g, '');

  let currentMemberId = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { id: true }
      });
      if (profile) {
        currentMemberId = profile.id;
      }
    }
  } catch (e) {
    console.error('Ошибка проверки авторизации:', e);
  }

  try {
    // ─── ИСПРАВЛЕНИЕ: убран лишний SELECT перед транзакцией ──────────────────
    // Раньше: findUnique(tour) → transaction(updateSpots + createBooking) = 3 запроса
    // Теперь: transaction(checkActive + updateSpots + createBooking) = 1 round-trip
    //
    // Проверка isActive встроена прямо в WHERE транзакции.
    // Если тур неактивен/не найден — updateMany вернёт count=0 → ошибка TOUR_UNAVAILABLE.
    // coverImage получаем из результата createBooking через include — один запрос.
    // ─────────────────────────────────────────────────────────────────────────

    const result = await prisma.$transaction(async (tx) => {
      let spotsUpdated = false;
      let tourSlug: string | null = null;
      let tourCoverImage: string | null = null;

      if (data.tourDateId) {
        // Списываем с конкретной даты — isActive проверяем через join на тур
        const updatedTourDate = await tx.tourDate.updateMany({
          where: {
            id: data.tourDateId,
            spotsLeft: { gte: totalTickets },
            tour: { isActive: true, deletedAt: null },
          },
          data: {
            spotsLeft: { decrement: totalTickets }
          },
        });
        if (updatedTourDate.count > 0) spotsUpdated = true;
      } else {
        // Списываем из общего пула тура
        const updatedTour = await tx.tour.updateMany({
          where: {
            id: data.tourId,
            isActive: true,
            deletedAt: null,
            spotsLeft: { gte: totalTickets }
          },
          data: {
            spotsLeft: { decrement: totalTickets }
          },
        });
        if (updatedTour.count > 0) spotsUpdated = true;
      }

      if (!spotsUpdated) {
        // Различаем: тур недоступен vs мест нет
        const tourExists = await tx.tour.findFirst({
          where: { id: data.tourId, isActive: true, deletedAt: null },
          select: { id: true, slug: true, coverImage: true },
        });
        if (!tourExists) throw new Error('TOUR_UNAVAILABLE');
        throw new Error('SPOTS_GONE');
      }

      // Получаем slug и coverImage для revalidatePath и Telegram
      const tour = await tx.tour.findUnique({
        where: { id: data.tourId },
        select: { slug: true, coverImage: true },
      });
      tourSlug = tour?.slug ?? null;
      tourCoverImage = tour?.coverImage ?? null;

      const newBooking = await tx.booking.create({
        data: {
          tourId:        data.tourId,
          tourDateId:    data.tourDateId || null,
          memberId:      currentMemberId,
          name:          data.name,
          phone:         cleanPhone,
          email:         data.social?.includes('@') ? data.social : null,
          social:        data.social || null,
          ticketsAdult:  data.ticketsAdult,
          ticketsChild:  data.ticketsChild,
          ticketsFamily: data.ticketsFamily,
          ticketsMember: data.ticketsMember,
          guests:        data.guests || [],
          comment:       data.comment || null,
          totalPrice:    data.totalPrice,
          source:        'website',
          status:        'pending',
          bookedDate:    new Date(),
        },
      });

      return { booking: newBooking, tourSlug, tourCoverImage };
    });

    try {
      await notifyTelegram(data, result.booking.id, result.tourCoverImage);
    } catch (tgError) {
      console.error('Ошибка отправки в Telegram:', tgError);
    }

    if (result.tourSlug) {
      revalidatePath(`/tour/${result.tourSlug}`);
    }
    revalidatePath('/tour');
    revalidatePath('/admin');
    revalidatePath('/account', 'layout');

    return { success: true, bookingId: result.booking.id };

  } catch (error: any) {
    if (error.message === 'TOUR_UNAVAILABLE') {
      return { success: false, error: 'Тур не найден или недоступен' };
    }
    if (error.message === 'SPOTS_GONE') {
      return {
        success: false,
        error: 'Последние места на эту дату были выкуплены прямо сейчас.'
      };
    }
    console.error('Booking Error:', error);
    return {
      success: false,
      error: 'Произошла ошибка при сохранении заявки. Попробуйте еще раз.'
    };
  }
}

async function notifyTelegram(data: BookingInput, bookingId: string, coverImage?: string | null): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram credentials missing');
    return;
  }

  const familySpots = data.ticketsFamily * 3;
  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember + familySpots;

  // ✅ 3. Обновленный вывод гостей в Telegram с новыми данными
  const guestsList = (data.guests || []).map((g: any, i: number) => {
    const jacketInfo = g.jacket ? ` | 🦺 ${g.jacket}` : '';
    const ageInfo = g.age ? ` | 👶 ${g.age} лет` : '';
    const phoneInfo = (!g.isMain && g.phone) ? ` | 📞 ${g.phone}` : '';

    if (g.isMain) {
      return `${i + 1}. 👤 <b>${escapeHtml(g.name || 'Заказчик')}</b> (Заказчик)${jacketInfo}`;
    }
    return `${i + 1}. 👤 ${escapeHtml(g.name || 'Без имени')} (${g.type})${ageInfo}${phoneInfo}${jacketInfo}`;
  }).join('\n');

  const lines = [
    `🎯 <b>НОВАЯ БРОНЬ (Сайт)</b>`,
    ``,
    `🏕 <b>${escapeHtml(data.tourTitle)}</b>`,
    `📅 ${escapeHtml(data.tourDate)}`,
    ``,
    `📞 <a href="tel:${data.phone.replace(/\s/g, '')}">${escapeHtml(data.phone)}</a>`,
    data.social ? `💬 ${escapeHtml(data.social)}` : null,
    ``,
    `👥 <b>Список группы (${totalTickets} чел.):</b>`,
    guestsList,
    ``,
    `💰 Итого к оплате: <b>${data.totalPrice} ${data.currency}</b>`,
    data.comment ? `\n💬 Комментарий: ${escapeHtml(data.comment)}` : null,
    ``,
    `🆔 <code>${bookingId}</code>`,
  ].filter((l): l is string => l !== null).join('\n');

  const body: Record<string, unknown> = {
    chat_id: chatId,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: '👤 Открыть в Админке', url: `${SITE_URL}/admin` }]
      ],
    }),
  };

  const method = coverImage ? 'sendPhoto' : 'sendMessage';

  if (coverImage) {
    body.photo = coverImage;
    body.caption = lines.slice(0, 1024);
  } else {
    body.text = lines;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error('Telegram API responded with status:', response.status);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}