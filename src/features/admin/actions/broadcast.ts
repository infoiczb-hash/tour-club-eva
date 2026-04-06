'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth'; // 👈 ИМПОРТ
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';

export const broadcastToGroupAction = withAdminAuth(async (bookingIds: string[], message: string) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        status: { in: ['confirmed', 'pending'] },
        member: { tgChatId: { not: null } }
      },
      include: { member: true }
    });

    if (bookings.length === 0) {
      return { success: false, error: 'В этой группе нет активных участников с привязанным Telegram.' };
    }

    let successCount = 0;
    const formattedMessage = `📢 <b>Важное сообщение по туру!</b>\n\n${message}`;

    for (const b of bookings) {
      if (b.member?.tgChatId) {
        const res = await sendToUserTelegramAdvanced(b.member.tgChatId, formattedMessage, undefined, true);
        if (res.success) successCount++;
      }
    }

return { success: true, count: successCount };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка рассылки';
    console.error('Broadcast error:', error);
    return { success: false, error: message };
  }
});