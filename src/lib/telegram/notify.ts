// src/lib/telegram/notify.ts
import { prisma } from "@/lib/prisma";
import { NotificationHub } from '@/lib/notifications/hub';

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
    where: { tourId, tourDateId },
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