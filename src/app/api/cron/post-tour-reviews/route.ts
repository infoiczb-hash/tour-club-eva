import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationHub } from '@/lib/notifications/hub';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'; // 🔥 ОФИЦИАЛЬНЫЙ ВАЛИДАТОР ПОДПИСИ

// Внутренняя функция-обработчик (без экпорта)
async function handler(req: Request) {
  try {
    // 🛡 Ручная проверка CRON_SECRET убрана. 
    // Если код дошел до этой строки, значит verifySignatureAppRouter уже 
    // криптографически подтвердил подлинность запроса от серверов Qstash.

    // Определяем вчерашние сутки
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Ищем брони со вчерашних туров
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        memberId: { not: null },
        OR: [
          // Если есть дата конца, и она была вчера
          { tourDate: { endDate: { gte: yesterdayStart, lt: todayStart } } },
          // Если даты конца нет (однодневный тур), то старт был вчера
          { tourDate: { endDate: null, startDate: { gte: yesterdayStart, lt: todayStart } } }
        ]
      },
      include: { tour: true }
    });

    let sentCount = 0;

    for (const booking of bookings) {
      if (!booking.memberId) continue;

      // Проверяем, не оставил ли он уже отзыв (чтобы не спамить)
      const existingReview = await prisma.review.findFirst({
        where: { tourId: booking.tourId, memberId: booking.memberId }
      });

      if (!existingReview) {
        try {
          await NotificationHub.dispatch({
            eventId: 'REVIEW_REQUEST',
            memberId: booking.memberId,
            data: {
              tourTitle: booking.tour.title
            }
          });
          sentCount++;
        } catch (e) {
          console.error(`[Cron Review] Ошибка для брони ${booking.id}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount, processed: bookings.length });

  } catch (error) {
    console.error('Cron review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 🔥 Оборачиваем обработчик в HOC (High Order Component) от Qstash
export const GET = verifySignatureAppRouter(handler);
export const POST = verifySignatureAppRouter(handler);