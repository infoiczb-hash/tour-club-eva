// src/features/admin/actions/manifest.ts
'use server';

import { env } from '@/lib/env';
// 1. Меняем импорт
import { withAdminAuth } from '@/lib/auth';

const ticketTypeMap: Record<string, string> = {
  adult: 'Взр',
  child: 'Дет',
  family: 'Сем',
  member: 'Клуб'
};

// 2. Оборачиваем функцию и делаем ее стрелочной
export const sendManifestToTelegramAction = withAdminAuth(async (payload: {
  tourName: string;
  date: string;
  totalTickets: number;
  participants: any[];
}) => {
  try {
    // 3. УДАЛИЛИ await requireAuth(); 

    const { tourName, date, totalTickets, participants } = payload;

    let message = `📋 <b>СПИСОК ГРУППЫ: ${tourName}</b>\n`;
    message += `📅 ${date} | 👥 Всего: ${totalTickets} чел.\n\n`;

    const equipmentCount: Record<string, number> = {};

    participants.forEach((p, index) => {
      const num = index + 1;
      const phone = (p.phone && p.phone !== '—') ? p.phone : 'Нет номера';
      
      const tType = ticketTypeMap[p.ticketType] || 'Взр';
      const ticketLabel = p.isMain ? 'Заказчик' : tType;
      
      let equipStr = '';
      if (p.jacket && p.jacket !== 'Не нужен') {
        equipStr = ` | 🦺 ${p.jacket}`;
        equipmentCount[p.jacket] = (equipmentCount[p.jacket] || 0) + 1;
      }

      let statusStr = '⏳ Не оплачено';
      if (p.status === 'confirmed') statusStr = '  Оплачено';
      if (p.status === 'pending') statusStr = '💵 Наличные';

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
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error('Telegram API error');
    }

    return { success: true };
  } catch (error) {
    console.error('Manifest send error:', error);
    return { success: false, error: 'Ошибка отправки манифеста' };
  }
});