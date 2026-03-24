// src/features/admin/actions/tour.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
// 👇 ДОБАВЛЕНО: Импорты для работы с Telegram
import { publishToTelegram, sendToUserTelegram } from '@/features/admin/actions/telegram';
import { env } from '@/lib/env';

import { tourFormSchema, type TourFormValues } from '@/features/admin/components/TourForm/schema';
import { notifySubscribersOnNewDates } from "@/lib/telegram/notify";

export type SaveTourPayload = Record<string, unknown> & {
  id?: string;
};

// ==========================================
// 1. SAVE TOUR (CREATE / UPDATE) - ОБНОВЛЕННАЯ ФУНКЦИЯ
// ==========================================
export async function saveTour(formData: SaveTourPayload) {
  try {
    await requireAuth();

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
      dates: data.dates as unknown as Prisma.InputJsonValue,
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
      metaTitle: data.metaTitle ?? null,
      metaDesc: data.metaDesc ?? null,
    };

    let slug = data.slug;
    let savedTourId = formData.id as string;

    if (formData.id) {
      // === UPDATE ===
      await prisma.tour.update({
        where: { id: formData.id as string },
        data: {
            ...prismaPayload,
            tourDates: {
                deleteMany: {}, // Очищаем старые даты
                create: tourDatesData // Пишем новые
            }
        }, 
      });
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
         // Единый сервис соберет Ждунов (по memberId и телефону), 
         // Подписчиков категории, Избранное, и разошлет всем пуши параллельно.
         await notifySubscribersOnNewDates(
           savedTourId,
           data.categoryId || null, // Если в data есть categoryId, передаем его
           data.title,
           slug
         );
       } catch (notifyError) {
         console.error("Ошибка при автоматической рассылке Telegram:", notifyError);
         // Не даем ошибке рассылки сломать сохранение тура
       }
    }
    // 👆 КОНЕЦ БЛОКА 👆

    revalidatePath('/admin');
    revalidatePath('/tour');
    revalidatePath(`/tour/${slug}`);
    revalidatePath('/');

    // Отправка в общий паблик
    if (!formData.id && data.isActive) {
      const caption = [
        `🏕 <b>${data.title}</b>`,
        data.subtitle ? `<i>${data.subtitle}</i>` : null,
        ``,
        `📍 ${data.location}`,
        data.duration ? `⏱ ${data.duration}` : null,
        `💰 от ${data.price} ${data.currency}`,
      ].filter(Boolean).join('\n');

      publishToTelegram(
        caption,
        data.coverImage ?? undefined,
        `${env.NEXT_PUBLIC_SITE_URL}/tour/${slug}`,
        true
      ).catch(console.error);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' };
    }
    console.error('❌ Database Error in saveTour:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при сохранении тура.' };
  }
}

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
// 3. DELETE TOUR (БЕЗ ИЗМЕНЕНИЙ)
// ==========================================
export async function deleteTour(id: string) {
  try {
    await requireAuth();

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
    if (err.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' };
    }
    console.error('Delete Error:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при удалении тура.' };
  }
}

// ==========================================
// 4. TOGGLE STATUS (ОБНОВЛЕНО С ТЕЛЕГРАМ-РАССЫЛКОЙ)
// ==========================================
export async function updateTourStatus(id: string, isActive: boolean) {
  try {
    await requireAuth();

    // 1. Обновляем статус и запрашиваем нужные поля для ТГ-рассылки
    const tour = await prisma.tour.update({
      where: { id },
      data: { isActive },
      select: { 
        id: true,
        slug: true, 
        title: true,
        categoryId: true,
        isActive: true
      },
    });

    // 2. НАШ ТРИГГЕР: Если тур только что активировали (опубликовали) — запускаем рассылку
    if (tour.isActive) {
      try {
        // Убедись, что функция импортирована в начале файла:
        // import { notifySubscribersOnNewDates } from "@/lib/telegram/notify";
        await notifySubscribersOnNewDates(
          tour.id,
          tour.categoryId,
          tour.title,
          tour.slug
        );
      } catch (notifyError) {
        console.error("Ошибка при рассылке уведомлений Telegram (updateTourStatus):", notifyError);
        // Мы только логируем ошибку, чтобы она не сломала админу обновление статуса
      }
    }

    revalidatePath('/admin');
    revalidatePath('/tour');
    revalidatePath(`/tour/${tour.slug}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' };
    }
    console.error('Update Status Error:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при обновлении статуса.' };
  }
}