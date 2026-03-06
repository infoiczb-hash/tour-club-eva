'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

// Публичный — отзывы читают все
export async function getReviews() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reviews;
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    return [];
  }
}

export async function upsertReview(data: any) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const { id, ...payload } = data;
    const reviewData = {
      name: payload.name,
      text: payload.text,
      source: payload.source || 'tg',
      avatar: payload.avatar || null,
      category: payload.category || 'general',
      isActive: payload.isActive === true || payload.isActive === 'true' || payload.isActive === 'on',
    };

    if (id) {
      await prisma.review.update({ where: { id }, data: reviewData });
    } else {
      await prisma.review.create({ data: reviewData });
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    console.error('Ошибка сохранения отзыва:', error);
    return { success: false, error: error.message || 'Не удалось сохранить отзыв' };
  }
}

export async function deleteReview(id: string) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.review.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    console.error('Ошибка удаления отзыва:', error);
    return { success: false, error: 'Не удалось удалить отзыв' };
  }
}