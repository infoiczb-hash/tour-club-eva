"use server";

/**
 * Продвинутая отправка в Telegram с поддержкой фото и кнопок.
 * @param isPublic Если true - отправляет в публичный канал @evaturclub. По умолчанию false.
 */
export async function publishToTelegram(
  text: string, 
  imageUrl?: string, 
  link?: string,
  isPublic: boolean = false // 👈 Добавили флаг публичности
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  // 👈 МАГИЯ РАЗДЕЛЕНИЯ:
  const chatId = isPublic 
    ? process.env.TELEGRAM_CHANNEL_ID 
    : process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error("❌ Telegram Error: Нет ключей в .env");
    return { success: false, error: "Не настроен .env" };
  }

  try {
    const method = imageUrl ? 'sendPhoto' : 'sendMessage';
    const url = `https://api.telegram.org/bot${token}/${method}`;
    
    const body: any = {
      chat_id: chatId,
      parse_mode: 'HTML',
    };

    if (imageUrl) {
      body.photo = imageUrl;
      body.caption = text.slice(0, 1024);
    } else {
      body.text = text;
    }

    if (link) {
      body.reply_markup = JSON.stringify({
        inline_keyboard: [
          [{ text: isPublic ? "🔥 Забронировать место" : "⚙️ Открыть CRM", url: link }]
        ]
      });
    }

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

// 👈 Старая функция теперь по умолчанию шлет всё админам (isPublic = false)
export async function sendToTelegram(text: string) {
  return publishToTelegram(text, undefined, undefined, false);
}