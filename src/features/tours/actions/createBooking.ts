// src/features/tours/actions/createBooking.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { Resend } from 'resend';
import { BookingTicketEmail } from '@/features/tours/emails/BookingTicketEmail';

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
  // ✅ ИСПРАВЛЕНИЕ БАГА 4: Строгая валидация телефона (trim + regex)
  phone: z.string()
    .trim()
    .min(7, 'Введите корректный номер телефона')
    .regex(/^[\d\+\-\s\(\)]+$/, 'Неверный формат телефона'),
  social: z.string().optional(),
  comment: z.string().optional(),

  website: z.string().optional(),

  ticketsAdult: z.number().int().min(0).default(1),
  ticketsChild: z.number().int().min(0).default(0),
  ticketsFamily: z.number().int().min(0).default(0),
  ticketsMember: z.number().int().min(0).default(0),

  guests: z.array(GuestSchema).optional(),

totalPrice: z.number().int().min(0),
  currency: z.string().default('RUB'),
  
  paymentMethod: z.enum(['biletpmr', 'qr', 'cash', 'foreign']).default('biletpmr'),
  useBonuses: z.boolean().default(false),
  
  // ✅ ДОБАВЛЕНО: ожидаемая цена и промокод
  expectedPrice: z.number().int().min(0),
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
  // ✅ БАГ 3 ИСПРАВЛЕН: Защита от дублирования заявок (Анти-спам)
  const existingBooking = await prisma.booking.findFirst({
    where: {
      phone: cleanPhone,
      tourId: data.tourId,
      tourDateId: data.tourDateId || null,
      // Ищем только активные, но еще не оплаченные заявки
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

  let transactionResult;
  // ✅ ИСПРАВЛЕНИЕ БАГА 1: Паттерн Retry (Optimistic Concurrency Control) для защиты от гонки shortId
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      transactionResult = await prisma.$transaction(async (tx) => {
        let spotsUpdated = false;
        let tourSlug: string | null = null;
        let tourCoverImage: string | null = null;

        // 1. Списание мест (Атомарно и безопасно на уровне БД)
        if (data.tourDateId) {
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
          const tourExists = await tx.tour.findFirst({
            where: { id: data.tourId, isActive: true, deletedAt: null },
            select: { id: true, slug: true, coverImage: true },
          });
          if (!tourExists) throw new Error('TOUR_UNAVAILABLE');
          throw new Error('SPOTS_GONE');
        }

        // 2. Генерация Short ID
        const lastBooking = await tx.booking.findFirst({
          orderBy: { shortId: 'desc' },
          select: { shortId: true }
        });
        const newShortId = (lastBooking?.shortId ?? 999) + 1;

        // 3. Данные тура
        const tour = await tx.tour.findUnique({
          where: { id: data.tourId },
          select: { 
            slug: true, 
            coverImage: true,
            biletpmrLink: true,
            apbQrLink: true,
            apbQrImage: true
          },
        });
        tourSlug = tour?.slug ?? null;
        tourCoverImage = tour?.coverImage ?? null;
        
      // 4. Логика скидок: Бонусы (Авторизованные) ИЛИ Промокод (Гости)
        let appliedDiscount = 0;
        let usedPromoCodeId: string | null = null;

        if (currentMemberId && data.useBonuses) {
          // Сценарий А: Авторизованный пользователь использует баланс
          const profile = await tx.memberProfile.findUnique({
            where: { id: currentMemberId },
            select: { balance: true }
          });

          if (profile && profile.balance > 0) {
            const maxDiscount = Math.floor(data.totalPrice * 0.1);
            appliedDiscount = Math.min(profile.balance, maxDiscount);

            if (appliedDiscount > 0) {
              await tx.memberProfile.update({
                where: { id: currentMemberId },
                data: { balance: { decrement: appliedDiscount } }
              });
            }
          }
        } else if (!currentMemberId && data.promoCode) {
          // Сценарий Б: Гость применяет промокод
          const promo = await tx.promoCode.findUnique({
            where: { code: data.promoCode.trim().toUpperCase() }
          });

          if (promo && promo.isActive) {
            const isExpired = promo.validUntil && promo.validUntil < new Date();
            
            if (!isExpired) {
              appliedDiscount = promo.discount;
              usedPromoCodeId = promo.id;

              // 1. Увеличиваем счетчик использований промокода
              await tx.promoCode.update({
                where: { id: promo.id },
                data: { usageCount: { increment: 1 } }
              });

              // 2. Начисляем награду (reward) владельцу промокода на баланс
              if (promo.memberId) {
                await tx.memberProfile.update({
                  where: { id: promo.memberId },
                  data: { balance: { increment: promo.reward } }
                });
              }
            }
          }
        }

        // Защита от отрицательной цены
        const finalPrice = Math.max(0, data.totalPrice - appliedDiscount);

        // ✅ БАГ 6: Паттерн "Ожидаемая цена" (Защита от рассинхрона)
        if (finalPrice > data.expectedPrice){
          throw new Error('PRICE_MISMATCH');
        }

        // 5. ОПРЕДЕЛЯЕМ НАЧАЛЬНЫЙ СТАТУС В ЗАВИСИМОСТИ ОТ МЕТОДА ОПЛАТЫ
        let initialStatus: 'pending' | 'awaiting_payment' = 'pending';
        if (['biletpmr', 'qr', 'foreign'].includes(data.paymentMethod)) {
          initialStatus = 'awaiting_payment';
        } else if (data.paymentMethod === 'cash') {
          initialStatus = 'pending'; 
        }

        const newBooking = await tx.booking.create({
          data: {
            shortId:       newShortId,
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
            guests:        (data.guests || []) as Prisma.InputJsonValue,
            comment:       data.comment || null,
            totalPrice:    finalPrice,
            discount: appliedDiscount,
            source:        'website',
            status:        initialStatus,
            bookedDate:    new Date(),
            paymentMethod: data.paymentMethod 
          },
        });

        return { 
          booking: newBooking, 
          tourSlug, 
          tourCoverImage,
          shortId: newShortId,
          paymentLinks: {
            biletpmrLink: tour?.biletpmrLink,
            apbQrLink: tour?.apbQrLink,
            apbQrImage: tour?.apbQrImage
          },
          finalPrice,
          appliedDiscount
        };
      });
      
      // Если дошли сюда, транзакция успешна, выходим из цикла Retry
      break;

    } catch (error: any) {
      // Если ошибка уникальности Prisma (P2002) - кто-то другой уже занял этот shortId
      if (error?.code === 'P2002' && attempt < MAX_RETRIES) {
        console.warn(`[Booking] Гонка shortId обнаружена. Попытка перезапуска ${attempt + 1}/${MAX_RETRIES}`);
        continue; // Пробуем заново!
      }
      
      // Если это кастомная ошибка (мест нет) или кончились попытки - пробрасываем дальше
    if (error instanceof Error) {
        // ✅ Обработка рассинхрона цены
        if (error.message === 'PRICE_MISMATCH') {
          return { success: false, error: 'Итоговая цена изменилась (возможно, ваш баланс был списан или промокод недействителен). Пожалуйста, обновите страницу и проверьте сумму.' };
        }
        if (error.message === 'TOUR_UNAVAILABLE') {
          return { success: false, error: 'Тур не найден или недоступен' };
        }
        if (error.message === 'SPOTS_GONE') {
          return {
            success: false,
            error: 'Последние места на эту дату были выкуплены прямо сейчас.'
          };
        }
      }
      
      console.error('Booking Transaction Error:', error);
      return {
        success: false,
        error: 'Произошла ошибка при сохранении заявки. Попробуйте еще раз.'
      };
    }
  }

  // Если цикл закончился, но transactionResult пустой (что маловероятно при правильной работе throw)
  if (!transactionResult) {
    return { success: false, error: 'Не удалось создать заявку из-за высокой нагрузки. Повторите попытку.' };
  }

  // Рассылка уведомлений вне транзакции
  try {
    // 1. Уведомление АДМИНУ
    await notifyTelegram(data, transactionResult.booking.id, transactionResult.tourCoverImage, transactionResult.appliedDiscount, transactionResult.finalPrice);

    // 2. Уведомление КЛИЕНТУ (если привязан ТГ)
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

    // 3. EMAIL-ФОЛЛБЭК
    const clientEmail = (data.social && data.social.includes('@')) 
      ? data.social.trim() 
      : null;

    if (clientEmail) {
      try {
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
            ticketsCount: totalTickets,
            siteUrl: SITE_URL
          })
        });
      } catch (emailErr) {
        console.error('Ошибка отправки Email:', emailErr);
      }
    }
  } catch (notificationError) {
    console.error('Ошибка рассылки уведомлений:', notificationError);
  }
