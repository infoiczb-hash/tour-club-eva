"use server";
import { env } from '@/lib/env';

/**
 * Продвинутая отправка в Telegram с поддержкой фото и кнопок.
 * @param isPublic Если true — отправляет в публичный канал @evaturclub через PUBLIC_BOT.
 */
export async function publishToTelegram(
  text: string,
  imageUrl?: string,
  link?: string,
  isPublic: boolean = false
) {
  // ✅ ИСПРАВЛЕНО: публичный канал использует отдельный бот и отдельный chat_id
  const token  = isPublic
    ? env.TELEGRAM_PUBLIC_BOT_TOKEN
    : env.TELEGRAM_BOT_TOKEN;

  const chatId = isPublic
    ? env.TELEGRAM_CHANNEL_ID      // @evaturclub
    : env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error('publishToTelegram: не настроен .env для', isPublic ? 'PUBLIC' : 'ADMIN');
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

      // caption — максимум 1024 символа для Telegram
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
          {
            text: isPublic ? '🔥 Забронировать место' : '⚙️ Открыть CRM',
            url: link,
          }
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
      console.error('Telegram API Error:', data.description);
      return { success: false, error: `TG Error: ${data.description}` };
    }

    return { success: true };

  } catch (error) {
    console.error('publishToTelegram Error:', error);
    return { success: false, error: 'Ошибка сети' };
  }
}

// ─── ХЕЛПЕРЫ ────────────────────────────────────────────────────────────────

/**
 * Публикация тура в публичный канал @evaturclub.
 * Формат: фото обложки + короткий текст + кнопка перехода на сайт.
 */
export async function publishTourToChannel({
  title,
  subtitle,
  location,
  duration,
  price,
  currency,
  slug,
  coverImage,
}: {
  title:      string;
  subtitle?:  string | null;
  location:   string;
  duration:   string;
  price:      number;
  currency:   string;
  slug:       string;
  coverImage?: string | null;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evatur.club';

  const text = [
    `🏕 <b>${title}</b>`,
    subtitle ? `<i>${subtitle}</i>` : null,
    ``,
    `📍 ${location}`,
    `⏱ ${duration}`,
    `💰 от ${price} ${currency}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const link = `${siteUrl}/tour/${slug}`;

  return publishToTelegram(text, coverImage ?? undefined, link, true);
}

/**
 * Публикация статьи блога в публичный канал @evaturclub.
 * Формат: фото обложки + заголовок + excerpt + кнопка перехода на сайт.
 */
export async function publishPostToChannel({
  title,
  excerpt,
  slug,
  image,
}: {
  title:    string;
  excerpt:  string;
  slug:     string;
  image?:   string | null;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evatur.club';

  const text = [
    `📝 <b>${title}</b>`,
    ``,
    excerpt,
  ].join('\n');

  const link = `${siteUrl}/blog/${slug}`;

  return publishToTelegram(text, image ?? undefined, link, true);
}

// ─── СТАРЫЕ ФУНКЦИИ (совместимость) ─────────────────────────────────────────

// Шлёт только админам
export async function sendToTelegram(text: string) {
  return publishToTelegram(text, undefined, undefined, false);
}

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

export async function sendToUserTelegramAdvanced(
  chatId: string,
  text: string,
  inlineButtons?: Array<Array<{ text: string; url: string }>>,
  useAuthBot: boolean = false
) {
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