'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth';
import { FunTest } from '@prisma/client';

type UpsertFunTestInput = Partial<Omit<FunTest, 'id' | 'createdAt' | 'updatedAt'>> & { id?: string };

export const upsertFunTestAction = withAdminAuth(async (data: UpsertFunTestInput) => {
  try {
    // Проверяем обязательные поля перед созданием
    if (!data.slug || !data.title || !data.description || !data.category) {
      return { success: false, error: 'Отсутствуют обязательные поля: slug, title, description, category' };
    }

    const test = await prisma.funTest.upsert({
      where: { slug: data.slug },
      update: {
        title: data.title,
        description: data.description,
        image: data.image,
        category: data.category,
        isActive: data.isActive,
        passCount: data.passCount ?? undefined,
      },
      create: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        image: data.image ?? null,
        category: data.category,
        isActive: data.isActive ?? false,
        passCount: data.passCount ?? 0,
      },
    });

    revalidatePath('/fun');
    revalidatePath('/admin/fun');
    return { success: true, test };
  } catch (error: unknown) {
    console.error('Error saving FunTest:', error);
    return { success: false, error: 'Не удалось сохранить тест' };
  }
});

export const toggleFunTestStatusAction = withAdminAuth(async (id: string, currentStatus: boolean) => {
  try {
    await prisma.funTest.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/fun');
    revalidatePath('/admin/fun');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: 'Ошибка смены статуса' };
  }
});

export async function incrementFunTestPassAction(slug: string) {
  try {
    await prisma.funTest.update({
      where: { slug },
      data: { passCount: { increment: 1 } },
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getFunTestsAction() {
  try {
    const tests = await prisma.funTest.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: tests };
  } catch (error) {
    return { success: false, data: [] };
  }
}