if (transactionResult.tourSlug) {
    revalidatePath(`/tour/${transactionResult.tourSlug}`);
  }
  
  // ✅ Наши обновленные пути кэша
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
    paymentMethod: data.paymentMethod 
  };
}

async function notifyTelegram(
  data: BookingInput, 
  bookingId: string, 
  coverImage?: string | null, 
  appliedBonuses: number = 0, 
  finalPrice?: number
): Promise<void> {
  const token  = env.TELEGRAM_BOT_TOKEN;
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
    biletpmr: '💳 Онлайн (BiletPMR)',
    qr: '📱 Клевер (QR)',
    cash: '💵 Наличными / Терминал',
    foreign: '🌍 Из других стран'
  };
  const selectedPaymentStr = paymentLabels[data.paymentMethod] || data.paymentMethod;
  const displayPrice = finalPrice ?? data.totalPrice;

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
    `💰 Итого к оплате: <b>${displayPrice} ${data.currency}</b>`,
    appliedBonuses > 0 ? `🎁 Списано бонусов: <b>-${appliedBonuses} ${data.currency}</b>` : null,
    `💳 Способ оплаты: <b>${selectedPaymentStr}</b>`,
    data.comment ? `\n💬 Комментарий: ${escapeHtml(data.comment)}` : null,
    ``,
    `🆔 <code>${bookingId}</code>`,
  ].filter((l): l is string => l !== null).join('\n');

  const inlineKeyboard = [];
  
  if (data.paymentMethod === 'cash' || data.paymentMethod === 'foreign') {
    inlineKeyboard.push([{ text: '✅ Подтвердить бронь', callback_data: `confirm_${bookingId}` }]);
  }
  
  inlineKeyboard.push([{ text: '👤 Открыть в Админке', url: `${SITE_URL}/admin` }]);

  const body: Record<string, unknown> = {
    chat_id: chatId,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      inline_keyboard: inlineKeyboard,
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
