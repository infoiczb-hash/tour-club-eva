// src/features/admin/actions/tourPriceCategories.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';

// ==========================================
// УПРАВЛЯЕМЫЕ КАТЕГОРИИ ЦЕН (TourPriceCategory) — v2.1
// CRUD для гибких категорий на тур
// ==========================================

const KeySchema = z
  .string()
  .trim()
  .min(1, 'Укажите системный ключ категории')
  .max(50)
  .regex(/^[a-z0-9_]+$/, 'Ключ может содержать только латиницу в нижнем регистре, цифры и "_" (например: adult, kayak_2)');

const UpsertPriceCategorySchema = z.object({
  id: z.string().uuid().optional(),
  tourId: z.string().uuid('Не указан тур'),
  key: KeySchema,
  label: z.string().trim().min(1, 'Укажите название категории').max(120),
  price: z.number().int('Цена должна быть целым числом').min(0, 'Цена не может быть отрицательной'),
  spotsPerUnit: z.number().int().min(0, 'Не может быть отрицательным').max(50).default(1),
  minQuantity: z.number().int().min(0).max(999).default(0),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type UpsertPriceCategoryInput = z.infer<typeof UpsertPriceCategorySchema>;

async function revalidateTourPaths(tourId: string) {
  const tour = await prisma.tour.findUnique({ where: { id: tourId }, select: { slug: true } });
  revalidatePath('/admin');
  revalidatePath('/tour');
  if (tour?.slug) revalidatePath(`/tour/${tour.slug}`);
}

// ------------------------------------------
// 1. ЧТЕНИЕ (активные и неактивные для админки)
// ------------------------------------------
export const getTourPriceCategoriesAction = withAdminAuth(async (tourId: string) => {
  try {
    const categories = await prisma.tourPriceCategory.findMany({
      where: { tourId },
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error('Ошибка загрузки категорий цен:', error);
    return { success: false, error: 'Не удалось загрузить категории цен' };
  }
});

// ------------------------------------------
// 2. СОЗДАНИЕ / ОБНОВЛЕНИЕ
// ------------------------------------------
export const upsertTourPriceCategoryAction = withAdminAuth(
  withAdminAudit({
    actionName: 'UPSERT_TOUR_PRICE_CATEGORY',
    getTargetId: (data: UpsertPriceCategoryInput) => data.id || `${data.tourId}:${data.key}`,
  })(async (raw: UpsertPriceCategoryInput) => {
    const parsed = UpsertPriceCategorySchema.safeParse(raw);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      parsed.error.issues.forEach((e) => {
        fields[e.path[0]?.toString() ?? 'unknown'] = e.message;
      });
      return { success: false, error: 'Ошибка проверки данных категории.', fields };
    }
    const data = parsed.data;

    try {
      const payload = {
        tourId: data.tourId,
        key: data.key,
        label: data.label,
        price: data.price,
        spotsPerUnit: data.spotsPerUnit,
        minQuantity: data.minQuantity,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      };

      let category;
      if (data.id) {
        category = await prisma.tourPriceCategory.update({
          where: { id: data.id },
          data: payload,
        });
      } else {
        category = await prisma.tourPriceCategory.create({ data: payload });
      }

      await revalidateTourPaths(data.tourId);
      return { success: true, data: category };
    } catch (error: unknown) {
      const err = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null;
      if (err?.code === 'P2002') {
        return { success: false, error: `Категория с ключом "${data.key}" уже существует у этого тура.`, fields: { key: 'Такой ключ уже используется' } };
      }
      console.error('Ошибка сохранения категории цен:', error);
      return { success: false, error: 'Не удалось сохранить категорию цен' };
    }
  })
);

// ------------------------------------------
// 3. УДАЛЕНИЕ (С защитой истории jsonb)
// ------------------------------------------
export const deleteTourPriceCategoryAction = withAdminAuth(
  withAdminAudit({
    actionName: 'DELETE_TOUR_PRICE_CATEGORY',
    getTargetId: (id: string) => id,
  })(async (id: string) => {
    try {
      const category = await prisma.tourPriceCategory.findUnique({ where: { id } });
      if (!category) {
        return { success: false, error: 'Категория не найдена' };
      }

      // ИСПРАВЛЕНИЕ: Безопасная сериализация JSON для PostgreSQL, 
      // учитываем регистр имени таблицы "Booking" (стандарт Prisma)
      const searchJson = JSON.stringify([{ categoryId: id }]);
      
      const usedInBookings = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count
        FROM "Booking"
        WHERE ticket_breakdown @> ${searchJson}::jsonb
      `;
      
      const usageCount = Number(usedInBookings[0]?.count ?? 0);

      if (usageCount > 0) {
        return {
          success: false,
          error: `Нельзя удалить: категория уже использована в ${usageCount} брони(ях). Деактивируйте её вместо удаления (переключатель "Активна"), чтобы сохранить историю.`,
        };
      }

      await prisma.tourPriceCategory.delete({ where: { id } });
      await revalidateTourPaths(category.tourId);
      return { success: true };
    } catch (error: unknown) {
      console.error('Ошибка удаления категории цен:', error);
      // Если таблица в БД реально называется bookings, а не "Booking", ловим ошибку и выводим подсказку
      return { success: false, error: 'Не удалось проверить историю или удалить категорию.' };
    }
  })
);

// 4. ПЕРЕКЛЮЧЕНИЕ АКТИВНОСТИ
// ------------------------------------------
export const toggleTourPriceCategoryStatusAction = withAdminAuth(
  withAdminAudit({
    actionName: 'TOGGLE_TOUR_PRICE_CATEGORY_STATUS',
    // ИСПРАВЛЕНИЕ: Добавили второй аргумент, чтобы типы совпали
    getTargetId: (id: string, currentStatus: boolean) => id, 
  })(async (id: string, currentStatus: boolean) => {
    try {
      const category = await prisma.tourPriceCategory.update({
        where: { id },
        data: { isActive: !currentStatus },
      });
      await revalidateTourPaths(category.tourId);
      return { success: true, data: category };
    } catch (error: unknown) {
      console.error('Ошибка переключения статуса категории цен:', error);
      return { success: false, error: 'Не удалось обновить статус категории' };
    }
  })
);

// ------------------------------------------
// 5. ИЗМЕНЕНИЕ ПОРЯДКА (drag-and-drop)
// ------------------------------------------
export const reorderTourPriceCategoriesAction = withAdminAuth(
  withAdminAudit({
    actionName: 'REORDER_TOUR_PRICE_CATEGORIES',
    // ИСПРАВЛЕНИЕ: Добавили второй аргумент массива, чтобы типы совпали
    getTargetId: (tourId: string, orderedIds: string[]) => tourId,
  })(async (tourId: string, orderedIds: string[]) => {
    try {
      await prisma.$transaction(
        orderedIds.map((id, index) =>
          prisma.tourPriceCategory.update({
            where: { id, tourId }, 
            data: { sortOrder: index },
          })
        )
      );
      await revalidateTourPaths(tourId);
      return { success: true };
    } catch (error: unknown) {
      console.error('Ошибка изменения порядка категорий цен:', error);
      return { success: false, error: 'Не удалось сохранить порядок категорий' };
    }
  })
);