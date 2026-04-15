import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { NotificationHub } from '@/lib/notifications/hub';
import { logSystemAction } from '@/lib/audit'; // ✅ ДОБАВИЛИ ИМПОРТ АУДИТА

const redis = Redis.fromEnv();

export async function GET(req: Request) {
  try {
    // 🛡 ЗАЩИТА VERCEL CRON: Проверяем секретный ключ
    const authHeader = req.headers.get('authorization');
    if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notificationPromises: Promise<any>[] = [];
    let winbackCount = 0;
    let crosssellCount = 0;

    // ==========================================
    // СЦЕНАРИЙ А: WIN-BACK (90 ДНЕЙ)
    // ==========================================
    const target90DaysStart = new Date(today);
    target90DaysStart.setDate(target90DaysStart.getDate() - 90);
    
    const target90DaysEnd = new Date(target90DaysStart);
    target90DaysEnd.setHours(23, 59, 59, 999);

    const sleepingBookings = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        memberId: { not: null },
        OR: [
          { tourDate: { endDate: { gte: target90DaysStart, lte: target90DaysEnd } } },
          { tourDate: { endDate: null, startDate: { gte: target90DaysStart, lte: target90DaysEnd } } }
        ]
      },
      include: { tour: true, member: true }
    });

    for (const booking of sleepingBookings) {
      if (!booking.memberId || !booking.member) continue;

      const recentBooking = await prisma.booking.findFirst({
        where: {
          memberId: booking.memberId,
          status: { in: ['confirmed', 'awaiting_payment', 'pending'] },
          createdAt: { gt: booking.createdAt }
        }
      });

      if (!recentBooking) {
        const redisKey = `winback_sent:${booking.memberId}`;
        const isSent = await redis.set(redisKey, '1', { ex: 180 * 24 * 60 * 60, nx: true });

        if (isSent) {
          const namePart = booking.member.name ? booking.member.name.split(' ')[0].toUpperCase() : 'FRIEND';
          const promoCodeString = `COMEBACK-${namePart}-${Math.floor(100 + Math.random() * 900)}`;
          const discountValue = 50; 
          
          const validUntil = new Date();
          validUntil.setDate(validUntil.getDate() + 14);

          await prisma.promoCode.create({
            data: {
              code: promoCodeString,
              discount: discountValue,
              type: 'fixed',
              validUntil: validUntil,
              usageCount: 0,
              isActive: true,
              memberId: booking.memberId
            }
          });

          notificationPromises.push(
            NotificationHub.dispatch({
              eventId: 'WIN_BACK_OFFER',
              memberId: booking.memberId,
              data: {
                lastTourTitle: booking.tour.title,
                promoCode: promoCodeString,
                discount: discountValue
              }
            })
          );
          winbackCount++;
        }
      }
    }

    // ==========================================
    // СЦЕНАРИЙ Б: CROSS-SELL (7 ДНЕЙ)
    // ==========================================
    const target7DaysStart = new Date(today);
    target7DaysStart.setDate(target7DaysStart.getDate() - 7);
    
    const target7DaysEnd = new Date(target7DaysStart);
    target7DaysEnd.setHours(23, 59, 59, 999);

    const freshBookings = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        memberId: { not: null },
        OR: [
          { tourDate: { endDate: { gte: target7DaysStart, lte: target7DaysEnd } } },
          { tourDate: { endDate: null, startDate: { gte: target7DaysStart, lte: target7DaysEnd } } }
        ]
      },
      include: { tour: { include: { category: true } }, member: true }
    });

    for (const booking of freshBookings) {
      if (!booking.memberId) continue;

      const redisKey = `crosssell_sent:${booking.memberId}`;
      const isSent = await redis.set(redisKey, '1', { ex: 30 * 24 * 60 * 60, nx: true });
      
      if (isSent) {
        const categorySlug = booking.tour.category?.slug || '';
        let categoryTransitionText = 'Самое время попробовать новый формат отдыха!';

        if (categorySlug === 'kayaking') {
            categoryTransitionText = 'Вы отлично справились с байдарками! Как насчет того, чтобы поймать баланс и встретить рассвет на SUP-бордах?';
        } else if (categorySlug === 'hiking') {
            categoryTransitionText = 'Горы покорены! Но наши водные маршруты не менее живописны. Попробуйте сплав на байдарках!';
        } else if (categorySlug === 'sup') {
            categoryTransitionText = 'Вода — ваша стихия! Предлагаем сменить обстановку и отправиться в легкий трекинг по живописным лесам.';
        }

        notificationPromises.push(
          NotificationHub.dispatch({
            eventId: 'CROSS_SELL_OFFER',
            memberId: booking.memberId,
            data: {
              lastTourTitle: booking.tour.title,
              categoryTransitionText: categoryTransitionText
            }
          })
        );
        crosssellCount++;
      }
    }

    if (notificationPromises.length > 0) {
      await Promise.allSettled(notificationPromises);
    }

    // ✅ СИСТЕМНЫЙ АУДИТ: Успешное выполнение
    Promise.resolve().then(() => {
      logSystemAction('CRON_SALES_BOT_EXECUTED', {
        changes: { winbackSent: winbackCount, crosssellSent: crosssellCount }
      }).catch(console.error);
    });

    return NextResponse.json({ 
      success: true, 
      winbackSent: winbackCount, 
      crosssellSent: crosssellCount 
    });

  // ✅ ИСПРАВЛЕНИЕ ТИПОВ: Заменили error на error: unknown
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Sales Bot Error]:', err);
    
    // ✅ СИСТЕМНЫЙ АУДИТ: Логируем ошибку CRON-задачи
    Promise.resolve().then(() => {
      logSystemAction('CRON_SALES_BOT_ERROR', {
        changes: { error: err.message, stack: err.stack }
      }).catch(console.error);
    });

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}