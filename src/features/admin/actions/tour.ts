// src/features/admin/actions/tour.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { env } from '@/lib/env';

import { tourFormSchema, type TourFormValues } from '@/features/admin/components/TourForm/schema';

export type SaveTourPayload = Record<string, unknown> & {
  id?: string;
};

// ==========================================
// SAVE TOUR (CREATE / UPDATE)
// ==========================================
export async function saveTour(formData: SaveTourPayload) {
  try {
    await requireAuth();

    // 1. Нормализуем данные, приводя старые snake_case к camelCase
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

    // 2. Валидируем данные через ЕДИНУЮ схему Zod
    const result = tourFormSchema.safeParse(rawData);
    if (!result.success) {
      console.error('❌ Validation Error:', result.error.flatten());
      return { success: false, error: 'Ошибка проверки данных. Проверьте обязательные поля.' };
    }

    const data: TourFormValues = result.data;
    const mainGuideId = data.dates?.[0]?.guide_id || null;

    // ✅ ПОДГОТОВКА ДАТ ДЛЯ РЕЛЯЦИОННОЙ ТАБЛИЦЫ
    const tourDatesData = data.dates.map((d) => ({
      startDate: new Date(d.start),
      endDate: d.end ? new Date(d.end) : null,
      time: d.time || null,
      guideId: d.guide_id || null,
      spots: data.spots,
      spotsLeft: data.spotsLeft, // В будущем здесь будет логика сохранения остатка мест при редактировании
    }));

    // 3. Формируем Payload тура
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

      // Даты теперь идут в tourDates, но для жесткой обратной совместимости оставляем и JSON
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

   // ✅ ПРОБРАСЫВАЕМ НОВЫЕ ПОЛЯ (если они пришли с фронта)
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

      await prisma.tour.create({ 
          data: {
              ...prismaPayload,
              tourDates: { create: tourDatesData }
          } 
      }); 
    }

    revalidatePath('/admin');
    revalidatePath('/tour');
    revalidatePath(`/tour/${slug}`);
    revalidatePath('/');

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
    // 🛡️ Защита от утечки данных: логируем настоящую ошибку на сервере, отдаем заглушку
    console.error('❌ Database Error in saveTour:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при сохранении тура.' };
  }
}

// ==========================================
// GET ACTIVE GUIDES (для формы)
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
// DELETE TOUR (✅ SOFT DELETE)
// ==========================================
export async function deleteTour(id: string) {
  try {
    await requireAuth();

    const tour = await prisma.tour.findUnique({ where: { id }, select: { slug: true } });
    
    // ✅ ИСПРАВЛЕНИЕ: Вместо физического удаления, скрываем тур из выдачи
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
    // 🛡️ Защита от утечки
    console.error('Delete Error:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при удалении тура.' };
  }
}

// ==========================================
// TOGGLE STATUS
// ==========================================
export async function updateTourStatus(id: string, isActive: boolean) {
  try {
    await requireAuth();

    const tour = await prisma.tour.update({
      where: { id },
      data: { isActive },
      select: { slug: true },
    });

    revalidatePath('/admin');
    revalidatePath('/tour');
    revalidatePath(`/tour/${tour.slug}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' };
    }
    // 🛡️ Защита от утечки
    console.error('Update Status Error:', err);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при обновлении статуса.' };
  }
}