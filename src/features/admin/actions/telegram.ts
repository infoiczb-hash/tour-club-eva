"use server";

/**
 * Продвинутая отправка в Telegram с поддержкой фото и кнопок.
 */
export async function publishToTelegram(text: string, imageUrl?: string, link?: string) {
  // 1. Берем ключи (можно использовать те же переменные, что были, или новые)
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Поддерживаем оба варианта названия переменной для совместимости
  const chatId = process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("❌ Telegram Error: Нет ключей в .env");
    return { success: false, error: "Не настроен .env (TELEGRAM_BOT_TOKEN)" };
  }

  try {
    // 2. Определяем метод: если есть картинка -> sendPhoto, иначе -> sendMessage
    const method = imageUrl ? 'sendPhoto' : 'sendMessage';
    const url = `https://api.telegram.org/bot${token}/${method}`;
    
    // 3. Формируем тело запроса
    const body: any = {
      chat_id: chatId,
      parse_mode: 'HTML', // Поддержка жирного текста и ссылок
    };

    if (imageUrl) {
      body.photo = imageUrl;
      body.caption = text.slice(0, 1024); // Лимит Telegram на подпись к фото
    } else {
      body.text = text;
    }

    // 4. Добавляем Inline-кнопку (если есть ссылка)
    if (link) {
      body.reply_markup = JSON.stringify({
        inline_keyboard: [
          [{ text: "🔥 Забронировать место", url: link }]
        ]
      });
    }

    // 5. Отправка
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("❌ Telegram API Error:", data);
      return { success: false, error: `TG Error: ${data.description}` };
    }

    return { success: true };

  } catch (error) {
    console.error("❌ Network Error:", error);
    return { success: false, error: "Ошибка сети" };
  }
}

// Оставляем старую функцию для совместимости (если она где-то используется),
// но перенаправляем её на новую логику
export async function sendToTelegram(text: string) {
  return publishToTelegram(text);
}