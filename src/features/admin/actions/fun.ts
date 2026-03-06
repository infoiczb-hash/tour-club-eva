'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

export async function upsertFunTestAction(data: {
  id?: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  isActive: boolean;
  passCount?: number;
}) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

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
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    console.error('Error saving FunTest:', error);
    return { success: false, error: 'Не удалось сохранить тест' };
  }
}

export async function toggleFunTestStatusAction(id: string, currentStatus: boolean) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.funTest.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/fun');
    revalidatePath('/admin/fun');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    return { success: false };
  }
}

// Публичный — счётчик прохождений, auth не нужен
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

// Публичный — только чтение
export async function getFunTestsAction() {
  try {
    const tests = await prisma.funTest.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: tests };
  } catch (error) {
    return { success: false, data: [] };
  }
}