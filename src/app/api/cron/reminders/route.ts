// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { NotificationHub } from '@/lib/notifications/hub';
import { Redis } from '@upstash/redis'; // ✅ ДОБАВИЛИ ИМПОРТ REDIS

const redis = Redis.fromEnv(); // ✅ ИНИЦИАЛИЗАЦИЯ REDIS

export async function GET(req: Request) {
  try {
    // 🛡 ЗАЩИТА VERCEL CRON: Проверяем секретный ключ
    const authHeader = req.headers.get('authorization');
    if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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

    // ИСПРАВЛЕННЫЙ ЗАПРОС PRISMA
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        memberId: { not: null },
        OR: [
          { tourDate: { startDate: { gte: tomorrowRange.gte, lt: tomorrowRange.lt } } },
          { tourDate: { startDate: { gte: in3DaysRange.gte, lt: in3DaysRange.lt } } }
        ]
      },
      include: { tour: true, tourDate: true }
    });

    let sentCount = 0;
    
    // 🔥 ОПТИМИЗАЦИЯ: Собираем задачи в массив для параллельной отправки
    const notificationPromises: Promise<any>[] = [];

    for (const booking of bookings) {
      // Безопасная проверка для TypeScript (убираем ошибки null)
      if (!booking.tourDate || !booking.memberId) continue;

      const isTomorrow = booking.tourDate.startDate < tomorrowRange.lt;
      const eventId = isTomorrow ? 'TOUR_TOMORROW_REMINDER' : 'TOUR_3DAY_REMINDER';

      // ✅ ИСПРАВЛЕНИЕ 6: Защита от дублей при случайном двойном вызове крона (TTL 20 часов)
      const redisKey = `reminder_sent:${eventId}:${booking.id}`;
      // Пытаемся записать ключ. nx: true гарантирует, что запись произойдет ТОЛЬКО если ключа еще нет
      const isSent = await redis.set(redisKey, '1', { ex: 20 * 60 * 60, nx: true });
      
      // Если ключ уже был в Redis (isSent === null), значит сегодня этому клиенту уже отправляли это напоминание
      if (!isSent) continue;

      notificationPromises.push(
        NotificationHub.dispatch({
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
        })
        .then(() => { sentCount++; })
        .catch(async (e) => { 
          console.error(`[Cron Reminder] Ошибка для брони ${booking.id}:`, e);
          // ✅ ОТКАТ REDIS: Если Хаб упал и сообщение не ушло, удаляем ключ в Redis, 
          // чтобы попытаться снова при следующем запуске (или ручном ретрае Vercel)
          await redis.del(redisKey);
        })
      );
    }

    // Выполняем все запросы Хаба параллельно!
    if (notificationPromises.length > 0) {
      await Promise.allSettled(notificationPromises);
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