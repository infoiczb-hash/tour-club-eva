'use server';

import { env } from '@/lib/env';
import { requireAuth } from '@/lib/auth';

// Переводчик типов билетов для сокращений в манифесте
const ticketTypeMap: Record<string, string> = {
  adult: 'Взр',
  child: 'Дет',
  family: 'Сем',
  member: 'Клуб'
};

export async function sendManifestToTelegramAction(payload: {
  tourName: string;
  date: string;
  totalTickets: number;
  participants: any[];
}) {
  try {
    await requireAuth(); // ✅ Проверка прав админа

    const { tourName, date, totalTickets, participants } = payload;

    // 1. Формируем заголовок сообщения
    let message = `📋 <b>СПИСОК ГРУППЫ: ${tourName}</b>\n`;
    message += `📅 ${date} | 👥 Всего: ${totalTickets} чел.\n\n`;

    // 2. Проходимся по всем участникам и формируем строки
    participants.forEach((p, index) => {
      const num = index + 1;
      
      // Форматируем билет и возраст (Например: Дет, 8 лет)
      const tType = ticketTypeMap[p.ticketType] || 'Взр';
      const ticketLabel = p.age ? `${tType}, ${p.age} лет` : tType;
      
      // Форматируем доп. поля (если есть)
      const equipment = p.equipment ? ` | Жилет: ${p.equipment}` : '';
      const phone = (p.phone && p.phone !== '—') ? ` | 📞 ${p.phone}` : '';
      const status = p.status === 'confirmed' ? '✅ Оплачено' : '⏳ Ожидает';
      
      // Собираем строку участника
      message += `<b>${num}. ${p.name}</b> (${ticketLabel})${equipment}${phone} | <i>#${p.shortId} (${status})</i>\n`;
      
      // Если это заказчик и у него есть вопрос - добавляем снизу
      if (p.isMain && p.comment) {
        message += `💬 <i>Вопрос: ${p.comment}</i>\n`;
      }
    });

    // 3. Достаем токены для основного бота и ID админского чата
    const token = env.TELEGRAM_BOT_TOKEN; // @eva_turclub_bot
    const chatId = env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      throw new Error('Не настроены переменные окружения для Telegram (Token или Chat ID)');
    }

    // 4. Отправляем в Telegram
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API Error:', data.description);
      return { success: false, error: data.description };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Send manifest error:', error);
    return { success: false, error: error.message || 'Ошибка отправки списка' };
  }
}