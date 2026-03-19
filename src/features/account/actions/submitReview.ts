'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface SubmitReviewInput {
  tourId: string;
  text: string;
}

type SubmitReviewResult =
  | { success: true }
  | { success: false; error: string };

export async function submitReviewFromCabinet(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Необходима авторизация' };

  const { tourId, text } = input;

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

  // Проверяем что отзыв ещё не оставлен
  const existing = await prisma.review.findFirst({
    where: {
      tourId,
      name: profile.name ?? profile.phone,
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

  // Создаём отзыв (isActive: false — пройдёт модерацию в админке)
  await prisma.review.create({
    data: {
      name: profile.name ?? 'Участник клуба',
      text: text.trim(),
      source: 'website',
      tourId,
      category: reviewCategory,
      isActive: false, // модерация
    },
  });

  revalidatePath('/account/history');
  revalidatePath(`/tour/${tour?.slug ?? ''}`);

  return { success: true };
}
