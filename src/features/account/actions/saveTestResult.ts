'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface SaveTestResultInput {
  testSlug: string;
  result: {
    type: string;
    badge?: string;
    description?: string;
    score?: Record<string, number>;
    [key: string]: unknown;
  };
}

type SaveTestResultOutput =
  | { success: true }
  | { success: false; error: string; needsAuth?: boolean };

export async function saveTestResult(
  input: SaveTestResultInput
): Promise<SaveTestResultOutput> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходима авторизация', needsAuth: true };
  }

  const { testSlug, result } = input;

  if (!testSlug) {
    return { success: false, error: 'Не указан slug теста' };
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    return { success: false, error: 'Профиль не найден', needsAuth: true };
  }

  // ✅ Проверяем, сдавал ли пользователь этот тест ранее
  const existingTest = await prisma.testResult.findUnique({
    where: {
      memberId_testSlug: {
        memberId: profile.id,
        testSlug,
      },
    },
  });

  const REWARD_FOR_TEST = 1;

  try {
    // Выполняем в транзакции: сохраняем результат + пополняем баланс (если впервые)
    await prisma.$transaction(async (tx) => {
      await tx.testResult.upsert({
        where: {
          memberId_testSlug: {
            memberId: profile.id,
            testSlug,
          },
        },
        create: {
          memberId: profile.id,
          testSlug,
          result: result as any,
        },
        update: {
          result: result as any,
        },
      });

      // Если теста в базе не было — начисляем баланс
      if (!existingTest) {
        await tx.memberProfile.update({
          where: { id: profile.id },
          data: { balance: { increment: REWARD_FOR_TEST } }
        });
      }
    });

    revalidatePath('/account/tests');
    // ✅ Обновляем дашборд, чтобы свежий баланс сразу подтянулся в интерфейсе
    revalidatePath('/account/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка сохранения теста:', error);
    return { success: false, error: 'Произошла ошибка при сохранении' };
  }
}