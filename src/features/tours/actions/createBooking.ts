// src/features/tours/actions/createBooking.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { Resend } from 'resend';
import { BookingTicketEmail } from '@/features/tours/emails/BookingTicketEmail';
import { withRateLimit } from '@/lib/rate-limit-server';
import { NotificationHub } from '@/lib/notifications/hub';
import { publishToTelegram } from '@/features/admin/actions/telegram';
// клиент АПБ для генерации URL оплаты
import { apbClient } from '@/lib/apb/client';

// ✅ НОВЫЙ ИМПОРТ: берем протестированную финансовую логику
import { calculateTotalSpots, calculateBasePrice } from '../lib/pricing';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = env.NEXT_PUBLIC_SITE_URL;

// Строгая схема для каждого гостя
const GuestSchema = z.object({
  isMain: z.boolean(),
  type: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
  age: z.string().optional(),
  jacket: z.string().optional(),
});

export type GuestInput = z.infer<typeof GuestSchema>;

const BookingSchema = z.object({
  tourId: z.string().uuid('Неверный ID тура'),
  tourDateId: z.union([
    z.string().uuid('Пожалуйста, выберите конкретную дату'),
    z.literal(''),
    z.null(),
    z.undefined(),
  ]).transform(val => (val === '' || val == null) ? null : val).optional(),
  tourTitle: z.string().min(1),
  tourDate: z.string().min(1, 'Укажите дату'),

  name: z.string().min(2, 'Введите имя (минимум 2 символа)'),
  phone: z.string()
    .trim()
    .min(7, 'Введите корректный номер телефона')
    .regex(/^[\d\+\-\s\(\)]+$/, 'Неверный формат телефона'),
  social: z.string().optional(),
  comment: z.string().optional(),

  website: z.string().optional(), // Honeypot

  ticketsAdult: z.number().int().min(0).default(1),
  ticketsChild: z.number().int().min(0).default(0),
  ticketsFamily: z.number().int().min(0).default(0),
  ticketsMember: z.number().int().min(0).default(0),

  guests: z.array(GuestSchema).optional(),

  currency: z.string().default('RUB'),

  paymentMethod: z.enum(['biletpmr', 'qr', 'cash', 'foreign', 'online_card']).default('biletpmr'),
  useBonuses: z.boolean().default(false),
  promoCode: z.string().optional(),

  hasChildUnder7: z.boolean().optional(),
  hasDog: z.boolean().optional(),
})
.refine(
  (data) => {
    const total = data.ticketsAdult + data.ticketsChild + data.ticketsMember + data.ticketsFamily;
    return total >= 1;
  },
  {
    message: 'Выберите хотя бы 1 билет',
    path: ['ticketsAdult']
  }
);

export type BookingInput = z.infer<typeof BookingSchema>;

export type BookingResult =
  | {
      success: true;
      bookingId: string;
      shortId: string;
      totalPrice: number;
      biletpmrLink?: string | null;
      apbQrLink?: string | null;
      apbQrImage?: string | null;
      paymentMethod?: string;
      redirectUrl?: string | null; // URL для редиректа на страницу оплаты АПБ
    }
  | { success: false; error: string; fields?: Record<string, string> };

