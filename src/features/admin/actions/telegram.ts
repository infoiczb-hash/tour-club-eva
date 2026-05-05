"use server";
import { env } from '@/lib/env';

// 1. Интерфейсы для типизации кнопок и топиков
export interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramTopicOptions {
  messageThreadId?: string;
  inlineKeyboard?: TelegramInlineButton[][];
}

function generateInlineKeyboard(buttons: TelegramInlineButton[][]) {
  return { inline_keyboard: buttons };
}

/**
 * Продвинутая отправка в Telegram с поддержкой фото, кнопок, топиков и Qstash.
 * @param isPublic Если true — отправляет в публичный канал @evaturclub через PUBLIC_BOT.
 */
export async function publishToTelegram(
  text: string,
  imageUrl?: string,
  link?: string,
  isPublic: boolean = false,
  options?: TelegramTopicOptions
) {
  //   СОХРАНЕНО ИЗ ОРИГИНАЛА: публичный канал использует отдельный бот
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
    const tgApiUrl = `https://api.telegram.org/bot${token}/${method}`;
    
    // 🔥 ДОБАВЛЕНО: Интеграция с очередью Qstash
    const url = env.QSTASH_TOKEN 
      ? `https://qstash.upstash.io/v2/publish/${tgApiUrl}` 
      : tgApiUrl;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      parse_mode: 'HTML',
    };

   // 🔥 ДОБАВЛЕНО: Маршрутизация по топикам (Парсим в INT для Telegram API)
    if (options?.messageThreadId) {
      body.message_thread_id = typeof options.messageThreadId === 'string' 
        ? parseInt(options.messageThreadId, 10) 
        : options.messageThreadId;
    }

    if (imageUrl) {
      body.photo = imageUrl;
      const raw = text.substring(0, 1024);
      body.caption = raw.lastIndexOf(' ') > 900
        ? raw.substring(0, raw.lastIndexOf(' ')) + '...'
        : raw;
    } else {
      body.text = text;
    }

    // Обработка клавиатур (кастомные из options или дефолтная из link)
    let finalKeyboard: TelegramInlineButton[][] = [];
    if (options?.inlineKeyboard) {
      finalKeyboard = options.inlineKeyboard;
    } else if (link) {
      finalKeyboard = [[
        { text: isPublic ? '🔥 Забронировать место' : '⚙️ Открыть CRM', url: link }
      ]];
    }

    if (finalKeyboard.length > 0) {
      body.reply_markup = JSON.stringify(generateInlineKeyboard(finalKeyboard));
    }

    // 🔥 ДОБАВЛЕНО: Заголовки для Qstash
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QSTASH_TOKEN) {
      headers['Authorization'] = `Bearer ${env.QSTASH_TOKEN}`;
      headers['Upstash-Forward-Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (env.QSTASH_TOKEN && data.messageId) {
      return { success: true, qstashMessageId: data.messageId };
    }

    if (!data.ok && !env.QSTASH_TOKEN) {
      return { success: false, error: `TG Error: ${data.description}` };
    }

    return { success: true };

  } catch (error) {
    console.error('publishToTelegram Error:', error);
    return { success: false, error: 'Ошибка сети' };
  }
}

/**
 * 🔥 НОВОЕ: Отправка карусели (MediaGroup) в Telegram с поддержкой Qstash и топиков.
 */
export async function publishMediaGroupToTelegram(
  text: string,
  imageUrls: string[],
  isPublic: boolean = false,
  options?: TelegramTopicOptions
) {
  const token = isPublic
    ? env.TELEGRAM_PUBLIC_BOT_TOKEN
    : env.TELEGRAM_BOT_TOKEN;

  const chatId = isPublic
    ? env.TELEGRAM_CHANNEL_ID
    : env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error('publishMediaGroupToTelegram: не настроен .env');
    return { success: false, error: 'Telegram credentials missing' };
  }

  try {
    if (imageUrls.length === 0) return { success: false, error: 'Нет изображений' };
    
    // Если картинка одна — фолбэк на стандартную отправку
    if (imageUrls.length === 1) {
      return publishToTelegram(text, imageUrls[0], undefined, isPublic, options);
    }

    const tgApiUrl = `https://api.telegram.org/bot${token}/sendMediaGroup`;
    const url = env.QSTASH_TOKEN 
      ? `https://qstash.upstash.io/v2/publish/${tgApiUrl}` 
      : tgApiUrl;

    // Telegram ограничивает подпись (caption) до 1024 символов
    const raw = text.substring(0, 1024);
    const caption = raw.lastIndexOf(' ') > 900
      ? raw.substring(0, raw.lastIndexOf(' ')) + '...'
      : raw;

    // В MediaGroup подпись вешается только на первый элемент
    const media = imageUrls.map((imgUrl, index) => ({
      type: 'photo',
      media: imgUrl,
      caption: index === 0 ? caption : undefined,
      parse_mode: 'HTML'
    }));

    const body: Record<string, unknown> = {
      chat_id: chatId,
      media: media,
    };

    // Маршрутизация по топикам
    if (options?.messageThreadId) {
      body.message_thread_id = typeof options.messageThreadId === 'string' 
        ? parseInt(options.messageThreadId, 10) 
        : options.messageThreadId;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QSTASH_TOKEN) {
      headers['Authorization'] = `Bearer ${env.QSTASH_TOKEN}`;
      headers['Upstash-Forward-Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (env.QSTASH_TOKEN && data.messageId) {
      return { success: true, qstashMessageId: data.messageId };
    }

    if (!data.ok && !env.QSTASH_TOKEN) {
      return { success: false, error: `TG Error: ${data.description}` };
    }

    return { success: true };

  } catch (error) {
    console.error('publishMediaGroupToTelegram Error:', error);
    return { success: false, error: 'Ошибка сети' };
  }
}

