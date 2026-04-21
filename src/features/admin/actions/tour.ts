// src/features/admin/actions/tour.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth'; // ✅ ИМПОРТИРУЕМ НАШУ БРОНЮ
import { withAdminAudit } from '@/lib/audit'; // ✅ ИМПОРТИРУЕМ ЯДРО АУДИТА
import { publishToTelegram, publishTourToChannel, sendToUserTelegram } from '@/features/admin/actions/telegram';
import { env } from '@/lib/env';

import { tourFormSchema, type TourFormValues } from '@/features/admin/components/TourForm/schema';
import { notifySubscribersOnNewDates } from "@/lib/telegram/notify";

export type SaveTourPayload = Record<string, unknown> & {
  id?: string;
};

// ==========================================
// 1. SAVE TOUR (CREATE / UPDATE) - ЗАЩИЩЕНО + АУДИТ
// ==========================================
export const saveTour = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_TOUR',
    getTargetId: (formData: SaveTourPayload) => formData.id,
  })(async (formData: SaveTourPayload) => {
    try {
      // Внутри больше нет await requireAuth(), обертка уже все проверила!

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
        
        dates: Array.isArray(formData.dates) ? formData.dates.map((d: any) => ({
          ...d,
          guide_id: d.guide_id === "" ? null : d.guide_id 
        })) : [],
      };

      // 2. Валидация
      const result = tourFormSchema.safeParse(rawData);
      if (!result.success) {
        console.error('❌ Validation Error:', result.error.flatten());
        return { success: false, error: 'Ошибка проверки данных. Проверьте обязательные поля.' };
      }

      const data: TourFormValues = result.data;
      const mainGuideId = data.dates?.[0]?.guide_id || null;

      // Подготовка дат
      const tourDatesData = data.dates.map((d) => ({
        startDate: new Date(d.start),
        endDate: d.end ? new Date(d.end) : null,
        time: d.time || null,
        guideId: d.guide_id || null,
        groupChatUrl: d.groupChatUrl || null, 
        spots: data.spots,
        spotsLeft: data.spotsLeft,
      }));

      // 3. Формируем Payload
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
        dates: Prisma.JsonNull,
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
        // === UPDATE ===
        // 1. Находим ID дат, которые остались в форме (чтобы не удалить лишнее)
        const incomingIds = data.dates.map(d => d.id).filter(Boolean) as string[];
        
        // 2. Обновляем основные данные тура
        await prisma.tour.update({
          where: { id: formData.id as string },
          data: {
              ...prismaPayload,
          }, 
        });

        // 3. Удаляем только те даты, которые администратор реально удалил в интерфейсе
        await prisma.tourDate.deleteMany({
            where: { 
                tourId: formData.id as string,
                ...(incomingIds.length > 0 ? { id: { notIn: incomingIds } } : {})
            }
        });

        // 4. Точечно обновляем старые и создаем новые (сохраняем tourDateId у существующих броней)
        for (const d of data.dates) {
            const datePayload = {
                startDate: new Date(d.start),
                endDate: d.end ? new Date(d.end) : null,
                time: d.time || null,
                guideId: d.guide_id || null,
                groupChatUrl: d.groupChatUrl || null, 
                spots: data.spots,
                spotsLeft: data.spotsLeft,
            };

            if (d.id) {
                await prisma.tourDate.update({
                    where: { id: d.id },
                    data: datePayload
                });
            } else {
                await prisma.tourDate.create({
                    data: { ...datePayload, tourId: formData.id as string }
                });
            }
        }
      } else {
        // === CREATE ===
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
                tourDates: { create: tourDatesData }
            } 
        });
        savedTourId = newTour.id; 
      }

      // 👇 НАЧАЛО БЛОКА: ТРИГГЕР РАССЫЛКИ (LTV Engine) 👇
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
      // 👆 КОНЕЦ БЛОКА 👆

      revalidatePath('/admin');
      revalidatePath('/tour');
      revalidatePath(`/tour/${slug}`);
      revalidatePath('/');
      revalidatePath('/account/wishlist'); 

      // Отправка в общий паблик
      if (!formData.id && data.isActive) {
        publishTourToChannel({
          title:      data.title,
          subtitle:   data.subtitle,
          location:   data.location,
          duration:   data.duration ?? '',
          price:      data.price,
          currency:   data.currency,
          slug:       slug,
          coverImage: data.coverImage,
        }).catch(console.error);
      }

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
// Эту функцию не оборачиваем, так как она только читает список,
// и нам нужно, чтобы она возвращала массив, а не объект с ошибкой.
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
// 3. DELETE TOUR - ЗАЩИЩЕНО + АУДИТ
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
// 4. TOGGLE STATUS - ЗАЩИЩЕНО + АУДИТ
// ==========================================
export const updateTourStatus = withAdminAuth(
  withAdminAudit({
    actionName: 'UPDATE_TOUR_STATUS',
    // ПРОСТО ДОБАВЛЯЕМ ВТОРОЙ АРГУМЕНТ СЮДА (с нижним подчеркиванием, так как он не используется для ID):
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
          subtitle: true,
          location: true,
          duration: true,
          price: true,
          currency: true,
          coverImage: true,
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

        publishTourToChannel({
          title:      tour.title,
          subtitle:   tour.subtitle,
          location:   tour.location,
          duration:   tour.duration ?? '',
          price:      tour.price,
          currency:   tour.currency,
          slug:       tour.slug,
          coverImage: tour.coverImage,
        }).catch(console.error);
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
// 5. ПОЛУЧЕНИЕ ТУРОВ ДЛЯ АДМИНКИ С ПАГИНАЦИЕЙ (READ-ONLY)
// ==========================================

export interface GetToursAdminParams {
  page: number;
  limit?: number;
  search?: string;
  filter?: 'all' | 'upcoming' | 'past' | 'full' | 'drafts'; // ✅ ДОБАВИЛИ drafts
}

export const getToursAdmin = withAdminAuth(async (params: GetToursAdminParams) => {
  const { page, limit = 20, search, filter = 'upcoming' } = params; // ✅ ПО УМОЛЧАНИЮ 'upcoming'
  const skip = (page - 1) * limit;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const where: any = { deletedAt: null };
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }
  
  if (filter === 'upcoming') {
    where.isActive = true;
    where.tourDates = { some: { startDate: { gte: now } } }; // Есть будущие даты
  } else if (filter === 'past') {
    where.isActive = true;
    where.tourDates = { none: { startDate: { gte: now } } }; // Нет будущих дат (Архив)
  } else if (filter === 'drafts') {
    where.isActive = false; // Черновики
  } else if (filter === 'full') {
    where.isActive = true;
    where.tourDates = { some: { startDate: { gte: now }, spotsLeft: { lte: 0 } } }; // Места закончились
  }

  const [toursRaw, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        guide: true,
        category: true,
        tourDates: { orderBy: { startDate: 'asc' }, take: 3 },
      },
    }),
    prisma.tour.count({ where }),
  ]);

  // Используем существующий маппер из api.ts (динамический импорт, чтобы избежать циклических зависимостей)
  const { mapPrismaTourToFrontend } = await import('@/features/tours/api');
  const tours = toursRaw.map(mapPrismaTourToFrontend);

  return { success: true, tours, total };
});