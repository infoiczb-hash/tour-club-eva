'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ==========================================
// 1. ПОЛУЧЕНИЕ ОТЗЫВОВ
// ==========================================
export async function getReviews() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' } // Сначала новые
    });
    return reviews;
  } catch (error) {
    console.error("Ошибка получения отзывов:", error);
    return [];
  }
}

// ==========================================
// 2. СОЗДАНИЕ ИЛИ ОБНОВЛЕНИЕ (UPSERT)
// ==========================================
export async function upsertReview(data: any) {
  try {
    const { id, ...payload } = data;

    // Подготовка данных для Prisma
    const reviewData = {
      name: payload.name,
      text: payload.text,
      source: payload.source || 'tg', // По умолчанию Telegram
      avatar: payload.avatar || null,
      category: payload.category || 'general', // 🔥 НОВОЕ: Обработка категории
      // Если пришло строкой "on" (из формы) или boolean — приводим к boolean
      isActive: payload.isActive === true || payload.isActive === 'true' || payload.isActive === 'on'
    };

    if (id) {
      // --- ОБНОВЛЕНИЕ ---
      await prisma.review.update({
        where: { id },
        data: reviewData
      });
    } else {
      // --- СОЗДАНИЕ ---
      await prisma.review.create({
        data: reviewData
      });
    }

    // Обновляем кэш, чтобы на сайте сразу появились изменения
    revalidatePath('/');       // Главная страница (ReviewsMarquee)
    revalidatePath('/admin');  // Админка
    
    return { success: true };

  } catch (error: any) {
    console.error("Ошибка сохранения отзыва:", error);
    return { success: false, error: error.message || "Не удалось сохранить отзыв" };
  }
}

// ==========================================
// 3. УДАЛЕНИЕ
// ==========================================
export async function deleteReview(id: string) {
  try {
    await prisma.review.delete({
      where: { id }
    });

    revalidatePath('/');
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error: any) {
    console.error("Ошибка удаления отзыва:", error);
    return { success: false, error: "Не удалось удалить отзыв" };
  }
}