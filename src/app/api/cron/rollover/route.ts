import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const RATE_LIMIT_KEY = 'cron:rollover:last_run';
const MIN_INTERVAL_MS = 25 * 60 * 1000; // 25 минут

export async function GET(req: Request) {
  try {
    // Защита от посторонних
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting через Redis — не запускаем чаще чем раз в 25 минут
    const lastRun = await redis.get<number>(RATE_LIMIT_KEY);
    if (lastRun && Date.now() - lastRun < MIN_INTERVAL_MS) {
      return NextResponse.json({ 
        skipped: true, 
        reason: 'Too soon',
        nextRunIn: `${Math.round((MIN_INTERVAL_MS - (Date.now() - lastRun)) / 1000 / 60)} мин`
      });
    }

    const now = new Date();

    // Находим туры где ВСЕ даты уже прошли → деактивируем
    const expiredTours = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        tourDates: { none: {} }, // нет дат вообще — пропускаем
      },
      select: { id: true, slug: true },
    });

    // Туры у которых есть даты но все прошли
    const toursWithAllDatesPast = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        tourDates: {
          every: { startDate: { lt: now } },
        },
        NOT: { tourDates: { none: {} } },
      },
      select: { id: true, slug: true },
    });

    let deactivatedCount = 0;

    if (toursWithAllDatesPast.length > 0) {
      await prisma.tour.updateMany({
        where: { id: { in: toursWithAllDatesPast.map(t => t.id) } },
        data: { isActive: false },
      });
      deactivatedCount = toursWithAllDatesPast.length;

      // Ревалидируем страницы конкретных туров
      for (const tour of toursWithAllDatesPast) {
        revalidatePath(`/tour/${tour.slug}`);
      }
    }

    // Всегда ревалидируем главную и каталог
    revalidatePath('/');
    revalidatePath('/tour');

    // Записываем время последнего запуска в Redis
    await redis.set(RATE_LIMIT_KEY, Date.now(), { ex: 60 * 60 }); // TTL 1 час

    return NextResponse.json({ 
      success: true,
      deactivated: deactivatedCount,
      tours: toursWithAllDatesPast.map(t => t.slug),
    });

  } catch (error) {
    console.error('Cron rollover error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}