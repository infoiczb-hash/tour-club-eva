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

// Строгий тип для брони с подгруженными связями
type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { tour: true; tourDate: true };
}>;

// ─────────────────────────────────────────────
// Хелпер: быстрый ответ банку
// АПБ ожидает HTTP 200 — иначе будет повторять запрос
// ─────────────────────────────────────────────
const ok = () => new NextResponse('OK', { status: 200 });

// ─────────────────────────────────────────────
// Банк может слать как POST так и GET (зависит от настройки ResultURL метода)
// Поддерживаем оба
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  return handleWebhook(req);
}

export async function GET(req: NextRequest) {
  return handleWebhook(req);
}

// ─────────────────────────────────────────────
// ОСНОВНОЙ ОБРАБОТЧИК
// ─────────────────────────────────────────────
async function handleWebhook(req: NextRequest): Promise<NextResponse> {
  // ---------- 1. Читаем параметры ----------
  let params: Record<string, string> = {};

  if (req.method === 'GET') {
    req.nextUrl.searchParams.forEach((value, key) => {
      params[key.toLowerCase()] = value;
    });
  } else {
    try {
      const body = await req.text();
      const urlParams = new URLSearchParams(body);
      urlParams.forEach((value, key) => {
        params[key.toLowerCase()] = value;
      });
    } catch {
      console.error('[APB Webhook] Failed to parse POST body');
      return ok(); // Отвечаем 200 чтобы банк не ретраил
    }
  }

  const invoiceId  = params['invoiceid'];
  const status     = params['status'];     // 'paid' | 'fail'
  const signature  = params['signature'];
  const isTest     = params['istest'];     // '0' | '1'

  console.log(`[APB Webhook] Получен запрос: invoiceId=${invoiceId} status=${status} istest=${isTest}`);

  // ---------- 2. Базовая валидация параметров ----------
  if (!invoiceId || !status || !signature) {
    console.error('[APB Webhook] Отсутствуют обязательные параметры', params);
    return ok();
  }

  //--------- 3. Проверка подписи ----------
  const isValidSignature = apbClient.verifyWebhookSignature(params);
  if (!isValidSignature) {
    console.error(`[APB Webhook] Неверная подпись для invoiceId=${invoiceId}`);
    
    await logSystemAction('APB_WEBHOOK_INVALID_SIGNATURE', {
      targetId: invoiceId, // Используем invoiceId, так как booking еще нет
      changes:  { params }, // Записываем то, что прислал хакер/банк
    });
    return ok(); // 200 чтобы не раскрывать причину отказа
  }
  // ---------- 4. Находим бронь по apbInvoiceId ----------
  const booking = await prisma.booking.findUnique({
    where:   { apbInvoiceId: invoiceId },
    include: { tour: true, tourDate: true },
  });

  if (!booking) {
    console.error(`[APB Webhook] Бронь с apbInvoiceId=${invoiceId} не найдена`);
    return ok();
  }

  // ---------- 5. Защита от повторной обработки ----------
  if (booking.status === 'confirmed') {
    console.log(`[APB Webhook] Бронь ${invoiceId} уже подтверждена, пропускаем`);
    return ok();
  }

  // ---------- 6. Двойная проверка через GetState ----------
  let paymentState;
  try {
    paymentState = await apbClient.getPaymentState(invoiceId);
  } catch (err) {
    console.error(`[APB Webhook] GetState failed для ${invoiceId}:`, err);
    return ok(); // Не обновляем бронь — лучше дождаться следующего вебхука
  }

  console.log(`[APB Webhook] GetState: stateCode=${paymentState.stateCode} isPaid=${paymentState.isPaid}`);

  // ---------- 7. Обработка результата ----------
  const expectedSumKop = booking.totalPrice * 100; // Наша цена в копейках

  if (paymentState.isPaid) {
    // 🔴 КРИТИЧЕСКАЯ ЗАЩИТА: Проверка на подмену суммы оплаты (Partial Payment Fraud)
    if (paymentState.sum !== expectedSumKop) {
      console.error(`[APB FRAUD ALERT] Сумма не совпадает! Ожидали: ${expectedSumKop}, получили: ${paymentState.sum}. Бронь: ${invoiceId}`);
     await logSystemAction('APB_PAYMENT_FRAUD_AMOUNT', {
  targetId: booking.id,
  changes:  { expected: expectedSumKop, actual: paymentState.sum },
});
      return ok(); // Глушим вебхук, чтобы не выдавать билет
    }

    // ✅ ОПЛАТА ПОДТВЕРЖДЕНА И СУММА СОВПАДАЕТ
    await handlePaymentSuccess(booking, paymentState);
  } else {
    // ❌ ОПЛАТА НЕ ПРОШЛА (fail, ошибка, просрочен)
    await handlePaymentFail(booking, paymentState);
  }

  return ok();
}

