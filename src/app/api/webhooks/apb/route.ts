// src/app/api/webhooks/apb/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { apbClient } from '@/lib/apb/client';
import { env } from '@/lib/env';
import { logSystemAction } from '@/lib/audit';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { NotificationHub } from '@/lib/notifications/hub';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { BookingTicketEmail } from '@/features/tours/emails/BookingTicketEmail';
import { NotificationTemplates } from '@/lib/notifications/templates';

// Строгий тип для брони с подгруженными связями
type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { tour: true; tourDate: true };
}>;

const ok = () => new NextResponse('OK', { status: 200 });

export async function POST(req: NextRequest) {
  return handleWebhook(req);
}

export async function GET(req: NextRequest) {
  return handleWebhook(req);
}

async function handleWebhook(req: NextRequest): Promise<NextResponse> {
  let params: Record<string, string> = {};

  // 1. НАДЕЖНЫЙ ПАРСИНГ: берем данные отовсюду
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key.toLowerCase()] = value;
  });

  if (req.method === 'POST') {
    try {
      const text = await req.text();
      if (text) {
        const urlParams = new URLSearchParams(text);
        urlParams.forEach((value, key) => {
          params[key.toLowerCase()] = value;
        });
      }
    } catch (e) {
      console.error('[APB Webhook] Ошибка чтения тела POST:', e);
    }
  }

  // 2. НОРМАЛИЗАЦИЯ ПАРАМЕТРОВ (Защита от расхождений в доках АПБ)
  if (!params['signature'] && params['signaturevalue']) {
    params['signature'] = params['signaturevalue'];
  }
  if (!params['paymentcurrency'] && params['paymentcurrcode']) {
    params['paymentcurrency'] = params['paymentcurrcode'];
  }
  if (!params['rrn'] && params['rm']) {
    params['rrn'] = params['rm'];
  }

  const invoiceId  = params['invoiceid'];
  const status     = params['status'];     
  const signature  = params['signature'];
  const isTest     = params['istest'];     

  console.log(`[APB Webhook] Получен запрос: invoiceId=${invoiceId} status=${status} istest=${isTest}`);

  if (!invoiceId || !status || !signature) {
    console.error('[APB Webhook] Отсутствуют обязательные параметры', params);
    return ok();
  }

  // 3. ПРОВЕРКА КРИПТОГРАФИЧЕСКОЙ ПОДПИСИ (Главный гарант безопасности)
  const isValidSignature = apbClient.verifyWebhookSignature(params);
  if (!isValidSignature) {
    console.error(`[APB Webhook] Неверная подпись для invoiceId=${invoiceId}`);
    await logSystemAction('APB_WEBHOOK_INVALID_SIGNATURE', {
      targetId: invoiceId, 
      changes:  { params }, 
    });
    return ok(); 
  }

  const booking = await prisma.booking.findUnique({
    where:   { apbInvoiceId: invoiceId },
    include: { tour: true, tourDate: true },
  });

  if (!booking) {
    console.error(`[APB Webhook] Бронь с apbInvoiceId=${invoiceId} не найдена`);
    return ok();
  }

  // ВАЖНО: Если страница успеха уже обработала оплату, просто выходим
  if (booking.status === 'confirmed') {
    console.log(`[APB Webhook] Бронь ${invoiceId} уже подтверждена, пропускаем`);
    return ok();
  }

  let paymentState: any = null;
  try {
    paymentState = await apbClient.getPaymentState(invoiceId);
    console.log(`[APB Webhook] GetState: stateCode=${paymentState.stateCode} isPaid=${paymentState.isPaid}`);
  } catch (err) {
    console.error(`[APB Webhook] GetState failed для ${invoiceId}:`, err);
  }

  // 4. FALLBACK: Обходим баг тестовой среды АПБ (когда SOAP не отвечает или отдает false)
  const isPaidWebhook = status.toLowerCase() === 'paid';
  if (!paymentState || (!paymentState.isPaid && isPaidWebhook)) {
    console.log(`[APB Webhook] Используем Fallback по криптографической подписи вебхука.`);
    paymentState = {
      isPaid: isPaidWebhook,
      sum: parseInt(params['paymentsum'] || '0', 10),
      stateCode: isPaidWebhook ? 1 : 0,
      rrn: params['rrn'] || null,
      lastDigits: params['lastdgt'] || null,
      authCode: null,
      stateDescription: status
    };
  }

  // 5. ИСПРАВЛЕНИЕ МАТЕМАТИКИ: Защита от дробей
  const expectedSumKop = Math.round(booking.totalPrice * 100); 

  if (paymentState.isPaid) {
    if (paymentState.sum !== expectedSumKop) {
      console.error(`[APB FRAUD ALERT] Сумма не совпадает! Ожидали: ${expectedSumKop}, получили: ${paymentState.sum}`);
      await logSystemAction('APB_PAYMENT_FRAUD_AMOUNT', {
        targetId: booking.id,
        changes:  { expected: expectedSumKop, actual: paymentState.sum },
      });
      return ok(); 
    }

    await handlePaymentSuccess(booking, paymentState);
  } else {
    await handlePaymentFail(booking, paymentState);
  }

  return ok();
}

