import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

// Строгая типизация объекта Callback Query от Telegram
export interface TelegramCallbackQuery {
  id: string;
  data?: string;
  from: {
    id: number;
    username?: string;
    first_name?: string;
  };
  message?: {
    message_id: number;
    chat: {
      id: number;
    };
  };
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function editMessageReplyMarkup(chatId: number, messageId: number, replyMarkup: any = { inline_keyboard: [] }) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: replyMarkup }),
  });
}

/**
 * Обрабатывает нажатия кнопок модераторами (ТОЛЬКО новые сущности: Отзывы, Лиды. Брони обрабатываются в route.ts)
 */
export async function handleTelegramCallback(callbackQuery: TelegramCallbackQuery) {
  const data = callbackQuery.data;
  if (!data) return;

  const [action, id] = data.split(':');
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const username = callbackQuery.from?.username || callbackQuery.from?.first_name || 'Менеджер';

  try {
    switch (action) {
      // 1. ОПУБЛИКОВАТЬ ОТЗЫВ (Модерация отзывов)
      case 'pub_rev':
        await prisma.review.update({
          where: { id },
          data: { isActive: true }, //   ИСПРАВЛЕНО: используем поле isActive из твоей схемы
        });
        await answerCallbackQuery(callbackQuery.id, '  Отзыв успешно опубликован!');
        if (chatId && messageId) {
          await editMessageReplyMarkup(chatId, messageId, {
            inline_keyboard: [[{ text: `  Опубликовал @${username}`, callback_data: 'noop' }]]
          });
        }
        break;

      // 2. ВЗЯТЬ ЛИД В РАБОТУ (Вопросы/Поддержка)
      case 'tk_lead':
        await prisma.inquiry.update({
          where: { id },
          data: { status: 'WORK' }, //   ИСПРАВЛЕНО: используем статус WORK из твоего Enum
        });
        await answerCallbackQuery(callbackQuery.id, '🤝 Заявка взята в работу!');
        if (chatId && messageId) {
          await editMessageReplyMarkup(chatId, messageId, {
            inline_keyboard: [[{ text: `🛠 В работе у @${username}`, callback_data: 'noop' }]]
          });
        }
        break;

      // Пустышка для кнопок-статусов
      case 'noop':
        await answerCallbackQuery(callbackQuery.id, 'Действие уже выполнено');
        break;

      default:
        await answerCallbackQuery(callbackQuery.id, 'Команда не распознана или обрабатывается другим модулем');
    }
  } catch (error) {
    console.error('Webhook DB Action Error:', error);
    await answerCallbackQuery(callbackQuery.id, '⚠️ Ошибка БД. Проверьте логи.');
  }
}