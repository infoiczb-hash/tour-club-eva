// src/features/account/actions/submitReview.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NotificationHub } from '@/lib/notifications/hub';
// 👇 ДОБАВЛЕНЫ ИМПОРТЫ ДЛЯ ТЕЛЕГРАМ-ТРИГГЕРА
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { env } from '@/lib/env';

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
    // ✅ Выполняем в транзакции: сохраняем отзыв + пополняем баланс на 5 MDL
    // И возвращаем созданный отзыв, чтобы получить его ID для Telegram
    const newReview = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
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

      // 🔥 Начисляем 5 бонусов за отзыв
      await tx.memberProfile.update({
        where: { id: profile.id },
        data: { balance: { increment: 5 } }
      });

      return createdReview;
    });

    // 🔥 УВЕДОМЛЯЕМ КЛИЕНТА О ПОПОЛНЕНИИ БАЛАНСА
    await NotificationHub.dispatch({
      eventId: 'CASHBACK_RECEIVED',
      memberId: profile.id,
      data: { amount: 5 }
    });

    // 👇 НАЧАЛО: ТРИГГЕР В TELEGRAM (Модерация отзывов) 👇
    try {
      const tourTitle = tour?.title || 'Неизвестный тур';
      const stars = '⭐️'.repeat(rating) + '☆'.repeat(5 - rating);
      const messageText = `📝 <b>Новый отзыв (На модерацию)</b>\n\n🏕 <b>Тур:</b> ${tourTitle}\n👤 <b>Автор:</b> ${newReview.name}\n📊 <b>Оценка:</b> ${stars}\n\n<i>«${newReview.text}»</i>`;

      await publishToTelegram(
        messageText,
        undefined, // без картинки
        undefined, // без стандартной URL-кнопки
        false,     // отправляем админам, а не в публичный канал
        {
          messageThreadId: env.TELEGRAM_TOPIC_REVIEWS,
          inlineKeyboard: [
            [{ text: '✅ Опубликовать на сайте', callback_data: `pub_rev:${newReview.id}` }]
          ]
        }
      );
    } catch (tgError) {
      console.error('[submitReviewFromCabinet] Ошибка отправки в Telegram:', tgError);
      // Ошибку глотаем, чтобы отзыв успешно сохранился у клиента
    }
    // 👆 КОНЕЦ: ТРИГГЕР В TELEGRAM 👆

    revalidatePath('/account/history');
    revalidatePath(`/tour/${tour?.slug ?? ''}`);
    revalidatePath('/account/dashboard'); 

    return { success: true };
  } catch (error) {
    console.error('[submitReviewFromCabinet] Error:', error);
    return { success: false, error: 'Не удалось сохранить отзыв. Попробуйте позже.' };
  }
}