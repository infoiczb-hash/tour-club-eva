'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { NotificationHub } from '@/lib/notifications/hub'; // 🔥 ДОБАВЛЕНО ДЛЯ ГЕЙМИФИКАЦИИ

// ✅ ИЗМЕНЕНО: Возвращаем полные объекты для админки, но отсекаем скрытые для клиента (onlyActive)
export const getReviews = cache(async (onlyActive: boolean = false) => {
  try {
    const reviews = await prisma.review.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    
    return reviews;
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    return [];
  }
});

export async function upsertReview(data: any) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const { id, ...payload } = data;
    const isActive = payload.isActive === true || payload.isActive === 'true' || payload.isActive === 'on';
    
    const reviewData = {
      name: payload.name,
      text: payload.text,
      source: payload.source || 'tg',
      avatar: payload.avatar || null,
      category: payload.category || 'general',
      isActive: isActive,
    };

    if (id) {
      // 🔥 ШАГ 1: Получаем старый отзыв до обновления, чтобы отследить смену статуса
      const existingReview = await prisma.review.findUnique({ 
         where: { id },
         include: { tour: true }
      });

      // 🔥 ШАГ 2: Сохраняем новые данные
      await prisma.review.update({ where: { id }, data: reviewData });

      // 🔥 ШАГ 3: ЛОГИКА ГЕЙМИФИКАЦИИ (Если отзыв БЫЛ скрыт, а ТЕПЕРЬ одобрен)
      if (existingReview && !existingReview.isActive && isActive && existingReview.memberId) {
         const BONUS_POINTS = 10; // Количество баллов за отзыв

         // Начисляем баллы на баланс пользователя
         const profile = await prisma.memberProfile.update({
           where: { id: existingReview.memberId },
           data: { balance: { increment: BONUS_POINTS } }
         });

         // Радуем клиента через Единую Шину
         await NotificationHub.dispatch({
           eventId: 'REVIEW_PUBLISHED',
           memberId: existingReview.memberId,
           data: {
             pointsAdded: BONUS_POINTS,
             newBalance: profile.balance,
             tourTitle: existingReview.tour?.title || 'нашем туре'
           }
         });
      }

    } else {
      await prisma.review.create({ data: reviewData });
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    
    // 🛡️ Защита от утечки: логируем на сервере, отдаем заглушку
    console.error('Ошибка сохранения отзыва:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при сохранении отзыва' };
  }
}

export async function deleteReview(id: string) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.review.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    
    // 🛡️ Защита от утечки: логируем на сервере, отдаем заглушку
    console.error('Ошибка удаления отзыва:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при удалении отзыва' };
  }
}