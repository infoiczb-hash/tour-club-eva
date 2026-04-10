// src/features/account/actions/notifications.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Получить ID профиля текущего авторизованного пользователя.
 */
async function getCurrentMemberId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  return profile?.id ?? null;
}

/**
 * Получить последние уведомления и количество непрочитанных.
 * Параметр memberId больше не принимается – идентификатор извлекается из сессии.
 */
export async function getUserNotifications() {
  try {
    const memberId = await getCurrentMemberId();
    if (!memberId) {
      return { success: false, notifications: [], unreadCount: 0 };
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.notification.count({
        where: { memberId, isRead: false },
      }),
    ]);

    return { success: true, notifications, unreadCount };
  } catch (error) {
    console.error('[getUserNotifications] Error:', error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

/**
 * Отметить одно уведомление как прочитанное.
 * Проверяет принадлежность уведомления текущему пользователю.
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const memberId = await getCurrentMemberId();
    if (!memberId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Проверяем владельца уведомления
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        memberId,
      },
      select: { id: true },
    });

    if (!notification) {
      return { success: false, error: 'Уведомление не найдено или доступ запрещён' };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('[markNotificationAsRead] Error:', error);
    return { success: false, error: 'Ошибка при обновлении уведомления' };
  }
}

/**
 * Отметить все уведомления текущего пользователя как прочитанные.
 */
export async function markAllNotificationsAsRead() {
  try {
    const memberId = await getCurrentMemberId();
    if (!memberId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.notification.updateMany({
      where: { memberId, isRead: false },
      data: { isRead: true },
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('[markAllNotificationsAsRead] Error:', error);
    return { success: false, error: 'Ошибка при обновлении уведомлений' };
  }
}