// ─────────────────────────────────────────────
// УСПЕШНАЯ ОПЛАТА
// ─────────────────────────────────────────────
async function handlePaymentSuccess(
  booking: BookingWithRelations,
  state: any,
) {
  try {
    // 1. Обновляем БД
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status:        'confirmed',
        apbRrn:        state.rrn,
        apbAuthCode:   state.authCode,
        apbLastDigits: state.lastDigits,
        paidAt:        state.paidAt ?? new Date(),
        amountPaid:    booking.totalPrice,
        confirmedAt:   new Date(),
        confirmedBy:   'APB_WEBHOOK_AUTO',
      },
    });

    await logSystemAction('APB_PAYMENT_CONFIRMED', {
      targetId: booking.id,
      changes:  {
        invoiceId:  booking.apbInvoiceId,
        rrn:        state.rrn,
        authCode:   state.authCode,
        lastDigits: state.lastDigits,
        sum:        state.sum,
      },
    });

    // 2. Уведомление в Админ-чат
    const adminMsg = [
      `🟢 <b>Онлайн-оплата подтверждена (Вебхук)</b>`,
      ``,
      `🆔 Бронь #<b>${booking.shortId}</b>`,
      `🏦 Invoice: <code>${booking.apbInvoiceId}</code>`,
      `👤 ${booking.name ?? 'Клиент'} | 📞 ${booking.phone}`,
      `🏕 ${booking.tour.title}`,
      `💰 ${booking.totalPrice} ${booking.tour.currency}`,
      state.rrn        ? `🔑 RRN: <code>${state.rrn}</code>`              : null,
      state.lastDigits ? `💳 Карта: ****${state.lastDigits}`              : null,
    ].filter(Boolean).join('\n');

    await publishToTelegram(
      adminMsg, undefined, undefined, false, { messageThreadId: env.TELEGRAM_TOPIC_BOOKINGS }
    );

    // ─── 3. СИСТЕМА УВЕДОМЛЕНИЙ ДЛЯ КЛИЕНТА (Telegram, Email, In-App) ───
    
    const eventData = {
      bookingId:    booking.id,
      shortId:      booking.shortId,
      tourTitle:    booking.tour.title,
      totalPrice:   Number(booking.totalPrice),
      currency:     booking.tour.currency ?? 'RUB',
      meetingPoint: booking.tourDate?.meetingPoint || booking.tour.meetingPoint,
      meetingTime:  booking.tourDate?.time,
      importantInfo: booking.tour.importantInfo,
      checklist:    booking.tour.checklist as any[],
      groupChatUrl: booking.tourDate?.groupChatUrl,
      tourDate:     booking.tourDate?.startDate ? new Date(booking.tourDate.startDate).toLocaleDateString('ru-RU') : 'Дата уточняется'
    };

    const content = await NotificationTemplates.compile('BOOKING_CONFIRMED', eventData, { name: booking.name });

    if (content) {
      // А) TELEGRAM: Прямая отправка гостям и тем, кто нажал /start (Приоритет: payerTgChatId)
      const targetTgId = booking.payerTgChatId;
      if (targetTgId) {
        try {
          await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetTgId,
              text: content.telegram.text,
              parse_mode: 'HTML',
              reply_markup: content.telegram.buttons ? { inline_keyboard: content.telegram.buttons } : undefined
            })
          });
        } catch (tgError) {
          console.error(`[APB Webhook] Ошибка отправки Telegram гостю ${booking.id}:`, tgError);
        }
      }

      // Б) EMAIL: Для всех, кто оставил почту
      const clientEmail = booking.email || (booking.social && booking.social.includes('@') ? booking.social : null);
      if (clientEmail && content.email) {
        try {
          const resend = new Resend(env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Турклуб EVA <info@evatur.club>',
            to: clientEmail,
            subject: content.email.subject,
            html: content.email.html
          });
          console.log(`[APB Webhook] Билет успешно отправлен на email: ${clientEmail}`);
        } catch (emailError) {
          console.error(`[APB Webhook] Ошибка отправки Email для ${booking.id}:`, emailError);
        }
      }
    }

    // В) HUB: Внутренние уведомления для авторизованных на сайте
    if (booking.memberId) {
      await NotificationHub.dispatch({
        eventId: 'BOOKING_CONFIRMED',
        memberId: booking.memberId,
        data: eventData
      });
    }

    // 4. Сброс кэша
    revalidatePath('/admin');
    revalidatePath('/account/bookings');
    revalidatePath('/account/dashboard');
    if (booking.tour.slug) {
      revalidatePath(`/tour/${booking.tour.slug}`);
    }

  } catch (err) {
    console.error(`[APB Webhook] Ошибка при подтверждении брони ${booking.id}:`, err);
  }
}

async function handlePaymentFail(
  booking: BookingWithRelations,
  state: any,
) {
  await logSystemAction('APB_PAYMENT_FAILED', {
    targetId: booking.id,
    changes:  {
      invoiceId:  booking.apbInvoiceId,
      stateCode:  state.stateCode,
      stateDescription: state.stateDescription,
    },
  });

  if (booking.memberId && state.stateCode === 4) {
    await NotificationHub.dispatch({
      eventId: 'PAYMENT_REJECTED',
      memberId: booking.memberId,
      data: {
        bookingId:  booking.id,
        shortId:    booking.shortId,
        tourTitle:  booking.tour.title,
        tourSlug:   booking.tour.slug,
      },
    });
  }
}