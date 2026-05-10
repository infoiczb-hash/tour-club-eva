// src/app/api/cron/audit-spots/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { logSystemAction } from '@/lib/audit';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { SPOTS_PER_FAMILY } from '@/features/tours/lib/pricing';
import { sendTelegramMessage } from '@/lib/telegram/notify';

const redis = Redis.fromEnv();
const RATE_LIMIT_KEY = 'cron:audit_spots:last_run';
const MIN_INTERVAL_MS = 55 * 60 * 1000; // защита от двойного запуска

export async function GET(req: Request) {
  // Защита: только Vercel Cron или вызов с CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Идемпотентность: не запускаться чаще раза в 55 минут
  const lastRun = await redis.get<number>(RATE_LIMIT_KEY);
  if (lastRun && Date.now() - lastRun < MIN_INTERVAL_MS) {
    return NextResponse.json({ skipped: true, reason: 'Too soon' });
  }
  await redis.set(RATE_LIMIT_KEY, Date.now(), { ex: 3600 });

  try {
    // 1. Берём все активные туры
    const tours = await prisma.tour.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, title: true, spots: true, spotsLeft: true },
    });

    // 2. Берём все активные даты туров
    const tourDates = await prisma.tourDate.findMany({
      where: { tour: { isActive: true, deletedAt: null } },
      select: { id: true, tourId: true, spots: true, spotsLeft: true },
    });

    // 3. Считаем реальное количество занятых мест по каждому туру и дате
    //    Одним запросом — группировка на стороне БД
    const bookedByTour = await prisma.booking.groupBy({
      by: ['tourId'],
      where: { status: { notIn: ['cancelled', 'rejected'] } },
      _sum: {
        ticketsAdult: true,
        ticketsChild: true,
        ticketsMember: true,
        ticketsFamily: true,
      },
    });

    const bookedByTourDate = await prisma.booking.groupBy({
      by: ['tourDateId'],
      where: {
        tourDateId: { not: null },
        status: { notIn: ['cancelled', 'rejected'] },
      },
      _sum: {
        ticketsAdult: true,
        ticketsChild: true,
        ticketsMember: true,
        ticketsFamily: true,
      },
    });

    // Индексируем для быстрого поиска
    const bookedTourMap = new Map(
      bookedByTour.map((b) => [
        b.tourId,
        (b._sum.ticketsAdult ?? 0) +
          (b._sum.ticketsChild ?? 0) +
          (b._sum.ticketsMember ?? 0) +
          (b._sum.ticketsFamily ?? 0) * SPOTS_PER_FAMILY,
      ])
    );

    const bookedDateMap = new Map(
      bookedByTourDate.map((b) => [
        b.tourDateId!,
        (b._sum.ticketsAdult ?? 0) +
          (b._sum.ticketsChild ?? 0) +
          (b._sum.ticketsMember ?? 0) +
          (b._sum.ticketsFamily ?? 0) * SPOTS_PER_FAMILY,
      ])
    );

    // 4. Ищем расхождения
    type Discrepancy = {
      type: 'tour' | 'tourDate';
      id: string;
      label: string;
      stored: number;
      real: number;
      diff: number;
    };

    const discrepancies: Discrepancy[] = [];

    for (const tour of tours) {
      const booked = bookedTourMap.get(tour.id) ?? 0;
      const realLeft = tour.spots - booked;
      if (realLeft !== tour.spotsLeft) {
        discrepancies.push({
          type: 'tour',
          id: tour.id,
          label: tour.title,
          stored: tour.spotsLeft,
          real: realLeft,
          diff: realLeft - tour.spotsLeft,
        });
      }
    }

    for (const date of tourDates) {
      const booked = bookedDateMap.get(date.id) ?? 0;
      const realLeft = date.spots - booked;
      if (realLeft !== date.spotsLeft) {
        discrepancies.push({
          type: 'tourDate',
          id: date.id,
          label: `date:${date.id.slice(0, 8)}`,
          stored: date.spotsLeft,
          real: realLeft,
          diff: realLeft - date.spotsLeft,
        });
      }
    }

    // 5. Если расхождений нет — тихо выходим
    if (discrepancies.length === 0) {
      return NextResponse.json({ ok: true, checked: tours.length + tourDates.length, discrepancies: 0 });
    }

    // 6. Автокоррекция + алерт в Telegram
    const fixes: string[] = [];

    for (const d of discrepancies) {
      if (d.type === 'tour') {
        await prisma.tour.update({
          where: { id: d.id },
          data: { spotsLeft: d.real },
        });
      } else {
        await prisma.tourDate.update({
          where: { id: d.id },
          data: { spotsLeft: d.real },
        });
      }
      fixes.push(
        `• ${d.label}: было ${d.stored} → стало ${d.real} (${d.diff > 0 ? '+' : ''}${d.diff})`
      );
    }

    // Алерт в Telegram-чат администратора
    const message =
      `⚠️ <b>Аудит мест: найдены расхождения</b>\n\n` +
      fixes.join('\n') +
      `\n\n<i>Исправлено автоматически.</i>`;

await sendTelegramMessage(env.TELEGRAM_ADMIN_CHAT_ID, message);

    // Логируем в audit_log
    await logSystemAction('SPOTS_AUDIT_AUTOCORRECT', {
      changes: { discrepancies },
    });

    return NextResponse.json({
      ok: true,
      checked: tours.length + tourDates.length,
      discrepancies: discrepancies.length,
      fixed: fixes,
    });
  } catch (error) {
    console.error('[audit-spots] Ошибка:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}