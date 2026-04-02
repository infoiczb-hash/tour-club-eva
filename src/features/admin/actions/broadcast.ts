'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';

export async function broadcastToGroupAction(bookingIds: string[], message: string) {
  try {
    await requireAuth(); // ✅ Только для админа

    // 1. Ищем брони: Оплаченные ИЛИ Ожидающие (главное, что не Отмененные) и с привязанным Telegram
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        status: { in: ['confirmed', 'pending'] }, // 👈 Наше бизнес-решение!
        member: { tgChatId: { not: null } }
      },
      include: { member: true }
    });

    if (bookings.length === 0) {
      return { success: false, error: 'В этой группе нет активных участников с привязанным Telegram.' };
    }

    let successCount = 0;

    // 2. Рассылаем сообщения каждому клиенту в личку от имени @authevaclub_bot
    const formattedMessage = `📢 <b>Важное сообщение по туру!</b>\n\n${message}`;

    for (const b of bookings) {
      if (b.member?.tgChatId) {
        // Последний аргумент true = используем бота авторизации
        const res = await sendToUserTelegramAdvanced(b.member.tgChatId, formattedMessage, undefined, true);
        if (res.success) successCount++;
      }
    }

    return { success: true, count: successCount };
  } catch (error: any) {
    console.error('Broadcast error:', error);
    return { success: false, error: error.message || 'Внутренняя ошибка рассылки' };
  }
}