// ─────────────────────────────────────────────
// УСПЕШНАЯ ОПЛАТА
// ─────────────────────────────────────────────
async function handlePaymentSuccess(
  booking: BookingWithRelations,
  state: Awaited<ReturnType<typeof apbClient.getPaymentState>>,
) {
  try {
    // Атомарно обновляем бронь и пишем все данные от банка
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
        confirmedBy:   'APB_AUTO',
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

    // Уведомление в Telegram-топик броней
    const msg = [
      `✅ <b>Онлайн-оплата подтверждена (АПБ)</b>`,
      ``,
      `🆔 Бронь #<b>${booking.shortId}</b>`,
      `🏦 Invoice: <code>${booking.apbInvoiceId}</code>`,
      `👤 ${booking.name ?? 'Клиент'} | 📞 ${booking.phone}`,
      `🏕 ${booking.tour.title}`,
      `💰 ${booking.totalPrice} ${booking.tour.currency}`,
      state.rrn        ? `🔑 RRN: <code>${state.rrn}</code>`              : null,
      state.lastDigits ? `💳 Карта: ****${state.lastDigits}`              : null,
      state.authCode   ? `🔐 Код авторизации: <code>${state.authCode}</code>` : null,
    ].filter(Boolean).join('\n');

    await publishToTelegram(
      msg,
      undefined,
      undefined,
      false,
      { messageThreadId: env.TELEGRAM_TOPIC_BOOKINGS },
    );

    // Уведомление клиенту через Хаб (если авторизован)
    if (booking.memberId) {
      await NotificationHub.dispatch({
        eventId: 'BOOKING_CONFIRMED',
        memberId: booking.memberId,
        data: {
          bookingId:    booking.id,
          shortId:      booking.shortId,
          tourTitle:    booking.tour.title,
          totalPrice:   booking.totalPrice,
          currency:     booking.tour.currency,
          meetingPoint: booking.tourDate?.meetingPoint ?? booking.tour.meetingPoint,
          meetingTime:  booking.tourDate?.time,
          importantInfo: booking.tour.importantInfo,
        },
      });
    }

    // Сбрасываем кэш страниц
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

// ─────────────────────────────────────────────
// НЕУСПЕШНАЯ ОПЛАТА
// ─────────────────────────────────────────────
async function handlePaymentFail(
  booking: BookingWithRelations,
  state: Awaited<ReturnType<typeof apbClient.getPaymentState>>,
) {
  // stateCode 4 = просрочен, 3 = ошибка, 2 = отменён
  // Во всех случаях оставляем бронь в awaiting_payment —
  // клиент может попробовать ещё раз или выбрать другой метод оплаты
  // Статус менять на cancelled не нужно — это делает крон cancel-unpaid

  await logSystemAction('APB_PAYMENT_FAILED', {
    targetId: booking.id,
    changes:  {
      invoiceId:  booking.apbInvoiceId,
      stateCode:  state.stateCode,
      stateDescription: state.stateDescription,
    },
  });

  console.log(
    `[APB Webhook] Оплата не прошла для брони ${booking.id}: ${state.stateDescription}`,
  );

  // Уведомляем клиента только если он авторизован и оплата именно просрочена
  // (stateCode 4) — в остальных случаях он уже видит /payment/fail
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