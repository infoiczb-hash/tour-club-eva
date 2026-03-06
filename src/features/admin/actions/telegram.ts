"use server";

/**
 * Продвинутая отправка в Telegram с поддержкой фото и кнопок.
 * @param isPublic Если true — отправляет в публичный канал @evaturclub.
 */
export async function publishToTelegram(
  text: string,
  imageUrl?: string,
  link?: string,
  isPublic: boolean = false
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = isPublic
    ? process.env.TELEGRAM_CHANNEL_ID
    : process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, error: 'Не настроен .env' };
  }

  try {
    // ✅ method объявляется один раз
    const method = imageUrl ? 'sendPhoto' : 'sendMessage';
    const url = `https://api.telegram.org/bot${token}/${method}`;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      parse_mode: 'HTML',
    };

    if (imageUrl) {
      body.photo = imageUrl;
      // ✅ Обрезаем по последнему пробелу — не рвём HTML-теги посередине
      const raw = text.substring(0, 1024);
      body.caption = raw.lastIndexOf(' ') > 900
        ? raw.substring(0, raw.lastIndexOf(' ')) + '...'
        : raw;
    } else {
      body.text = text;
    }

    if (link) {
      body.reply_markup = JSON.stringify({
        inline_keyboard: [[
          { text: isPublic ? '🔥 Забронировать место' : '⚙️ Открыть CRM', url: link }
        ]],
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: `TG Error: ${data.description}` };
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: 'Ошибка сети' };
  }
}

// Старая функция — шлёт только админам
export async function sendToTelegram(text: string) {
  return publishToTelegram(text, undefined, undefined, false);
}