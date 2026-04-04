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
import { withRateLimit } from '@/lib/rate-limit-server'; // <-- НОВЫЙ ИМПОРТ

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

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
  tourDateId: z.string().uuid('Пожалуйста, выберите конкретную дату').optional().nullable(),
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

  // ⚠️ УДАЛЕНО: totalPrice - мы больше не доверяем фронтенду
  // totalPrice: z.number().int().min(0).optional(), 
  currency: z.string().default('RUB'),
  
  paymentMethod: z.enum(['biletpmr', 'qr', 'cash', 'foreign']).default('biletpmr'),
  useBonuses: z.boolean().default(false),
  promoCode: z.string().optional(),
});

export type BookingInput = z.infer<typeof BookingSchema>;

export type BookingResult =
  | { 
      success: true; 
      bookingId: string;
      shortId: number;
      totalPrice: number;
      biletpmrLink?: string | null;
      apbQrLink?: string | null;
      apbQrImage?: string | null;
      paymentMethod?: string;
    }
  | { success: false; error: string; fields?: Record<string, string> };

// Оборачиваем весь action в withRateLimit
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
      shortId: 0,
      totalPrice: 0
    };
  }

  const familySpots = data.ticketsFamily * 3;
  const totalTickets = data.ticketsAdult + data.ticketsChild + data.ticketsMember + familySpots;
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
  } catch (e) {
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
    shortId: number;
    paymentLinks: {
      biletpmrLink: string | null;
      apbQrLink: string | null;
      apbQrImage: string | null;
    };
    finalPrice: number;
    appliedDiscount: number;
  } | null = null;

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      transactionResult = await prisma.$transaction(async (tx) => {
        // ---------- 1. Атомарное списание мест и получение данных о ценах ----------
        let priceAdult: number;
        let priceChild: number;
        let priceFamily: number;
        let priceMember: number;
        let tourSlug: string | null = null;
        let tourCoverImage: string | null = null;
        let biletpmrLink: string | null = null;
        let apbQrLink: string | null = null;
        let apbQrImage: string | null = null;

        if (data.tourDateId) {
          // Обновляем конкретную дату, проверяя наличие мест
          const updatedTourDate = await tx.tourDate.update({
            where: {
              id: data.tourDateId,
              spotsLeft: { gte: totalTickets },
              tour: { isActive: true, deletedAt: null }
            },
            data: {
              spotsLeft: { decrement: totalTickets }
            },
            select: {
              basePrice: true,
              tour: {
                select: {
                  price: true,
                  priceChild: true,
                  priceFamily: true,
                  priceMember: true,
                  slug: true,
                  coverImage: true,
                  biletpmrLink: true,
                  apbQrLink: true,
                  apbQrImage: true,
                }
              }
            }
          });

          // Цена взрослого: если у даты указан basePrice, используем его, иначе цену из тура
          priceAdult = updatedTourDate.basePrice ?? updatedTourDate.tour.price;
          // Детские, семейные, членские цены всегда из тура (в TourDate нет отдельных переопределений)
          priceChild = updatedTourDate.tour.priceChild ?? priceAdult; 
          priceFamily = updatedTourDate.tour.priceFamily ?? priceAdult;
          priceMember = updatedTourDate.tour.priceMember ?? priceAdult;
          
          tourSlug = updatedTourDate.tour.slug;
          tourCoverImage = updatedTourDate.tour.coverImage;
          biletpmrLink = updatedTourDate.tour.biletpmrLink;
          apbQrLink = updatedTourDate.tour.apbQrLink;
          apbQrImage = updatedTourDate.tour.apbQrImage;
        } else {
          // Обновляем общий тур
          const updatedTour = await tx.tour.update({
            where: {
              id: data.tourId,
              isActive: true,
              deletedAt: null,
              spotsLeft: { gte: totalTickets }
            },
            data: {
              spotsLeft: { decrement: totalTickets }
            },
            select: {
              price: true,
              priceChild: true,
              priceFamily: true,
              priceMember: true,
              slug: true,
              coverImage: true,
              biletpmrLink: true,
              apbQrLink: true,
              apbQrImage: true,
            }
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

        // ---------- 2. Расчёт базовой цены на основе серверных данных ----------
        // 🔥 ВОТ ЗДЕСЬ И ЕСТЬ ГЛАВНАЯ ЗАЩИТА 🔥
        // Мы игнорируем всё, что прислал клиент, и пересчитываем цену сами
        const baseTotalPrice =
          data.ticketsAdult * priceAdult +
          data.ticketsChild * priceChild +
          data.ticketsFamily * priceFamily +
          data.ticketsMember * priceMember;

        // ---------- 3. Применение скидок (промокод или бонусы) ----------
        let appliedDiscount = 0;
        let usedPromoCodeId: string | null = null;

        if (!currentMemberId && data.promoCode) {
          const promoCodeRaw = data.promoCode.trim().toUpperCase();
          const promo = await tx.promoCode.findUnique({
            where: { code: promoCodeRaw }
          });

          if (!promo || !promo.isActive) throw new Error('PROMO_INVALID');
          if (promo.validUntil && promo.validUntil < new Date()) throw new Error('PROMO_EXPIRED');

          if (promo.type === 'percent') {
            appliedDiscount = Math.floor(baseTotalPrice * (promo.discount / 100));
          } else {
            appliedDiscount = promo.discount;
          }
          // Ограничиваем скидку, чтобы цена не стала отрицательной
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
          }
        } else if (currentMemberId && data.useBonuses) {
          const profile = await tx.memberProfile.findUnique({
            where: { id: currentMemberId },
            select: { balance: true }
          });
          if (profile && profile.balance > 0) {
            const maxDiscount = Math.floor(baseTotalPrice * 0.1); // максимум 10% от цены
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

        // ---------- 4. Генерация shortId (с защитой от гонки) ----------
        const lastBooking = await tx.booking.findFirst({
          orderBy: { shortId: 'desc' },
          select: { shortId: true }
        });
        const newShortId = (lastBooking?.shortId ?? 999) + 1;

        // ---------- 5. Определяем начальный статус в зависимости от метода оплаты ----------
        let initialStatus: 'pending' | 'awaiting_payment' = 'pending';
        if (['biletpmr', 'qr', 'foreign'].includes(data.paymentMethod)) {
          initialStatus = 'awaiting_payment';
        } else if (data.paymentMethod === 'cash') {
          initialStatus = 'pending';
        }

        // ---------- 6. Создаём бронь ----------
        const newBooking = await tx.booking.create({
          data: {
            shortId: newShortId,
            tourId: data.tourId,
            tourDateId: data.tourDateId || null,
            memberId: currentMemberId,
            name: data.name,
            phone: cleanPhone,
            email: data.social?.includes('@') ? data.social : null,
            social: data.social || null,
            ticketsAdult: data.ticketsAdult,
            ticketsChild: data.ticketsChild,
            ticketsFamily: data.ticketsFamily,
            ticketsMember: data.ticketsMember,
            guests: (data.guests || []) as Prisma.InputJsonValue,
            comment: data.comment || null,
            totalPrice: finalPrice,  // Используем серверный расчёт!
            discount: appliedDiscount,
            promoCodeId: usedPromoCodeId,
            source: 'website',
            status: initialStatus,
            bookedDate: new Date(),
            paymentMethod: data.paymentMethod
          },
        });

        return {
          booking: newBooking,
          tourSlug,
          tourCoverImage,
          shortId: newShortId,
          paymentLinks: { biletpmrLink, apbQrLink, apbQrImage },
          finalPrice,
          appliedDiscount
        };
      });

      // Транзакция успешна — выходим из цикла
      break;
    } catch (error: any) {
      // Конфликт shortId — повторяем попытку
      if (error?.code === 'P2002' && attempt < MAX_RETRIES) {
        console.warn(`[Booking] Race condition on shortId. Retry ${attempt + 1}/${MAX_RETRIES}`);
        continue;
      }

      // Обработка известных бизнес-ошибок
      if (error instanceof Error) {
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
      // Ошибка Prisma P2025 (запись не найдена при update) — мест нет или тур неактивен
      if (error?.code === 'P2025') {
        return { success: false, error: 'Выбранная дата или тур больше не доступны. Места могли закончиться.' };
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

  // ---------- Отправка уведомлений (вне транзакции) ----------
  try {
    await notifyTelegram(
      data,
      transactionResult.booking.id,
      transactionResult.shortId,
      transactionResult.appliedDiscount,
      transactionResult.finalPrice // Передаем серверный finalPrice
    );

    // Уведомление клиенту в Telegram, если есть chatId
    if (currentMemberId) {
      const profile = await prisma.memberProfile.findUnique({
        where: { id: currentMemberId },
        select: { tgChatId: true }
      });
      if (profile?.tgChatId) {
        let clientMessage = `🏕 Ваша заявка <b>#${transactionResult.shortId}</b> на тур «${data.tourTitle}» успешно создана!\nМеста за вами зарезервированы.\n\n`;
        if (data.paymentMethod === 'biletpmr') {
          clientMessage += `💳 Статус: <b>Ожидает оплаты</b>.\nЕсли Вам удобно оплатить на biletpmr, можно перейти по ссылке на сайте. Цена может отличаться (не применяются бонусные оплаты и промокод), так как это сторонний сервис оплаты. После оплаты вы можете отправить нам билет сюда, или ожидайте, пока мы проверим вручную.`;
        } else if (data.paymentMethod === 'qr') {
          clientMessage += `🧾 Статус: <b>Ожидает чека</b>.\nВы выбрали оплату по системе Клевер (QR-код). Пожалуйста, отправьте скриншот перевода прямо в этот чат, и мы подтвердим вашу бронь!`;
        } else if (data.paymentMethod === 'cash') {
          clientMessage += `💵 Статус: <b>Оплата гиду на месте</b>.\nДоговорились! Подготовьте сумму без сдачи к дню тура. За 3 дня и за сутки до выезда бот пришлет вам запрос на подтверждение участия — не пропустите! Рекомендуем выбрать другой способ оплаты или оплатить через платежные терминалы АПБ. Выберите там ТурКлуб "Эва". Квитанцию можете отправить нам сюда.`;
        } else if (data.paymentMethod === 'foreign') {
          clientMessage += `🌍 Статус: <b>Ожидает оплаты</b>.\nДля оплаты свяжитесь напрямую с менеджерами: https://t.me/romansvtirase`;
        }
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: profile.tgChatId,
            text: clientMessage,
            parse_mode: 'HTML'
          })
        });
      }
    }

    // Email-уведомление
    const clientEmail = (data.social && data.social.includes('@')) ? data.social.trim() : null;
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
          totalPrice: transactionResult.finalPrice, // Серверный finalPrice
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          ticketsCount: totalTickets,
          siteUrl: SITE_URL
        })
      });
    }
  } catch (notificationError) {
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
    totalPrice: transactionResult.finalPrice, // Возвращаем клиенту серверный finalPrice
    biletpmrLink: transactionResult.paymentLinks.biletpmrLink,
    apbQrLink: transactionResult.paymentLinks.apbQrLink,
    apbQrImage: transactionResult.paymentLinks.apbQrImage,
    paymentMethod: data.paymentMethod
  };
});

