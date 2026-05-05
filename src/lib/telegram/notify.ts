// src/lib/telegram/notify.ts
import { prisma } from "@/lib/prisma";
import { NotificationHub } from '@/lib/notifications/hub';

// === НОВАЯ ФУНКЦИЯ ДЛЯ СИСТЕМНЫХ И АДМИНСКИХ АЛЕРТОВ (КРОНЫ) ===
export async function sendTelegramMessage(chatId: string | number, text: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN не задан. Отправка системного сообщения отменена.");
    return;
  }
  
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    console.error(`Ошибка отправки ТГ сообщения в чат ${chatId}:`, error);
  }
}
// ===============================================================

// 1. Уведомление о появлении НОВЫХ ДАТ в расписании
export async function notifySubscribersOnNewDates(
  tourId: string,
  categoryId: string | null,
  tourTitle: string,
  tourSlug: string
) {
  // 1. Ждуны (Waitlist)
  const waitlistUsers = await prisma.waitlist.findMany({
    where: { tourId },
    include: { member: true },
  });

  // 2. Избранное (только неуведомленные)
  const favoritedUsers = await prisma.watchList.findMany({
    where: { tourId, notified: false },
    include: { member: true },
  });

  // 3. Подписчики категории
  const categoryUsers = categoryId
    ? await prisma.watchList.findMany({
        where: { categoryId, notified: false },
        include: { member: true },
      })
    : [];

  const allMembers = [
    ...waitlistUsers.map(u => u.memberId),
    ...favoritedUsers.map(u => u.memberId),
    ...categoryUsers.map(u => u.memberId),
  ].filter(Boolean);

  const uniqueMemberIds = [...new Set(allMembers)];

  // Прогоняем всех через Хаб
  for (const memberId of uniqueMemberIds) {
    await NotificationHub.dispatch({
      eventId: 'NEW_DATES_PUBLISHED',
      memberId: memberId as string,
      data: { tourTitle, tourSlug }
    });
  }

  // Помечаем WatchList как уведомленные
  const watchlistIdsToMark = [
    ...favoritedUsers.map(w => w.id),
    ...categoryUsers.map(w => w.id),
  ];

  if (watchlistIdsToMark.length > 0) {
    await prisma.watchList.updateMany({
      where: { id: { in: watchlistIdsToMark } },
      data:  { notified: true },
    });
  }

  // Очищаем Waitlist (уведомленные)
  const notifiedWaitlistIds = waitlistUsers.filter(w => w.memberId).map(w => w.id);
  if (notifiedWaitlistIds.length > 0) {
    await prisma.waitlist.deleteMany({
      where: { id: { in: notifiedWaitlistIds } }
    });
  }
}

// 2. СНАЙПИНГ: Уведомление об освобождении мест (Отмена брони)
export async function notifyWaitlistOnSpotFreed(tourId: string, tourDateId: string | null = null) {
  const waitlist = await prisma.waitlist.findMany({
    where: {
      tourId,
      OR: [
        { tourDateId: tourDateId },
        { tourDateId: null }
      ]
    },
    include: { tour: true }
  });

  if (waitlist.length === 0) return;

  for (const w of waitlist) {
    if (w.memberId) {
      await NotificationHub.dispatch({
        eventId: 'WAITLIST_ALERT',
        memberId: w.memberId,
        data: {
          tourTitle: w.tour.title,
          tourSlug: w.tour.slug,
        }
      });
    }
  }

  // Очищаем Waitlist (кто успел, тот и забронировал)
  const notifiedWaitlistIds = waitlist.filter(w => w.memberId).map(w => w.id);
  if (notifiedWaitlistIds.length > 0) {
    await prisma.waitlist.deleteMany({
      where: { id: { in: notifiedWaitlistIds } }
    });
  }
}