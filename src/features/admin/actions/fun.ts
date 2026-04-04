'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth'; // 👈 ИМПОРТ

// Админская функция
export const upsertFunTestAction = withAdminAuth(async (data: any) => {
  try {
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
        image: data.image,
        category: data.category,
        isActive: data.isActive,
        passCount: data.passCount ?? 0,
      },
    });

    revalidatePath('/fun');
    revalidatePath('/admin/fun');
    return { success: true, test };
  } catch (error: any) {
    console.error('Error saving FunTest:', error);
    return { success: false, error: 'Не удалось сохранить тест' };
  }
});

// Админская функция
export const toggleFunTestStatusAction = withAdminAuth(async (id: string, currentStatus: boolean) => {
  try {
    await prisma.funTest.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/fun');
    revalidatePath('/admin/fun');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Ошибка смены статуса' };
  }
});

// ⚠️ ПУБЛИЧНАЯ функция (Оставляем как есть, auth не нужен)
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

// ⚠️ ПУБЛИЧНАЯ функция (Оставляем как есть)
export async function getFunTestsAction() {
  try {
    const tests = await prisma.funTest.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: tests };
  } catch (error) {
    return { success: false, data: [] };
  }
}