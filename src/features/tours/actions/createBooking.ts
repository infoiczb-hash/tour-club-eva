// src/features/tours/actions/createBooking.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { Resend } from 'resend';
import { BookingTicketEmail } from '@/features/tours/emails/BookingTicketEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
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
  
  // ✅ ДОБАВЛЕНО: Валидация способа оплаты
  paymentMethod: z.enum(['biletpmr', 'qr', 'cash', 'foreign']).default('biletpmr'),

  // ✅ ДОБАВЛЕНО: Флаг для списания баланса
  useBonuses: z.boolean().default(false),
});

export type BookingInput = z.infer<typeof BookingSchema>;

export type BookingResult =
  | { 
      success: true; 
      bookingId: string;
      // ✅ ДОБАВЛЕНЫ НОВЫЕ ПОЛЯ ДЛЯ ЭКРАНА УСПЕХА
      shortId: number;
      totalPrice: number;
      biletpmrLink?: string | null;
      apbQrLink?: string | null;
      apbQrImage?: string | null;
      paymentMethod?: string; // ✅ Добавили для возврата на фронт
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

if (data.website && data.website.length > 0) {
    console.warn('Bot detected via honeypot field');
    return { 
      success: true, 
      bookingId: 'sp-checked',
      shortId: 0,       // ✅ Добавили для TypeScript
      totalPrice: 0     // ✅ Добавили для TypeScript
    };
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
    const result = await prisma.$transaction(async (tx) => {
      let spotsUpdated = false;
      let tourSlug: string | null = null;
      let tourCoverImage: string | null = null;

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

      // ✅ 1. ГЕНЕРАЦИЯ УНИКАЛЬНОГО SHORT_ID
      const lastBooking = await tx.booking.findFirst({
        orderBy: { shortId: 'desc' },
        select: { shortId: true }
      });
      const newShortId = (lastBooking?.shortId ?? 999) + 1;

      // ✅ 2. ДОСТАЕМ РЕКВИЗИТЫ ОПЛАТЫ
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
      
      // ✅ 3. ЛОГИКА ОПЛАТЫ БОНУСАМИ
      let appliedBonuses = 0;
      if (data.useBonuses && currentMemberId) {
        const profile = await tx.memberProfile.findUnique({
          where: { id: currentMemberId },
          select: { balance: true }
        });

        if (profile && profile.balance > 0) {
          // Скидка максимум 10% от итоговой стоимости
          const maxDiscount = Math.floor(data.totalPrice * 0.1);
          appliedBonuses = Math.min(profile.balance, maxDiscount);

          if (appliedBonuses > 0) {
            // Безопасно списываем бонусы у юзера в рамках транзакции
            await tx.memberProfile.update({
              where: { id: currentMemberId },
              data: { balance: { decrement: appliedBonuses } }
            });
          }
        }
      }

      // Финальная цена после скидки
      const finalPrice = data.totalPrice - appliedBonuses;

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
          guests:        data.guests || [],
          comment:       data.comment || null,
          totalPrice:    finalPrice, // ✅ Сохраняем цену со скидкой
          discount:      appliedBonuses, // ✅ Пишем размер скидки в БД
          source:        'website',
          status:        'pending',
          bookedDate:    new Date(),
          
          // ВНИМАНИЕ: Сохранение метода оплаты в базу.
          // Если Prisma будет ругаться на paymentMethod, значит в schema.prisma
          // нужно добавить это поле (или мы закомментируем эту строку пока что).
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
        appliedBonuses
      };
    });

  try {
      // 1. Уведомление АДМИНУ (то, что уже было) + передаем информацию о бонусах
      await notifyTelegram(data, result.booking.id, result.tourCoverImage, result.appliedBonuses, result.finalPrice);

      // 2. НОВОЕ: Уведомление КЛИЕНТУ (если он авторизован и привязал ТГ)
      if (currentMemberId) {
        const profile = await prisma.memberProfile.findUnique({
          where: { id: currentMemberId },
          select: { tgChatId: true }
        });

        if (profile?.tgChatId) {
          let clientMessage = `🏕 Ваша заявка <b>#${result.shortId}</b> на тур «${data.tourTitle}» успешно создана!\nМеста за вами зарезервированы.\n\n`;

          if (data.paymentMethod === 'biletpmr') {
            clientMessage += `💳 Статус: <b>Ожидает оплаты</b>.\nПожалуйста, оплатите билеты онлайн на сайте (в личном кабинете). После успешной транзакции мы активируем ваш билет.`;
          } else if (data.paymentMethod === 'qr') {
            clientMessage += `🧾 Статус: <b>Ожидает чека</b>.\nВы выбрали оплату по QR-коду. Пожалуйста, отправьте скриншот перевода прямо в этот чат, и мы подтвердим вашу бронь!`;
          } else if (data.paymentMethod === 'cash') {
            clientMessage += `💵 Статус: <b>Оплата гиду на месте</b>.\nМы закрепили за вами места! За сутки до выезда мы пришлем сюда запрос на подтверждение участия и точные координаты сбора.`;
          } else if (data.paymentMethod === 'foreign') {
            clientMessage += `🌍 Статус: <b>Ожидает ответа менеджера</b>.\nСкоро мы напишем вам прямо здесь, чтобы согласовать детали перевода и ответить на вопросы.`;
          }

          // Отправляем сообщение от лица пользовательского бота
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
    // 👇 СЮДА ВСТАВЛЯЕМ ТВОЙ БЛОК 👇
      // ✅ ФАЗА 1: EMAIL-ФОЛЛБЭК
      const clientEmail = (data.social && data.social.includes('@')) 
        ? data.social.trim() 
        : null;

      if (clientEmail) {
        try {
          await resend.emails.send({
            // ⚠️ Для теста ставь 'onboarding@resend.dev', пока домен не Verify в панели Resend!
            from: 'Турклуб EVA <info@evatur.club>', 
            to: clientEmail,
            subject: `Ваш билет: ${data.tourTitle} 🏕️`,
            react: BookingTicketEmail({
              name: data.name,
              tourTitle: data.tourTitle,
              tourDate: data.tourDate,
              shortId: result.shortId,
              totalPrice: result.finalPrice, // ✅ ИСПРАВЛЕНО: цена с учетом списанных бонусов
              currency: data.currency,
              paymentMethod: data.paymentMethod,
              ticketsCount: totalTickets,
              siteUrl: SITE_URL
            })
          });
          console.log(`Email отправлен на ${clientEmail}`);
        } catch (emailErr) {
          console.error('Ошибка отправки Email:', emailErr);
        }
      }
    } catch (tgError) {
      console.error('Ошибка отправки в Telegram:', tgError);
    }

    
    if (result.tourSlug) {
      revalidatePath(`/tour/${result.tourSlug}`);
    }
    revalidatePath('/tour');
    revalidatePath('/admin');
    revalidatePath('/account', 'layout');

  return { 
      success: true, 
      bookingId: result.booking.id,
      shortId: result.shortId,
      totalPrice: result.finalPrice, // ✅ Возвращаем итоговую цену со скидкой
      biletpmrLink: result.paymentLinks.biletpmrLink,
      apbQrLink: result.paymentLinks.apbQrLink,
      apbQrImage: result.paymentLinks.apbQrImage,
      paymentMethod: data.paymentMethod // ✅ Возвращаем метод оплаты
    };

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

// ✅ Обновили аргументы функции для приема бонусов и финальной цены
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

  const guestsList = (data.guests || []).map((g: any, i: number) => {
    const jacketInfo = g.jacket ? ` | 🦺 ${g.jacket}` : '';
    const ageInfo = g.age ? ` | 👶 ${g.age} лет` : '';
    const phoneInfo = (!g.isMain && g.phone) ? ` | 📞 ${g.phone}` : '';

    if (g.isMain) {
      return `${i + 1}. 👤 <b>${escapeHtml(g.name || 'Заказчик')}</b> (Заказчик)${jacketInfo}`;
    }
    return `${i + 1}. 👤 ${escapeHtml(g.name || 'Без имени')} (${g.type})${ageInfo}${phoneInfo}${jacketInfo}`;
  }).join('\n');

  // ✅ 4. Переводим метод оплаты на человеческий язык для Telegram
  const paymentLabels: Record<string, string> = {
    biletpmr: '💳 Онлайн (BiletPMR)',
    qr: '📱 QR-код (Агропромбанк)',
    cash: '💵 Наличными гиду',
    foreign: '🌍 Из других стран (MIA/Леи)'
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
    appliedBonuses > 0 ? `🎁 Списано бонусов: <b>-${appliedBonuses} ${data.currency}</b>` : null, // ✅ Отображаем скидку
    `💳 Способ оплаты: <b>${selectedPaymentStr}</b>`, // ✅ Добавлено в уведомление
    data.comment ? `\n💬 Комментарий: ${escapeHtml(data.comment)}` : null,
    ``,
    `🆔 <code>${bookingId}</code>`,
  ].filter((l): l is string => l !== null).join('\n');

const body: Record<string, unknown> = {
    chat_id: chatId,
    parse_mode: 'HTML',
    reply_markup: JSON.stringify({
      inline_keyboard: [
        // ✅ ДОБАВИЛИ КНОПКУ ПОДТВЕРЖДЕНИЯ (передаем ID брони в callback_data)
        [{ text: '✅ Подтвердить оплату', callback_data: `confirm_${bookingId}` }],
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