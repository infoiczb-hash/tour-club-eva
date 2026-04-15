// src/app/api/cron/cancel-unpaid/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';
import { NotificationHub } from '@/lib/notifications/hub';
import { revalidatePath } from 'next/cache';
import { notifyWaitlistOnSpotFreed } from '@/lib/telegram/notify'; 
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'; // 🔥 ОФИЦИАЛЬНЫЙ ВАЛИДАТОР ПОДПИСИ ВОЗВРАЩЕН

const redis = Redis.fromEnv();
const RATE_LIMIT_KEY = 'cron:cancel_unpaid:last_run';
const MIN_INTERVAL_MS = 55 * 60 * 1000; // 55 минут защита от двойного запуска

// Временные рамки (в часах)
const REMINDER_HOURS = 24; 
const CANCEL_HOURS = 48;   

// Внутренняя функция-обработчик
async function handler(req: Request) {
  try {
    const lastRun = await redis.get<number>(RATE_LIMIT_KEY);
    if (lastRun && Date.now() - lastRun < MIN_INTERVAL_MS) {
      return NextResponse.json({ skipped: true, reason: 'Too soon' });
    }

    const deadline24h = new Date(Date.now() - REMINDER_HOURS * 60 * 60 * 1000);
    
    const deadSouls = await prisma.booking.findMany({
      where: {
        status: 'awaiting_payment',
        createdAt: { lt: deadline24h }
      },
      include: { member: true, tour: true }
    });

    let cancelledCount = 0;
    let remindedCount = 0;

    // 🔥 ОПТИМИЗАЦИЯ: Собираем все долгие задачи (уведомления) в массив, чтобы выполнить параллельно
    const notificationPromises: Promise<any>[] = [];

    for (const booking of deadSouls) {
      try {
        const ageInHours = (Date.now() - booking.createdAt.getTime()) / (1000 * 60 * 60);
        const shortId = booking.shortId || parseInt(booking.id.substring(0, 4), 16); // Фолбэк

        // --- ЛОГИКА 1: ПРОШЛО 48 ЧАСОВ (ОТМЕНА) ---
        if (ageInHours >= CANCEL_HOURS) {
          await prisma.$transaction(async (tx) => {
            const totalTickets = (booking.ticketsAdult || 0) + (booking.ticketsChild || 0) + (booking.ticketsMember || 0) + ((booking.ticketsFamily || 0) * 3);

            if (booking.tourDateId) {
              await tx.tourDate.update({ where: { id: booking.tourDateId }, data: { spotsLeft: { increment: totalTickets } } });
            } else {
              await tx.tour.update({ where: { id: booking.tourId }, data: { spotsLeft: { increment: totalTickets } } });
            }

            await tx.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
          });

          cancelledCount++;

          // Добавляем отправку уведомления в массив задач (не ждем через await прямо тут)
          if (booking.memberId) {
            notificationPromises.push(
              NotificationHub.dispatch({
                eventId: 'BOOKING_AUTO_CANCELLED',
                memberId: booking.memberId,
                data: {
                  bookingId: booking.id,
                  shortId: shortId,
                  tourTitle: booking.tour.title,
                }
              })
            );
          }

          // 🔥 Снайпинг: места физически освободились, зовем ждунов
          notificationPromises.push(notifyWaitlistOnSpotFreed(booking.tourId, booking.tourDateId));
        }

        // --- ЛОГИКА 2: ПРОШЛО ОТ 24 ДО 48 ЧАСОВ (НАПОМИНАНИЕ) ---
        else if (ageInHours >= REMINDER_HOURS) {
          const redisKey = `reminder_sent:${booking.id}`;
          const isReminded = await redis.get(redisKey);

          if (!isReminded) {
            // Добавляем напоминание в массив задач
            if (booking.memberId) {
               notificationPromises.push(
                 NotificationHub.dispatch({
                   eventId: 'PAYMENT_REMINDER_24H',
                   memberId: booking.memberId,
                   data: {
                     bookingId: booking.id,
                     shortId: shortId,
                     tourTitle: booking.tour.title,
                   }
                 })
               );
            }
            
            await redis.set(redisKey, '1', { ex: 48 * 60 * 60 });
            remindedCount++;
          }
        }

      } catch (err) {
        console.error(`Ошибка обработки брони ${booking.id}:`, err);
      }
    }

    // 🔥 Выполняем все сетевые запросы Хаба и Листа ожидания параллельно! Это спасет от таймаута.
    if (notificationPromises.length > 0) {
      await Promise.allSettled(notificationPromises);
    }

    if (cancelledCount > 0) {
      revalidatePath('/tour');
      revalidatePath('/admin');
    }

    await redis.set(RATE_LIMIT_KEY, Date.now(), { ex: 60 * 60 });

    return NextResponse.json({ 
      success: true,
      processed: deadSouls.length,
      reminded: remindedCount,
      cancelled: cancelledCount 
    });

  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 🔥 Оборачиваем обработчик в HOC от Qstash для безопасного вызова
export const GET = verifySignatureAppRouter(handler);
export const POST = verifySignatureAppRouter(handler);