export const createBookingAction = withRateLimit(async (raw: BookingInput): Promise<BookingResult> => {
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

  // Honeypot против ботов
  if (data.website && data.website.length > 0) {
    console.warn('Bot detected via honeypot field');
    return {
      success: true,
      bookingId: 'sp-checked',
      shortId: '0000', // 👈 Теперь строка
      totalPrice: 0
    };
  }

  // ✅ ИЗМЕНЕНО: Вычисляем места через нашу чистую утилиту
  const totalSpots = calculateTotalSpots({
    ticketsAdult: data.ticketsAdult,
    ticketsChild: data.ticketsChild,
    ticketsMember: data.ticketsMember,
    ticketsFamily: data.ticketsFamily,
  });

  if (totalSpots <= 0) {
    return { success: false, error: 'Выберите хотя бы один билет.' };
  }

  const cleanPhone = data.phone.replace(/[^\d+]/g, '');

  let currentMemberId: string | null = null;
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
  } catch (e: unknown) {
    console.error('Ошибка проверки авторизации:', e);
  }

  // Защита от дублирования заявок
  const existingBooking = await prisma.booking.findFirst({
    where: {
      phone: cleanPhone,
      tourId: data.tourId,
      tourDateId: data.tourDateId || null,
      status: { in: ['pending', 'awaiting_payment', 'moderation'] }
    }
  });

  if (existingBooking) {
    const displayId = existingBooking.shortId ?? existingBooking.id.substring(0, 5).toUpperCase();
    return {
      success: false,
      error: `У вас уже есть неоплаченная заявка (#${displayId}) на этот тур. Пожалуйста, перейдите в Личный Кабинет, чтобы изменить способ оплаты или отправить чек.`
    };
  }

  let transactionResult: {
    booking: any;
    tourSlug: string | null;
    tourCoverImage: string | null;
    shortId: string;
    apbInvoiceId: string | null; 
    paymentLinks: {
      biletpmrLink: string | null;
      apbQrLink: string | null;
      apbQrImage: string | null;
    };
    finalPrice: number;
    appliedDiscount: number;
    promoOwnerIdToReward: string | null;
    promoRewardAmount: number;
  } | null = null;

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      transactionResult = await prisma.$transaction(async (tx) => {
        // ---------- 1. Атомарное списание мест ----------
        let priceAdult: number, priceChild: number, priceFamily: number, priceMember: number;
        let tourSlug: string | null = null, tourCoverImage: string | null = null;
        let biletpmrLink: string | null = null, apbQrLink: string | null = null, apbQrImage: string | null = null;

        if (data.tourDateId && data.tourDateId.length > 5) {
          const updatedTourDate = await tx.tourDate.update({
            where: {
              id: data.tourDateId,
              spotsLeft: { gte: totalSpots },
              tour: { isActive: true, deletedAt: null }
            },
            data: {
              spotsLeft: { decrement: totalSpots }
            },
            select: {
              basePrice: true,
              tour: { select: { price: true, priceChild: true, priceFamily: true, priceMember: true, slug: true, coverImage: true, biletpmrLink: true, apbQrLink: true, apbQrImage: true } }
            }
          });

          priceAdult = updatedTourDate.basePrice ?? updatedTourDate.tour.price;
          priceChild = updatedTourDate.tour.priceChild ?? priceAdult;
          priceFamily = updatedTourDate.tour.priceFamily ?? priceAdult;
          priceMember = updatedTourDate.tour.priceMember ?? priceAdult;
          tourSlug = updatedTourDate.tour.slug;
          tourCoverImage = updatedTourDate.tour.coverImage;
          biletpmrLink = updatedTourDate.tour.biletpmrLink;
          apbQrLink = updatedTourDate.tour.apbQrLink;
          apbQrImage = updatedTourDate.tour.apbQrImage;
        } else {
          const updatedTour = await tx.tour.update({
            where: {
              id: data.tourId,
              isActive: true,
              deletedAt: null,
              spotsLeft: { gte: totalSpots }
            },
            data: {
              spotsLeft: { decrement: totalSpots }
            },
            select: { price: true, priceChild: true, priceFamily: true, priceMember: true, slug: true, coverImage: true, biletpmrLink: true, apbQrLink: true, apbQrImage: true }
          });
          priceAdult = updatedTour.price;
          priceChild = updatedTour.priceChild ?? priceAdult;
          priceFamily = updatedTour.priceFamily ?? priceAdult;
          priceMember = updatedTour.priceMember ?? priceAdult;
          tourSlug = updatedTour.slug;
          tourCoverImage = updatedTour.coverImage;
          biletpmrLink = updatedTour.biletpmrLink;
          apbQrLink = updatedTour.apbQrLink;
          apbQrImage = updatedTour.apbQrImage;
        }

        // ---------- 2. Расчёт базовой цены ----------
        // ✅ ИЗМЕНЕНО: Вычисляем базовую сумму через чистую утилиту
        const baseTotalPrice = calculateBasePrice(
          {
            ticketsAdult: data.ticketsAdult,
            ticketsChild: data.ticketsChild,
            ticketsMember: data.ticketsMember,
            ticketsFamily: data.ticketsFamily,
          },
          {
            priceAdult,
            priceChild,
            priceFamily,
            priceMember,
          }
        );

        // ---------- 3. Применение скидок ----------
        let appliedDiscount = 0;
        let usedPromoCodeId: string | null = null;
        let promoOwnerIdToReward: string | null = null;
        let promoRewardAmount = 0;

        // ⛔️ Авторизованный + промокод другого юзера — запрещено
        if (currentMemberId && data.promoCode) {
          const promoCodeRaw = data.promoCode.trim().toUpperCase();
          const promo = await tx.promoCode.findUnique({ where: { code: promoCodeRaw } });
          if (promo && promo.memberId !== null) {
            throw new Error('PROMO_CABINET_FORBIDDEN');
          }
        }

        // ⛔️ Одновременно промокод и бонусы — запрещено
        if (data.promoCode && data.useBonuses) {
          throw new Error('PROMO_AND_BONUS_CONFLICT');
        }

        // Если пользователь ввел промокод (гость или авторизованный с системным)
        if (data.promoCode) {
          const promoCodeRaw = data.promoCode.trim().toUpperCase();
          const promo = await tx.promoCode.findUnique({ where: { code: promoCodeRaw } });

          if (!promo || !promo.isActive) throw new Error('PROMO_INVALID');
          if (promo.validUntil && promo.validUntil < new Date()) throw new Error('PROMO_EXPIRED');

          if (promo.type === 'percent') {
            appliedDiscount = Math.floor(baseTotalPrice * (promo.discount / 100));
          } else {
            appliedDiscount = promo.discount;
          }
          appliedDiscount = Math.min(appliedDiscount, baseTotalPrice);
          usedPromoCodeId = promo.id;

          await tx.promoCode.update({
            where: { id: promo.id },
            data: { usageCount: { increment: 1 } }
          });

          if (promo.memberId) {
            await tx.memberProfile.update({
              where: { id: promo.memberId },
              data: { balance: { increment: 10 } }
            });
            promoOwnerIdToReward = promo.memberId;
            promoRewardAmount = 10;
          }

        // Если промокода нет, но авторизованный хочет бонусы
        } else if (currentMemberId && data.useBonuses) {
          const profile = await tx.memberProfile.findUnique({
            where: { id: currentMemberId },
            select: { balance: true }
          });
          if (profile && profile.balance > 0) {
            const maxDiscount = Math.floor(baseTotalPrice * 0.1);
            appliedDiscount = Math.min(profile.balance, maxDiscount, baseTotalPrice);
            if (appliedDiscount > 0) {
              await tx.memberProfile.update({
                where: { id: currentMemberId },
                data: { balance: { decrement: appliedDiscount } }
              });
            }
          }
        }

        const finalPrice = baseTotalPrice - appliedDiscount;

        // ---------- 4. Генерация уникального 4-значного shortId ----------
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без 0, O, 1, I
        let newShortId = '';
        let isUniqueId = false;

        while (!isUniqueId) {
          let tempId = '';
          for (let i = 0; i < 4; i++) {
            tempId += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          const existing = await tx.booking.findUnique({
            where: { shortId: tempId },
            select: { id: true }
          });
          
          if (!existing) {
            newShortId = tempId;
            isUniqueId = true;
          }
        }

        // ---------- 5. Определяем начальный статус ----------
        let initialStatus: 'pending' | 'awaiting_payment' = 'pending';
        if (['biletpmr', 'qr', 'foreign', 'online_card'].includes(data.paymentMethod)) {
          initialStatus = 'awaiting_payment';
        }

        // ---------- 6. Генерация apbInvoiceId для online_card ----------
        const apbInvoiceId = data.paymentMethod === 'online_card'
          ? `EVA-${newShortId}`
          : null;

        // ---------- 7. Создаём бронь ----------
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmail = (data.social && emailRegex.test(data.social.trim())) ? data.social.trim() : null;

        const newBooking = await tx.booking.create({
          data: {
            shortId: newShortId,
            tourId: data.tourId,
            tourDateId: data.tourDateId || null,
            memberId: currentMemberId,
            name: data.name,
            phone: cleanPhone,
            email: validEmail,
            social: data.social || null,
            ticketsAdult: data.ticketsAdult,
            ticketsChild: data.ticketsChild,
            ticketsFamily: data.ticketsFamily,
            ticketsMember: data.ticketsMember,
            guests: (data.guests || []) as Prisma.InputJsonValue,
            comment: data.comment || null,
            hasChildUnder7: data.hasChildUnder7 || false,
            hasDog: data.hasDog || false,
            totalPrice: finalPrice,
            discount: appliedDiscount,
            promoCodeId: usedPromoCodeId,
            source: 'website',
            status: initialStatus,
            bookedDate: new Date(),
            paymentMethod: data.paymentMethod,
            apbInvoiceId,
          },
        });

        return {
          booking: newBooking,
          tourSlug,
          tourCoverImage,
          shortId: newShortId,
          apbInvoiceId,   
          paymentLinks: { biletpmrLink, apbQrLink, apbQrImage },
          finalPrice,
          appliedDiscount,
          promoOwnerIdToReward,
          promoRewardAmount,
        };
      });

      break;
    } catch (error: unknown) {
      const err = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null;

      if (err?.code === 'P2002' && attempt < MAX_RETRIES) {
        console.warn(`[Booking] Race condition on shortId. Retry ${attempt + 1}/${MAX_RETRIES}`);
        continue;
      }

      if (error instanceof Error) {
        if (error.message === 'PROMO_AND_BONUS_CONFLICT') {
          return { success: false, error: 'Промокод и бонусы не могут быть использованы одновременно. Пожалуйста, выберите что-то одно.' };
        }
        if (error.message === 'PROMO_CABINET_FORBIDDEN') {
          return { success: false, error: 'Реферальные промокоды друзей доступны только для новых пользователей. Вы можете использовать свои бонусы или системные промокоды клуба.' };
        }
        if (error.message === 'PROMO_INVALID') {
          return { success: false, error: 'Промокод недействителен.' };
        }
      if (error.message === 'PROMO_EXPIRED') {
          return { success: false, error: 'Срок действия промокода истёк.' };
        }
       if (error.message === 'SPOTS_GONE') {
          return { success: false, error: 'Последние места на эту дату были выкуплены прямо сейчас.' };
        }
      }
      if (err?.code === 'P2025') {
        return { success: false, error: 'Выбранная дата или тур больше не доступны.' };
      }

      console.error('Booking Transaction Error:', error);
      return {
        success: false,
        error: 'Произошла ошибка при сохранении заявки. Попробуйте еще раз.'
      };
    }
  }

  if (!transactionResult) {
    return { success: false, error: 'Не удалось создать заявку из-за высокой нагрузки. Повторите попытку.' };
  }

  // ---------- 8. Генерация redirectUrl для online_card (вне транзакции) ----------
  let redirectUrl: string | null = null;
  if (data.paymentMethod === 'online_card' && transactionResult.apbInvoiceId) {
    try {
      redirectUrl = apbClient.buildPaymentUrl(
        transactionResult.apbInvoiceId,
        transactionResult.finalPrice,
        `Тур: ${data.tourTitle}`.slice(0, 255),
        30, 
      );
    } catch (apbError) {
      console.error('[APB] buildPaymentUrl failed:', apbError);
    }
  }

  // ---------- Отправка уведомлений (вне транзакции) ----------
  try {
    await notifyTelegram(
      data,
      transactionResult.booking.id,
      transactionResult.shortId,
      transactionResult.appliedDiscount,
      transactionResult.finalPrice,
      transactionResult.apbInvoiceId,
    );

    if (transactionResult.promoOwnerIdToReward) {
      await NotificationHub.dispatch({
        eventId: 'CASHBACK_RECEIVED',
        memberId: transactionResult.promoOwnerIdToReward,
        data: { amount: transactionResult.promoRewardAmount }
      });
    }

    if (currentMemberId) {
      await NotificationHub.dispatch({
        eventId: 'BOOKING_CREATED',
        memberId: currentMemberId,
        data: {
          bookingId: transactionResult.booking.id,
          shortId: transactionResult.shortId,
          tourTitle: data.tourTitle,
          tourDate: data.tourDate,
          tourSlug: transactionResult.tourSlug,
          totalPrice: transactionResult.finalPrice,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          biletpmrLink: transactionResult.paymentLinks.biletpmrLink,
          apbQrLink: transactionResult.paymentLinks.apbQrLink,
          guests: data.guests,
          }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const clientEmail = (data.social && emailRegex.test(data.social.trim())) ? data.social.trim() : null;

    if (clientEmail) {
      await resend.emails.send({
        from: 'Турклуб EVA <info@evatur.club>',
        to: clientEmail,
        subject: `Ваш билет: ${data.tourTitle} 🏕️`,
        react: BookingTicketEmail({
          name: data.name,
          tourTitle: data.tourTitle,
          tourDate: data.tourDate,
          shortId: transactionResult.shortId,
          totalPrice: transactionResult.finalPrice,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          ticketsCount: totalSpots,
          siteUrl: SITE_URL
        })
      });
    }
  } catch (notificationError: unknown) {
    console.error('Ошибка рассылки уведомлений:', notificationError);
  }

  // Ревалидация кэша
  if (transactionResult.tourSlug) {
    revalidatePath(`/tour/${transactionResult.tourSlug}`);
  }
  revalidatePath('/tour');
  revalidatePath('/admin');
  revalidatePath('/account/bookings');
  revalidatePath('/account/dashboard');

  return {
    success: true,
    bookingId: transactionResult.booking.id,
    shortId: transactionResult.shortId,
    totalPrice: transactionResult.finalPrice,
    biletpmrLink: transactionResult.paymentLinks.biletpmrLink,
    apbQrLink: transactionResult.paymentLinks.apbQrLink,
    apbQrImage: transactionResult.paymentLinks.apbQrImage,
    paymentMethod: data.paymentMethod,
    redirectUrl,  
  };
});

// ---------- Вспомогательные функции ----------

async function notifyTelegram(
  data: BookingInput,
  bookingId: string,
  shortId: string,
  appliedBonuses: number = 0,
  finalPrice: number,
  apbInvoiceId: string | null = null, 
): Promise<void> {
  // Вычисляем места для Телеграм-отчета с помощью константы напрямую из модуля
  // (чтобы не дублировать SPOTS_PER_FAMILY)
  const { SPOTS_PER_FAMILY } = await import('../lib/pricing');
  const familySpots = data.ticketsFamily * SPOTS_PER_FAMILY;
  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember + familySpots;

  const guestsList = (data.guests || []).map((g: GuestInput, i: number) => {
    const jacketInfo = g.jacket ? ` | 🦺 ${g.jacket}` : '';
    const ageInfo = g.age ? ` | 👶 ${g.age} лет` : '';
    const phoneInfo = (!g.isMain && g.phone) ? ` | 📞 ${g.phone}` : '';
    if (g.isMain) {
      return `${i + 1}. 👤 <b>${escapeHtml(g.name || 'Заказчик')}</b> (Заказчик)${jacketInfo}`;
    }
    return `${i + 1}. 👤 ${escapeHtml(g.name || 'Без имени')} (${g.type})${ageInfo}${phoneInfo}${jacketInfo}`;
  }).join('\n');

  const paymentLabels: Record<string, string> = {
    biletpmr:    '💳 BiletPMR',
    qr:          '📱 Клевер (QR)',
    cash:        '💵 Наличными / Терминал',
    foreign:     '🌍 Из других стран',
    online_card: '🏦 Онлайн (Клевер / АПБ)',
  };
  const selectedPaymentStr = paymentLabels[data.paymentMethod] || data.paymentMethod;

  const lines = [
    `🎯 <b>НОВАЯ БРОНЬ (Сайт)</b>`,
    ``,
    `🆔 #<b>${shortId}</b>`,
    apbInvoiceId ? `🏦 APB Invoice: <code>${apbInvoiceId}</code>` : null,
    ``,
    `🏕 <b>${escapeHtml(data.tourTitle)}</b>`,
    `📅 ${escapeHtml(data.tourDate)}`,
    ``,
    `👥 <b>Список группы (${totalTickets} чел.):</b>`,
    guestsList,
    ``,
    `💰 Итого к оплате: <b>${finalPrice} ${data.currency}</b>`,
    appliedBonuses > 0 ? `🎁 Списано бонусов: <b>-${appliedBonuses} ${data.currency}</b>` : null,
    `💳 Способ оплаты: <b>${selectedPaymentStr}</b>`,
    ``,
    `👤 Заказчик: ${escapeHtml(data.name)}`,
    `📞 Телефон: ${escapeHtml(data.phone)}`,
    data.social  ? `💬 Контакт: ${escapeHtml(data.social)}`   : null,
    data.comment ? `📝 Комментарий: ${escapeHtml(data.comment)}` : null,
  ].filter(line => line !== null).join('\n');

  try {
    await publishToTelegram(
      lines,
      undefined,
      undefined,
      false,
      { messageThreadId: env.TELEGRAM_TOPIC_BOOKINGS }
    );
  } catch (error) {
    console.error('Ошибка отправки уведомления в Telegram:', error);
  }
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}