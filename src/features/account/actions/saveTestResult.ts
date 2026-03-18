'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Не залогинен — возвращаем специальный флаг
  // Клиент покажет: "Войди чтобы сохранить результат"
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

  // Upsert — если тест уже пройден, перезаписываем результат
  await prisma.testResult.upsert({
    where: {
      memberId_testSlug: {
        memberId: profile.id,
        testSlug,
      },
    },
    create: {
      memberId: profile.id,
      testSlug,
      result,
    },
    update: {
      result,
    },
  });

  revalidatePath('/account/tests');
  return { success: true };
}
