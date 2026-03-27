"use server";
import { env } from '@/lib/env';

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
  const token  = env.TELEGRAM_BOT_TOKEN;
  const chatId = isPublic
    ? env.TELEGRAM_CHANNEL_ID    // string | undefined
    : env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, error: 'Не настроен .env' };
  }

  try {
    const method = imageUrl ? 'sendPhoto' : 'sendMessage';
    const url = `https://api.telegram.org/bot${token}/${method}`;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      parse_mode: 'HTML',
    };

    if (imageUrl) {
      body.photo = imageUrl;
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

// Старая функция (оставляем для совместимости, если она где-то используется)
export async function sendToUserTelegram(chatId: string, text: string, linkUrl?: string) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false, error: 'Не настроен TELEGRAM_BOT_TOKEN' };

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };

    if (linkUrl) {
      body.reply_markup = JSON.stringify({
        inline_keyboard: [[
          { text: '🚀 Забронировать место', url: linkUrl }
        ]],
      });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return { success: data.ok, error: data.description };
  } catch (error) {
    console.error('sendToUserTelegram Error:', error);
    return { success: false, error: 'Ошибка сети' };
  }
}

// ✅ НОВАЯ УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ КЛИЕНТОВ (Поддерживает разные кнопки и разных ботов)
export async function sendToUserTelegramAdvanced(
  chatId: string,
  text: string,
  inlineButtons?: Array<Array<{ text: string; url: string }>>,
  useAuthBot: boolean = false
) {
  // Умный выбор токена: клиентам пишем через AUTH_BOT, админам/в канал — через основной
  const token = useAuthBot ? env.TELEGRAM_AUTH_BOT : env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false, error: 'Telegram token missing' };

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };

    if (inlineButtons && inlineButtons.length > 0) {
      body.reply_markup = JSON.stringify({ inline_keyboard: inlineButtons });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API Error in Advanced:', data.description);
      return { success: false, error: data.description };
    }
    
    return { success: true };
  } catch (error) {
    console.error('sendToUserTelegramAdvanced Error:', error);
    return { success: false, error: 'Ошибка сети' };
  }
}