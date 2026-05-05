// src/app/api/cron/rollover/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Redis } from '@upstash/redis';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'; // 🔥 ОФИЦИАЛЬНЫЙ ВАЛИДАТОР ПОДПИСИ
import { sendTelegramMessage } from '@/lib/telegram/notify'; //   ДОБАВЛЕН ИМПОРТ

const redis = Redis.fromEnv();
const RATE_LIMIT_KEY = 'cron:rollover:last_run';
const MIN_INTERVAL_MS = 25 * 60 * 1000; // 25 минут

// Внутренняя функция-обработчик
async function handler(req: Request) {
  try {
    // 🛡 Ручная проверка CRON_SECRET убрана, используется QStash. 

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

    // ========================================================
    // 1. ПОИСК "МЕРТВЫХ" ТУРОВ (Все даты в прошлом)
    // ========================================================
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

      //   ИСПРАВЛЕНИЕ: Уведомляем администратора о скрытии туров
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (adminChatId) {
        const tourNames = toursWithAllDatesPast.map(t => t.slug).join(', ');
        await sendTelegramMessage(
          adminChatId, 
          `🔄 <b>CRON: АРХИВАЦИЯ ТУРОВ</b>\n\nАвтоматически скрыты туры (прошли все даты):\n<code>${tourNames}</code>\n\nПожалуйста, добавьте им новые даты или переведите их в архив.`
        );
      }
    }

    // ========================================================
    // 2. 🔥 НОВОЕ: ПОИСК "ЖИВЫХ" ТУРОВ (С прошедшей датой)
    // ========================================================
    // Их не нужно архивировать, но ИХ КЭШ НУЖНО СБРОСИТЬ, чтобы пропали старые даты
    const ongoingToursWithPastDates = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        tourDates: { some: { startDate: { lt: now } } }, // Есть хотя бы одна прошедшая дата
        NOT: {
          id: { in: toursWithAllDatesPast.map(t => t.id) } // Исключаем те, что мы только что убили в шаге 1
        }
      },
      select: { slug: true }
    });

    // Сброс кэша для живых туров (чтобы TourCard и внутренние страницы перерисовались)
    let revalidatedOngoingCount = 0;
    for (const tour of ongoingToursWithPastDates) {
      revalidatePath(`/tour/${tour.slug}`);
      revalidatedOngoingCount++;
    }

    // ========================================================
    // 3. ГЛОБАЛЬНЫЙ СБРОС И ЗАВЕРШЕНИЕ
    // ========================================================
    // Всегда ревалидируем главную и каталог
    revalidatePath('/');
    revalidatePath('/tour');

    // Записываем время последнего запуска в Redis
    await redis.set(RATE_LIMIT_KEY, Date.now(), { ex: 60 * 60 }); // TTL 1 час

    return NextResponse.json({ 
      success: true,
      deactivated: deactivatedCount,
      revalidatedOngoing: revalidatedOngoingCount, // Добавили в отчет
      tours: toursWithAllDatesPast.map(t => t.slug),
    });

  } catch (error) {
    console.error('Cron rollover error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 🔥 Оборачиваем обработчик в HOC от Qstash
export const GET = verifySignatureAppRouter(handler);
export const POST = verifySignatureAppRouter(handler);