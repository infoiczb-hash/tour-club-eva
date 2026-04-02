import { prisma } from "@/lib/prisma";
import { env } from '@/lib/env';

const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    console.error(`Ошибка отправки ТГ сообщения юзеру ${chatId}:`, error);
  }
}

export async function notifySubscribersOnNewDates(
  tourId: string,
  categoryId: string | null,
  tourTitle: string,
  tourSlug: string
) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN не задан. Рассылка отменена.");
    return;
  }

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';
  const tourUrl  = `${BASE_URL}/tour/${tourSlug}`;

  // 1. Ждуны (Waitlist) — notified не проверяем, они всегда новые
  const waitlistUsers = await prisma.waitlist.findMany({
    where: { tourId },
    include: { member: true },
  });

  // 2. Избранное (WatchList по туру) — только ещё не уведомлённые
  const favoritedUsers = await prisma.watchList.findMany({
    where: { tourId, notified: false },
    include: { member: true },
  });

  // 3. Подписчики категории — только ещё не уведомлённые
  const categoryUsers = categoryId
    ? await prisma.watchList.findMany({
        where: { categoryId, notified: false },
        include: { member: true },
      })
    : [];

  // Уникальные chatId для Telegram
  const uniqueChatIds  = new Set<string>();
  const waitlistChatIds = new Set<string>();

  const addUsers = (users: any[], isWaitlist = false) => {
    for (const u of users) {
      const chatId = u.member?.tgChatId;
      if (chatId) {
        uniqueChatIds.add(chatId);
        if (isWaitlist) waitlistChatIds.add(chatId);
      }
    }
  };

  addUsers(waitlistUsers, true);
  addUsers(favoritedUsers);
  addUsers(categoryUsers);

  // Уникальные memberId для in-app уведомлений
  const allMembers = [
    ...waitlistUsers.map(u => u.member),
    ...favoritedUsers.map(u => u.member),
    ...categoryUsers.map(u => u.member),
  ].filter(Boolean);

  const uniqueMemberIds = [...new Set(allMembers.map(m => m!.id))];

  if (uniqueChatIds.size === 0 && uniqueMemberIds.length === 0) return;

  const message = `
🔥 <b>Открыта запись на тур!</b>

Мы добавили новые даты для маршрута <b>«${tourTitle}»</b>, которым вы интересовались!

Места разбирают быстро, успейте забронировать своё приключение 🌲

👉 <a href="${tourUrl}">Посмотреть даты и забронировать</a>
  `.trim();

  // Telegram рассылка
  if (uniqueChatIds.size > 0) {
    await Promise.all(
      Array.from(uniqueChatIds).map(chatId => sendTelegramMessage(chatId, message))
    );
  }

  // In-app уведомления
  if (uniqueMemberIds.length > 0) {
    await prisma.notification.createMany({
      data: uniqueMemberIds.map(memberId => ({
        memberId,
        type:    'info',
        title:   '🔥 Открыта запись на тур!',
        message: `Появились новые даты для маршрута «${tourTitle}». Места разбирают быстро!`,
        link:    tourUrl,
        isRead:  false,
      })),
      skipDuplicates: true,
    });
  }

  // Помечаем WatchList как уведомлённые — защита от повторного спама
  const watchlistIdsToMark = [
    ...favoritedUsers.filter(w => w.member?.tgChatId).map(w => w.id),
    ...categoryUsers.filter(w => w.member?.tgChatId).map(w => w.id),
  ];

  if (watchlistIdsToMark.length > 0) {
    await prisma.watchList.updateMany({
      where: { id: { in: watchlistIdsToMark } },
      data:  { notified: true },
    });
  }

  // Удаляем из Waitlist только тех кому отправили ТГ
  // Без ТГ — остаются для ручного прозвона админом
  if (waitlistUsers.length > 0) {
    const waitlistIdsToDelete = waitlistUsers
      .filter(w => w.member?.tgChatId && waitlistChatIds.has(w.member.tgChatId))
      .map(w => w.id);

    if (waitlistIdsToDelete.length > 0) {
      await prisma.waitlist.deleteMany({
        where: { id: { in: waitlistIdsToDelete } },
      });
    }
  }

  console.log(`Успешно разослано ${uniqueChatIds.size} ТГ уведомлений и ${uniqueMemberIds.length} in-app для тура «${tourTitle}»`);
}