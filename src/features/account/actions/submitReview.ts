'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface SubmitReviewInput {
  tourId: string;
  text: string;
  rating: number; 
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

  const { tourId, text, rating } = input;

  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Слишком короткий отзыв' };
  }
  if (text.length > 500) {
    return { success: false, error: 'Отзыв слишком длинный (максимум 500 символов)' };
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { success: false, error: 'Профиль не найден' };

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

  const existing = await prisma.review.findFirst({
    where: {
      tourId,
      memberId: profile.id, 
    },
  });

  if (existing) {
    return { success: false, error: 'Вы уже оставили отзыв на этот тур' };
  }

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    include: { category: { select: { slug: true } } },
  });
  const reviewCategory = tour?.category?.slug ?? 'general';

  try {
    // ПРОСТО СОХРАНЯЕМ ОТЗЫВ (Без начисления денег!)
    await prisma.review.create({
      data: {
        name: profile.name ?? profile.phone ?? 'Участник клуба',
        text: text.trim(),
        rating: rating,
        source: 'website',
        tourId,
        memberId: profile.id, 
        category: reviewCategory,
        isActive: false, // ждет модерации админом
      },
    });

    revalidatePath('/account/history');
    revalidatePath(`/tour/${tour?.slug ?? ''}`);

    return { success: true };
  } catch (error) {
    console.error('[submitReviewFromCabinet] Error:', error);
    return { success: false, error: 'Не удалось сохранить отзыв. Попробуйте позже.' };
  }
}