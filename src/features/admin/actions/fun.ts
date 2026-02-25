// src/features/admin/fun/actions.ts
'use server';

import { prisma } from '@/lib/prisma'; // Убедись, что путь к prisma client правильный
import { revalidatePath } from 'next/cache';

// 1. Создание или обновление теста (Upsert)
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
    const test = await prisma.funTest.upsert({
      where: { slug: data.slug }, // Ищем по slug, так как он уникальный
      update: {
        title: data.title,
        description: data.description,
        image: data.image,
        category: data.category,
        isActive: data.isActive,
        passCount: data.passCount ?? undefined, // Если передали, обновляем
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

    // Сбрасываем кэш, чтобы изменения сразу появились на сайте
    revalidatePath('/fun');
    revalidatePath('/admin/fun');
    
    return { success: true, test };
  } catch (error) {
    console.error("Error saving FunTest:", error);
    return { success: false, error: "Не удалось сохранить тест" };
  }
}

// 2. Быстрое переключение On/Off прямо из таблицы в админке
export async function toggleFunTestStatusAction(id: string, currentStatus: boolean) {
  try {
    await prisma.funTest.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/fun');
    revalidatePath('/admin/fun');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 3. Увеличение счетчика прохождений (Это мы потом вызовем внутри самих модалок на клиенте)
export async function incrementFunTestPassAction(slug: string) {
  try {
    await prisma.funTest.update({
      where: { slug },
      data: { passCount: { increment: 1 } },
    });
    // Тут кэш не сбрасываем, чтобы не дергать сервер при каждом прохождении
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
export async function getFunTestsAction() {
  try {
    const tests = await prisma.funTest.findMany({ orderBy: { createdAt: "desc" } });
    return { success: true, data: tests };
  } catch (error) {
    return { success: false, data: [] };
  }
}