// ─── ХЕЛПЕРЫ (ВОССТАНОВЛЕНЫ ИЗ ОРИГИНАЛА) ───────────────────────────────────

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
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? 'https://evatur.club';

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

  // Вызываем обновленную функцию, флаг true = в публичный канал
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
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? 'https://evatur.club';

  const text = [
    `📝 <b>${title}</b>`,
    ``,
    excerpt,
  ].join('\n');

  const link = `${siteUrl}/blog/${slug}`;

  // Вызываем обновленную функцию, флаг true = в публичный канал
  return publishToTelegram(text, image ?? undefined, link, true);
}

// ─── СТАРЫЕ ФУНКЦИИ (совместимость) ─────────────────────────────────────────

// Шлёт только админам
export async function sendToTelegram(text: string) {
  return publishToTelegram(text, undefined, undefined, false);
}

export async function sendToUserTelegram(chatId: string, text: string, linkUrl?: string) {
  const token = env.TELEGRAM_AUTH_BOT; 
  if (!token) return { success: false, error: 'Не настроен TELEGRAM_AUTH_BOT' };

  try {
    const tgApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const url = env.QSTASH_TOKEN 
      ? `https://qstash.upstash.io/v2/publish/${tgApiUrl}` 
      : tgApiUrl;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };

    if (linkUrl) {
      body.reply_markup = JSON.stringify({
        inline_keyboard: [[{ text: '🚀 Забронировать место', url: linkUrl }]],
      });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QSTASH_TOKEN) {
      headers['Authorization'] = `Bearer ${env.QSTASH_TOKEN}`;
      headers['Upstash-Forward-Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (env.QSTASH_TOKEN && data.messageId) {
      return { success: true, qstashMessageId: data.messageId };
    }

    return { success: data.ok, error: data.description };
  } catch (error) {
    console.error('sendToUserTelegram Error:', error);
    return { success: false, error: 'Ошибка сети' };
  }
}

//   СОХРАНЕНО ИЗ ОРИГИНАЛА: Advanced-функция для рассылок юзерам
export async function sendToUserTelegramAdvanced(
  chatId: string,
  text: string,
  inlineButtons?: Array<Array<{ text: string; url?: string; callback_data?: string }>>, 
  useAuthBot: boolean = false
) {
  const token = useAuthBot ? env.TELEGRAM_AUTH_BOT : env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false, error: 'Telegram token missing' };

  try {
    const tgApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    // 🔥 ДОБАВЛЕНО: Интеграция с очередью Qstash
    const url = env.QSTASH_TOKEN 
      ? `https://qstash.upstash.io/v2/publish/${tgApiUrl}` 
      : tgApiUrl;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };

    if (inlineButtons && inlineButtons.length > 0) {
      body.reply_markup = JSON.stringify({ inline_keyboard: inlineButtons });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (env.QSTASH_TOKEN) {
      headers['Authorization'] = `Bearer ${env.QSTASH_TOKEN}`;
      headers['Upstash-Forward-Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (env.QSTASH_TOKEN && data.messageId) {
      return { success: true, qstashMessageId: data.messageId };
    }

    if (!data.ok && !env.QSTASH_TOKEN) {
      return { success: false, error: `TG Error: ${data.description}` };
    }

    return { success: true };
  } catch (error) {
    console.error('sendToUserTelegramAdvanced Error:', error);
    return { success: false, error: 'Ошибка сети' };
  }
}