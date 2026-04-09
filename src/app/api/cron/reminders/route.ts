// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationHub } from '@/lib/notifications/hub';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'; // 🔥 ОФИЦИАЛЬНЫЙ ВАЛИДАТОР ПОДПИСИ

// Внутренняя функция-обработчик
async function handler(req: Request) {
  try {
    // 🛡 Ручная проверка CRON_SECRET убрана. 

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Функция для создания временного окна (целые сутки)
    const getDayRange = (daysOffset: number) => {
      const start = new Date(now);
      start.setDate(start.getDate() + daysOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { gte: start, lt: end };
    };

    const tomorrowRange = getDayRange(1);
    const in3DaysRange = getDayRange(3);

    // 🔥 ИСПРАВЛЕННЫЙ ЗАПРОС PRISMA (Правильный OR на верхнем уровне)
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        memberId: { not: null },
        OR: [
          {
            tourDate: {
              startDate: { gte: tomorrowRange.gte, lt: tomorrowRange.lt }
            }
          },
          {
            tourDate: {
              startDate: { gte: in3DaysRange.gte, lt: in3DaysRange.lt }
            }
          }
        ]
      },
      include: { tour: true, tourDate: true }
    });

    let sentCount = 0;

    for (const booking of bookings) {
      // 🔥 Безопасная проверка для TypeScript (убираем ошибки null)
      if (!booking.tourDate || !booking.memberId) continue;

      const isTomorrow = booking.tourDate.startDate < tomorrowRange.lt;
      const eventId = isTomorrow ? 'TOUR_TOMORROW_REMINDER' : 'TOUR_3DAY_REMINDER';

      try {
        await NotificationHub.dispatch({
          eventId,
          memberId: booking.memberId,
          data: {
            bookingId: booking.id,
            tourTitle: booking.tour.title,
            meetingPoint: booking.tourDate.meetingPoint || booking.tour.meetingPoint,
            meetingTime: booking.tourDate.time,
            paymentMethod: booking.paymentMethod,
            totalPrice: booking.totalPrice,
            currency: booking.tour.currency,
            checklist: booking.tour.checklist,
            groupChatUrl: booking.tourDate.groupChatUrl
          }
        });
        sentCount++;
      } catch (e) {
        console.error(`[Cron Reminder] Ошибка для брони ${booking.id}:`, e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount, 
      processed: bookings.length 
    });

  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 🔥 Оборачиваем обработчик в HOC от Qstash
export const GET = verifySignatureAppRouter(handler);
export const POST = verifySignatureAppRouter(handler);