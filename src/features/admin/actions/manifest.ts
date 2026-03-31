'use server';

import { env } from '@/lib/env';
import { requireAuth } from '@/lib/auth';

// ✅ ВОЗВРАЩАЕМ СЛОВАРЬ (для удобной рассадки экипажей)
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
    await requireAuth(); 

    const { tourName, date, totalTickets, participants } = payload;

    let message = `📋 <b>СПИСОК ГРУППЫ: ${tourName}</b>\n`;
    message += `📅 ${date} | 👥 Всего: ${totalTickets} чел.\n\n`;

    const equipmentCount: Record<string, number> = {};

    participants.forEach((p, index) => {
      const num = index + 1;
      const phone = (p.phone && p.phone !== '—') ? p.phone : 'Нет номера';
      
      // ✅ ВОЗВРАЩАЕМ ЛОГИКУ БИЛЕТОВ И ВОЗРАСТА
      const tType = ticketTypeMap[p.ticketType] || 'Взр';
      const ticketLabel = p.age ? `${tType}, ${p.age} лет` : tType;

      const equipStr = p.equipment ? ` | Жилет: ${p.equipment}` : '';
      if (p.equipment) {
        equipmentCount[p.equipment] = (equipmentCount[p.equipment] || 0) + 1;
      }

      let statusStr = '⏳ Не оплачено';
      if (p.status === 'confirmed') statusStr = '✅ Оплачено';
      if (p.status === 'pending') statusStr = '💵 Наличные';

      // Формируем финальную строку с (ТипБилета)
      message += `<b>${num}. ${p.name}</b> (${ticketLabel}) / ${phone}${equipStr} | <i>#${p.shortId} (${statusStr})</i>\n`;
      
      if (p.isMain && p.comment) {
        message += `💬 <i>Комментарий: ${p.comment}</i>\n`;
      }
    });

    const eqKeys = Object.keys(equipmentCount);
    if (eqKeys.length > 0) {
      message += `\n---------------------------\n📊 <b>ИТОГО СНАРЯЖЕНИЕ:</b>\n`;
      eqKeys.forEach(key => {
        message += `Жилеты ${key}: <b>${equipmentCount[key]} шт</b>\n`;
      });
    }

    const token = env.TELEGRAM_BOT_TOKEN; 
    const chatId = env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) throw new Error('Не настроены переменные окружения для Telegram');

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });

    const data = await response.json();
    if (!data.ok) return { success: false, error: data.description };

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Ошибка отправки списка' };
  }
}