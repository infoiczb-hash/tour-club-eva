// src/features/admin/actions/tour.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth'; 
import { withAdminAudit } from '@/lib/audit'; 
import { publishToTelegram, publishTourToChannel, sendToUserTelegram } from '@/features/admin/actions/telegram';
import { env } from '@/lib/env';

import { tourFormSchema, type TourFormValues } from '@/features/admin/components/TourForm/schema';
import { notifySubscribersOnNewDates } from "@/lib/telegram/notify";

export type SaveTourPayload = Record<string, unknown> & {
  id?: string;
};

// ==========================================
// 1. SAVE TOUR (CREATE / UPDATE) - МОНОЛИТНЫЙ ЭКШЕН
// ==========================================
export const saveTour = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_TOUR',
    getTargetId: (formData: SaveTourPayload) => formData.id,
  })(async (formData: SaveTourPayload) => {
    try {
      // 1. Нормализуем данные
      const rawData = {
        ...formData,
        categoryId: formData.categoryId ?? formData.category_id,
        isActive: formData.isActive ?? formData.is_active ?? false,
        meetingPoint: formData.meetingPoint ?? formData.meeting_point,
        priceOld: formData.priceOld ?? formData.price_old,
        priceChild: formData.priceChild ?? formData.price_child,
        priceFamily: formData.priceFamily ?? formData.price_family,
        priceMember: formData.priceMember ?? formData.price_member,
        spotsLeft: formData.spotsLeft ?? formData.spots_left,
        coverImage: formData.coverImage ?? formData.cover_image ?? formData.image,
        additionalExpenses: formData.additionalExpenses ?? formData.additional_expenses,
        metaTitle: formData.metaTitle ?? formData.meta_title,
        metaDesc: formData.metaDesc ?? formData.meta_desc,
        
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        included: Array.isArray(formData.included) ? formData.included : [],
        priceCategories: Array.isArray(formData.priceCategories) ? formData.priceCategories : [],
        
        dates: Array.isArray(formData.dates) ? formData.dates.map((d: any) => ({
          ...d,
          guide_id: d.guide_id === "" ? null : d.guide_id 
        })) : [],
      };

      // 2. Валидация схемы
      const result = tourFormSchema.safeParse(rawData);
      if (!result.success) {
        console.error('❌ Validation Error:', result.error.flatten());
        return { success: false, error: 'Ошибка проверки данных. Проверьте обязательные поля.' };
      }

      const data: TourFormValues = result.data;
      const mainGuideId = data.dates?.[0]?.guide_id || null;

      // 3. Валидация дубликатов ключей (key) в категориях цен
      const catKeys = data.priceCategories.map(c => c.key);
      if (new Set(catKeys).size !== catKeys.length) {
        return { success: false, error: 'Ключи категорий цен (Например: adult, kayak_2) должны быть уникальными!' };
      }

      // 4. Подготовка дат выездов
      const tourDatesData = data.dates.map((d) => ({
        startDate: new Date(d.start),
        endDate: d.end ? new Date(d.end) : null,
        time: d.time || null, 
        guideId: d.guide_id || null,
        groupChatUrl: d.groupChatUrl || null, 
        spots: d.spots ?? data.spots,
        spotsLeft: d.spotsLeft ?? d.spots ?? data.spots,
        basePrice: d.basePrice ?? null,
        discountEarlyBird: d.discountEarlyBird ?? null,
        earlyBirdDeadline: d.earlyBirdDeadline ?? null,
        surchargeLastMinute: d.surchargeLastMinute ?? null,
        lastMinuteTrigger: d.lastMinuteTrigger ?? null,
      }));

      // 5. Базовый Payload (без вложенных массивов дат и цен)
      const prismaPayload: Prisma.TourUncheckedCreateInput = {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle ?? null,
        isActive: data.isActive,
        categoryId: data.categoryId ?? null, 
        difficulty: data.difficulty,
        label: data.label ?? '',
        tags: data.tags,
        location: data.location,
        route: data.route ?? null,
        distance: data.distance ?? null,
        duration: data.duration ?? null,
        meetingPoint: data.meetingPoint ?? null,
        dates: Prisma.JsonNull, // Legacy field fallback
        guideId: mainGuideId,
        currency: data.currency,
        price: data.price,
        priceOld: data.priceOld ?? null,
        priceChild: data.priceChild ?? null,
        priceFamily: data.priceFamily ?? null,
        priceMember: data.priceMember ?? null,
        spots: data.spots,
        spotsLeft: data.spotsLeft,
        coverImage: data.coverImage ?? null,
        gallery: data.gallery,
        description: data.description ?? null,
        highlights: data.highlights as unknown as Prisma.InputJsonValue,
        program: data.program as unknown as Prisma.InputJsonValue,
        faq: data.faq as unknown as Prisma.InputJsonValue,
        checklist: data.checklist as unknown as Prisma.InputJsonValue,
        documents: data.documents as unknown as Prisma.InputJsonValue,
        included: data.included,
        additionalExpenses: data.additionalExpenses,
        tourFormat: data.tourFormat ?? null,
        accommodation: data.accommodation ?? null,
        groupInfo: data.groupInfo ?? null,
        importantInfo: data.importantInfo ?? null,
        includedDetailed: data.includedDetailed ? (data.includedDetailed as Prisma.InputJsonValue) : Prisma.JsonNull,
        excludedDetailed: data.excludedDetailed ? (data.excludedDetailed as Prisma.InputJsonValue) : Prisma.JsonNull,
        biletpmrLink: formData.biletpmrLink as string | undefined ?? null,
        apbQrLink: formData.apbQrLink as string | undefined ?? null,
        apbQrImage: formData.apbQrImage as string | undefined ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
      };

      let slug = data.slug;
      let savedTourId = formData.id as string;

      if (formData.id) {
        // ==========================================
        // UPDATE (Сложная логика синхронизации массивов)
        // ==========================================
        
        // --- ЗАЩИТА ОТ УДАЛЕНИЯ ИСПОЛЬЗУЕМЫХ КАТЕГОРИЙ ЦЕН ---
        const incomingCatIds = data.priceCategories.map(c => c.id).filter(Boolean) as string[];
        const existingCats = await prisma.tourPriceCategory.findMany({ where: { tourId: formData.id as string } });
        const catsToDelete = existingCats.filter(ec => !incomingCatIds.includes(ec.id));

        for (const cat of catsToDelete) {
          const searchJson = JSON.stringify([{ categoryId: cat.id }]);
          const usedInBookings = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint as count
            FROM "Booking"
            WHERE "tourId" = ${formData.id as string} 
            AND "ticketBreakdown" @> ${searchJson}::jsonb
          `;
          
          const usageCount = Number(usedInBookings[0]?.count ?? 0);
          if (usageCount > 0) {
            return { 
              success: false, 
              error: `ОШИБКА: Вы удалили категорию «${cat.label}», по которой уже куплено билетов: ${usageCount} шт. Верните её и просто выключите тумблер "Активна", чтобы скрыть с сайта и сохранить историю.` 
            };
          }
        }
        
        // 1. Обновляем основные данные тура
        await prisma.tour.update({
          where: { id: formData.id as string },
          data: prismaPayload, 
        });

        // --- УПРАВЛЕНИЕ КАТЕГОРИЯМИ ЦЕН ---
        // Точечно создаем новые и обновляем старые
        for (const cat of data.priceCategories) {
          const catPayload = {
            key: cat.key,
            label: cat.label,
            price: cat.price,
            spotsPerUnit: cat.spotsPerUnit,
            minQuantity: cat.minQuantity,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive
          };

          if (cat.id) {
            await prisma.tourPriceCategory.update({ where: { id: cat.id }, data: catPayload });
          } else {
            await prisma.tourPriceCategory.create({ data: { ...catPayload, tourId: savedTourId } });
          }
        }
        
        // Удаляем те, которые админ стер (мы уже убедились выше, что они безопасны)
        if (catsToDelete.length > 0) {
          await prisma.tourPriceCategory.deleteMany({
            where: { id: { in: catsToDelete.map(c => c.id) } }
          });
        }

        // --- УПРАВЛЕНИЕ ДАТАМИ ВЫЕЗДОВ ---
        const incomingDateIds = data.dates.map(d => d.id).filter(Boolean) as string[];
        await prisma.tourDate.deleteMany({
            where: { 
                tourId: formData.id as string,
                ...(incomingDateIds.length > 0 ? { id: { notIn: incomingDateIds } } : {})
            }
        });

        for (const d of data.dates) {
            const currentSpots = d.spots ?? data.spots;

            const basePayload = {
              startDate: new Date(d.start),
              endDate: d.end ? new Date(d.end) : null,
              time: d.time || null,
              guideId: d.guide_id || null,
              groupChatUrl: d.groupChatUrl || null,
              spots: currentSpots,
              basePrice: d.basePrice ?? null,
              discountEarlyBird: d.discountEarlyBird ?? null,
              earlyBirdDeadline: d.earlyBirdDeadline ?? null,
              surchargeLastMinute: d.surchargeLastMinute ?? null,
              lastMinuteTrigger: d.lastMinuteTrigger ?? null,
            };

            if (d.id) {
                const updateData: Record<string, any> = { ...basePayload };
                if (d.spotsLeft !== undefined && d.spotsLeft !== null) {
                    updateData.spotsLeft = Number(d.spotsLeft);
                }
                await prisma.tourDate.update({ where: { id: d.id }, data: updateData });
            } else {
                await prisma.tourDate.create({
                    data: { 
                        ...basePayload, 
                        tourId: formData.id as string,
                        spotsLeft: (d.spotsLeft !== undefined && d.spotsLeft !== null) 
                            ? Number(d.spotsLeft) 
                            : currentSpots
                    }
                });
            }
        }

      } else {
        // ==========================================
        // CREATE (Создание нового тура)
        // ==========================================
        const existing = await prisma.tour.findUnique({ where: { slug } });
        if (existing) {
          let counter = 1;
          let candidate = `${slug}-${counter}`;
          while (await prisma.tour.findUnique({ where: { slug: candidate } })) {
            counter++;
            candidate = `${slug}-${counter}`;
          }
          slug = candidate;
          prismaPayload.slug = slug;
        }

        const newTour = await prisma.tour.create({ 
            data: {
                ...prismaPayload,
                tourDates: { create: tourDatesData },
                priceCategories: {
                  create: data.priceCategories.map(c => ({
                    key: c.key,
                    label: c.label,
                    price: c.price,
                    spotsPerUnit: c.spotsPerUnit,
                    minQuantity: c.minQuantity,
                    sortOrder: c.sortOrder,
                    isActive: c.isActive
                  }))
                }
            } 
        });
        savedTourId = newTour.id; 
      }

      // ==========================================
      // ТРИГГЕР РАССЫЛКИ (LTV Engine)   
      // ==========================================
      const hasNewDates = data.dates.some(d => !d.id);
      if (hasNewDates && data.isActive) {
         try {
           await notifySubscribersOnNewDates(
             savedTourId,
             data.categoryId || null,
             data.title,
             slug
           );
         } catch (notifyError) {
           console.error("Ошибка при автоматической рассылке Telegram:", notifyError);
         }
      }

      revalidatePath('/admin');
      revalidatePath('/tour');
      revalidatePath(`/tour/${slug}`);
      revalidatePath('/');
      revalidatePath('/account/wishlist'); 

      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Database Error in saveTour:', err);
      return { success: false, error: 'Произошла внутренняя ошибка сервера при сохранении тура.' };
    }
  })
);

// ==========================================
// 2. GET ACTIVE GUIDES (БЕЗ ИЗМЕНЕНИЙ)
// ==========================================
export async function getActiveGuides() {
  try {
    const guides = await prisma.guide.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return guides;
  } catch (error) {
    console.error('Error fetching guides:', error);
    return [];
  }
}

// ==========================================
// 3. DELETE TOUR
// ==========================================
export const deleteTour = withAdminAuth(
  withAdminAudit({
    actionName: 'DELETE_TOUR',
    getTargetId: (id: string) => id,
  })(async (id: string) => {
    try {
      const tour = await prisma.tour.findUnique({ where: { id }, select: { slug: true } });
      
      await prisma.tour.update({ 
          where: { id },
          data: { deletedAt: new Date(), isActive: false }
      });

      revalidatePath('/admin');
      revalidatePath('/tour');
      if (tour?.slug) revalidatePath(`/tour/${tour.slug}`); 
      revalidatePath('/');
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Delete Error:', err);
      return { success: false, error: 'Произошла внутренняя ошибка сервера при удалении тура.' };
    }
  })
);

// ==========================================
// 4. TOGGLE STATUS
// ==========================================
export const updateTourStatus = withAdminAuth(
  withAdminAudit({
    actionName: 'UPDATE_TOUR_STATUS',
    getTargetId: (id: string, _isActive: boolean) => id,
  })(async (id: string, isActive: boolean) => {
    try {
      const existing = await prisma.tour.findUnique({
        where: { id },
        select: { isActive: true },
      });

      const tour = await prisma.tour.update({
        where: { id },
        data: { isActive },
        select: { 
          id: true,
          slug: true, 
          title: true,
          categoryId: true,
          isActive: true,
        },
      });

      const isFirstPublish = !existing?.isActive && isActive;

      if (isFirstPublish) {
        try {
          await notifySubscribersOnNewDates(tour.id, tour.categoryId, tour.title, tour.slug);
        } catch (notifyError) {
          console.error("Ошибка при рассылке уведомлений Telegram (updateTourStatus):", notifyError);
        }
      }

      revalidatePath('/admin');
      revalidatePath('/tour');
      revalidatePath(`/tour/${tour.slug}`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Update Status Error:', err);
      return { success: false, error: 'Произошла внутренняя ошибка сервера при обновлении статуса.' };
    }
  })
);

// ==========================================
// 5. ПОЛУЧЕНИЕ ТУРОВ ДЛЯ АДМИНКИ С ПАГИНАЦИЕЙ
// ==========================================

export interface GetToursAdminParams {
  page: number;
  limit?: number;
  search?: string;
  filter?: 'all' | 'upcoming' | 'past' | 'full' | 'drafts'; 
}

export const getToursAdmin = withAdminAuth(async (params: GetToursAdminParams) => {
  const { page, limit = 20, search, filter = 'upcoming' } = params;
  const skip = (page - 1) * limit;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // 🚀 SENIOR FIX: Задаем строгий тип для объекта фильтрации Prisma
  const where: Prisma.TourWhereInput = { deletedAt: null };
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }
  
  if (filter === 'upcoming') {
    where.isActive = true;
    where.tourDates = { some: { startDate: { gte: now } } }; 
  } else if (filter === 'past') {
    where.isActive = true;
    where.tourDates = { none: { startDate: { gte: now } } }; 
  } else if (filter === 'drafts') {
    where.isActive = false; 
  } else if (filter === 'full') {
    where.isActive = true;
    where.tourDates = { some: { startDate: { gte: now }, spotsLeft: { lte: 0 } } }; 
  }

  // 🚀 SENIOR FIX: Выносим структуру инклуда и типизируем через константу во избежание потери вложенности
  const tourInclude = {
    guide: true,
    category: true,
    tourDates: { orderBy: { startDate: 'asc' as const }, take: 3 },
    priceCategories: { orderBy: { sortOrder: 'asc' as const } }
  } satisfies Prisma.TourInclude;

  const [toursRaw, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: tourInclude,
    }),
    prisma.tour.count({ where }),
  ]);

  const { mapPrismaTourToFrontend } = await import('@/features/tours/api');
  
  // 🚀 SENIOR FIX: Безопасное и строгое сопоставление типов на базе утилиты Parameters без 'any'
  const tours = toursRaw.map((tour) => 
    mapPrismaTourToFrontend(tour as Parameters<typeof mapPrismaTourToFrontend>[0])
  );

  return { success: true, tours, total };
});