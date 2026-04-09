'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. Получить последние уведомления пользователя (например, 10 штук)
export async function getUserNotifications(memberId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const unreadCount = await prisma.notification.count({
      where: { memberId, isRead: false },
    });

    return { success: true, notifications, unreadCount };
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

// 2. Отметить одно уведомление как прочитанное (при клике)
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    
    // Обновляем кэш, чтобы счетчик перерисовался
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Ошибка при чтении уведомления:', error);
    return { success: false };
  }
}

// 3. Отметить ВСЕ как прочитанные (кнопка "Прочитать всё")
export async function markAllNotificationsAsRead(memberId: string) {
  try {
    await prisma.notification.updateMany({
      where: { memberId, isRead: false },
      data: { isRead: true },
    });
    
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Ошибка при чтении всех уведомлений:', error);
    return { success: false };
  }
}