// ---------- Вспомогательные функции ----------
async function notifyTelegram(
  data: BookingInput,
  bookingId: string,
  shortId: number,
  appliedBonuses: number = 0,
  finalPrice: number // Убрал опциональность
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    console.warn('Telegram credentials missing');
    return;
  }

  const familySpots = data.ticketsFamily * 3;
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
    biletpmr: '💳 BiletPMR',
    qr: '📱 Клевер (QR)',
    cash: '💵 Наличными / Терминал',
    foreign: '🌍 Из других стран'
  };
  const selectedPaymentStr = paymentLabels[data.paymentMethod] || data.paymentMethod;

  const lines = [
    `🎯 <b>НОВАЯ БРОНЬ (Сайт)</b>`,
    ``,
    `🆔 #<b>${shortId}</b>`,
    ``,
    `🏕 <b>${escapeHtml(data.tourTitle)}</b>`,
    `📅 ${escapeHtml(data.tourDate)}`,
    ``,
    `👥 <b>Список группы (${totalTickets} чел.):</b>`,
    guestsList,
    ``,
    `💰 Итого к оплате: <b>${finalPrice} ${data.currency}</b>`, // Использован finalPrice
    appliedBonuses > 0 ? `🎁 Списано бонусов: <b>-${appliedBonuses} ${data.currency}</b>` : null,
    `💳 Способ оплаты: <b>${selectedPaymentStr}</b>`,
    ``,
    `👤 Заказчик: ${escapeHtml(data.name)}`,
    `📞 Телефон: ${escapeHtml(data.phone)}`,
    data.social ? `💬 Контакт: ${escapeHtml(data.social)}` : null,
    data.comment ? `📝 Комментарий: ${escapeHtml(data.comment)}` : null,
  ].filter(line => line !== null).join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Ошибка отправки уведомления в Telegram:', error);
  }
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}