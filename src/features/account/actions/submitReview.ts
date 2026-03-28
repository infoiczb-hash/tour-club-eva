'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface SubmitReviewInput {
  tourId: string;
  text: string;
  rating: number; // ✅ ДОБАВИЛИ: Теперь мы принимаем оценку 1-5
}

type SubmitReviewResult =
  | { success: true; reward?: number } // ✅ ДОБАВИЛИ: Возвращаем сумму награды
  | { success: false; error: string };

export async function submitReviewFromCabinet(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Необходима авторизация' };

  const { tourId, text, rating } = input;

  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Слишком короткий отзыв' };
  }
  if (text.length > 500) {
    return { success: false, error: 'Отзыв слишком длинный (максимум 500 символов)' };
  }

  // Находим профиль
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { success: false, error: 'Профиль не найден' };

  // Проверяем что участник действительно был на этом туре
  const booking = await prisma.booking.findFirst({
    where: {
      memberId: profile.id,
      tourId,
      status: { not: 'cancelled' },
      tourDate: { startDate: { lt: new Date() } },
    },
  });
  if (!booking) {
    return { success: false, error: 'Отзыв можно оставить только на тур, в котором вы участвовали' };
  }

  // Проверяем что отзыв ещё не оставлен (ищем по профилю и туру)
  const existing = await prisma.review.findFirst({
    where: {
      tourId,
      memberId: profile.id, // Надежная проверка по ID, а не по имени
    },
  });

  if (existing) {
    return { success: false, error: 'Вы уже оставили отзыв на этот тур' };
  }

  // Определяем категорию тура для отзыва
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    include: { category: { select: { slug: true } } },
  });
  const reviewCategory = tour?.category?.slug ?? 'general';

  // ✅ НОВАЯ ЛОГИКА: Начисляем 10 рублей
  const REWARD_AMOUNT = 10;

  try {
    // Делаем транзакцию: сохраняем отзыв И обновляем баланс одновременно
    await prisma.$transaction([
      prisma.review.create({
        data: {
          name: profile.name ?? profile.phone ?? 'Участник клуба',
          text: text.trim(),
          rating: rating,
          source: 'website',
          tourId,
          memberId: profile.id, // Привязываем к профилю
          category: reviewCategory,
          isActive: false, // ждет модерации
        },
      }),
      prisma.memberProfile.update({
        where: { id: profile.id },
        data: { balance: { increment: REWARD_AMOUNT } }
      })
    ]);

    revalidatePath('/account/history');
    revalidatePath(`/tour/${tour?.slug ?? ''}`);
    revalidatePath('/account/dashboard'); // Обновляем баланс на главной

    return { success: true, reward: REWARD_AMOUNT };
  } catch (error) {
    console.error('[submitReviewFromCabinet] Transaction error:', error);
    return { success: false, error: 'Не удалось сохранить отзыв. Попробуйте позже.' };
  }
}