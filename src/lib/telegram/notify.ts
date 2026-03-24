import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Функция для отправки сообщения в ТГ
async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) return;
  
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
    console.error(`Ошибка отправки ТГ сообщения юзеру ${chatId}:`, error);
  }
}

// Главный триггер, который мы вызовем из админки
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
  const tourUrl = `${BASE_URL}/tour/${tourSlug}`;

  // 1. Собираем Ждунов (Waitlist)
  const waitlistUsers = await prisma.waitlist.findMany({
    where: { tourId },
    include: { member: true }
  });

  // 2. Собираем Избранное (лайкнули тур)
  const favoritedUsers = await prisma.watchList.findMany({
    where: { tourId },
    include: { member: true }
  });

  // 3. Собираем Подписчиков категории
  const categoryUsers = categoryId ? await prisma.watchList.findMany({
    where: { categoryId },
    include: { member: true }
  }) : [];

  // Создаем Set для уникальных Chat ID и мапу для связи Chat ID -> Member ID (для листа ожидания)
  const uniqueChatIds = new Set<string>();
  const waitlistChatIds = new Set<string>(); // Чтобы потом почистить именно их

  // Функция-помощник для добавления юзеров
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

  if (uniqueChatIds.size === 0) return; // Некому отправлять

  // Формируем красивое сообщение
  const message = `
🔥 <b>Открыта запись на тур!</b>

Мы добавили новые даты для маршрута <b>«${tourTitle}»</b>, которым вы интересовались!

Места разбирают быстро, успейте забронировать своё приключение 🌲

👉 <a href="${tourUrl}">Посмотреть даты и забронировать</a>
  `.trim();

  // Рассылаем всем уникальным пользователям
  const sendPromises = Array.from(uniqueChatIds).map(chatId => 
    sendTelegramMessage(chatId, message)
  );

  await Promise.all(sendPromises);

  // ОЧИСТКА: Удаляем из Waitlist только тех, кому реально отправили (у кого был ТГ)
  // Те, у кого только телефон, останутся висеть в БД для ручного прозвона админом
  if (waitlistUsers.length > 0) {
    const waitlistIdsToDelete = waitlistUsers
      .filter(w => w.member?.tgChatId && waitlistChatIds.has(w.member.tgChatId))
      .map(w => w.id);

    if (waitlistIdsToDelete.length > 0) {
      await prisma.waitlist.deleteMany({
        where: { id: { in: waitlistIdsToDelete } }
      });
    }
  }

  console.log(`Успешно разослано ${uniqueChatIds.size} уведомлений о туре ${tourTitle}`);
}