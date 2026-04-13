'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit'; // ✅ Добавлено ядро аудита
import { FunTest } from '@prisma/client';

type UpsertFunTestInput = Partial<Omit<FunTest, 'id' | 'createdAt' | 'updatedAt'>> & { id?: string };

// СОЗДАНИЕ/ОБНОВЛЕНИЕ: Завернуто в аудит
export const upsertFunTestAction = withAdminAuth(
  withAdminAudit({
    actionName: 'UPSERT_FUN_TEST',
    // Если id нет (при создании), пробуем использовать slug как идентификатор цели
    getTargetId: (data: UpsertFunTestInput) => data.id || data.slug,
  })(async (data: UpsertFunTestInput) => {
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
  })
);

// СМЕНА СТАТУСА: Завернуто в аудит
export const toggleFunTestStatusAction = withAdminAuth(
  withAdminAudit({
    actionName: 'TOGGLE_FUN_TEST_STATUS',
    getTargetId: (id: string, _currentStatus: boolean) => id,
  })(async (id: string, currentStatus: boolean) => {
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
  })
);

// ЭКШЕН ОТ ПОЛЬЗОВАТЕЛЕЙ: Не оборачиваем ни в Auth, ни в Audit
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

// ЧТЕНИЕ: Аудит не нужен
export async function getFunTestsAction() {
  try {
    const tests = await prisma.funTest.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: tests };
  } catch (error) {
    return { success: false, data: [] };
  }
}