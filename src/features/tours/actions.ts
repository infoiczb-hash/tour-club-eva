'use server';

// ✅ Полностью на Prisma — Supabase JS убран
// createTour / updateTour / deleteTour

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { withAdminAuth } from '@/lib/auth'; // 👈 Добавлена защита прав
import { withAdminAudit } from '@/lib/audit'; // ✅ Добавлен аудит

import { Tour } from './types';

// ==========================================
// 1. СОЗДАНИЕ ТУРА (ЗАЩИЩЕНО + АУДИТ)
// ==========================================
export const createTour = withAdminAuth(
  withAdminAudit({
    actionName: 'CREATE_TOUR',
    getTargetId: (data: Partial<Tour>) => data.slug || undefined,
  })(async (data: Partial<Tour>) => {
    try {
      const payload: Prisma.TourCreateInput = {
        title: data.title!,
        slug: data.slug!,
        location: data.location!,

        subtitle:     data.subtitle     ?? null,
        description:  data.description  ?? null,
        isActive:     data.isActive     ?? false,
        category: data.categoryId 
          ? { connect: { id: data.categoryId } } 
          : undefined,
        difficulty:   data.difficulty   ?? 'medium',
        label:        data.label        ?? '',
        tags:         data.tags         ?? [],

        route:        data.route        ?? null,
        distance:     data.distance     ?? null,
        duration:     data.duration     ?? null,
        meetingPoint: data.meetingPoint ?? null,

        // ✅ ИСПРАВЛЕНО: Безопасное приведение пользовательских типов к Prisma.InputJsonValue
        dates: (data.dates ?? []) as unknown as Prisma.InputJsonValue,

        guide: data.guide?.id
          ? { connect: { id: data.guide.id } }
          : undefined,

        currency:     data.currency     ?? 'RUB',
        price:        data.price        ?? 0,
        priceOld:     data.priceOld     ?? null,
        priceChild:   data.priceChild   ?? null,
        priceFamily:  data.priceFamily  ?? null,
        priceMember:  data.priceMember  ?? null,

        spots:        data.spots        ?? 15,
        spotsLeft:    data.spotsLeft    ?? 15,

        coverImage:   data.image        ?? null,
        gallery:      data.gallery      ?? [],

        // ✅ ИСПРАВЛЕНО: Приведение через unknown
        highlights: (data.highlights ?? []) as unknown as Prisma.InputJsonValue,
        program:    (data.program    ?? []) as unknown as Prisma.InputJsonValue,
        faq:        (data.faq        ?? []) as unknown as Prisma.InputJsonValue,
        checklist:  (data.checklist  ?? []) as unknown as Prisma.InputJsonValue,
        documents:  (data.documents  ?? []) as unknown as Prisma.InputJsonValue,

        included:           data.included           ?? [],
        additionalExpenses: data.additionalExpenses ?? [],

        metaTitle: data.metaTitle ?? null,
        metaDesc:  data.metaDesc  ?? null,

        biletpmrLink: data.biletpmrLink ?? null,
        apbQrLink:    data.apbQrLink ?? null,
        apbQrImage:   data.apbQrImage ?? null,
      };

      const tour = await prisma.tour.create({ data: payload });

      revalidatePath('/admin');
      revalidatePath('/tour');
      revalidatePath('/');
      return { success: true, data: tour };
    } catch (error: unknown) {
      // 🛡️ Защита от утечки данных: логируем ошибку на сервере, но не отдаем клиенту
      console.error('Create Tour Error:', error);
      return { success: false, error: 'Произошла внутренняя ошибка сервера при создании тура.' };
    }
  })
);

// ==========================================
// 2. ОБНОВЛЕНИЕ ТУРА (ЗАЩИЩЕНО + АУДИТ)
// ==========================================
export const updateTour = withAdminAuth(
  withAdminAudit({
    actionName: 'UPDATE_TOUR',
    getTargetId: (id: string, _data: Partial<Tour>) => id,
  })(async (id: string, data: Partial<Tour>) => {
    try {
      const payload: Prisma.TourUpdateInput = {};

      if (data.title       !== undefined) payload.title       = data.title;
      if (data.slug        !== undefined) payload.slug        = data.slug;
      if (data.subtitle    !== undefined) payload.subtitle    = data.subtitle;
      if (data.description !== undefined) payload.description = data.description;
      if (data.isActive    !== undefined) payload.isActive    = data.isActive;
      if (data.categoryId !== undefined) {
        payload.category = data.categoryId 
          ? { connect: { id: data.categoryId } } 
          : { disconnect: true }; 
      }
      if (data.difficulty  !== undefined) payload.difficulty  = data.difficulty ?? 'medium';
      if (data.label       !== undefined) payload.label       = data.label ?? '';
      if (data.tags        !== undefined) payload.tags        = data.tags;

      if (data.location     !== undefined) payload.location     = data.location;
      if (data.route        !== undefined) payload.route        = data.route;
      if (data.distance     !== undefined) payload.distance     = data.distance;
      if (data.duration     !== undefined) payload.duration     = data.duration;
      if (data.meetingPoint !== undefined) payload.meetingPoint = data.meetingPoint;

      if (data.dates !== undefined) {
        payload.dates = data.dates as unknown as Prisma.InputJsonValue;
      }

      if (data.guide !== undefined) {
        payload.guide = data.guide?.id
          ? { connect: { id: data.guide.id } }
          : { disconnect: true };
      }

      if (data.currency    !== undefined) payload.currency    = data.currency;
      if (data.price       !== undefined) payload.price       = data.price;
      if (data.priceOld    !== undefined) payload.priceOld    = data.priceOld;
      if (data.priceChild  !== undefined) payload.priceChild  = data.priceChild;
      if (data.priceFamily !== undefined) payload.priceFamily = data.priceFamily;
      if (data.priceMember !== undefined) payload.priceMember = data.priceMember;

      if (data.spots     !== undefined) payload.spots     = data.spots;
      if (data.spotsLeft !== undefined) payload.spotsLeft = data.spotsLeft;

      if (data.image   !== undefined) payload.coverImage = data.image;
      if (data.gallery !== undefined) payload.gallery    = data.gallery;

      if (data.highlights !== undefined) payload.highlights = data.highlights as unknown as Prisma.InputJsonValue;
      if (data.program    !== undefined) payload.program    = data.program    as unknown as Prisma.InputJsonValue;
      if (data.faq        !== undefined) payload.faq        = data.faq        as unknown as Prisma.InputJsonValue;
      if (data.checklist  !== undefined) payload.checklist  = data.checklist  as unknown as Prisma.InputJsonValue;
      if (data.documents  !== undefined) payload.documents  = data.documents  as unknown as Prisma.InputJsonValue;

      if (data.included           !== undefined) payload.included           = data.included;
      if (data.additionalExpenses !== undefined) payload.additionalExpenses = data.additionalExpenses;

      if (data.metaTitle !== undefined) payload.metaTitle = data.metaTitle;
      if (data.metaDesc  !== undefined) payload.metaDesc  = data.metaDesc;

      if (data.biletpmrLink !== undefined) payload.biletpmrLink = data.biletpmrLink;
      if (data.apbQrLink    !== undefined) payload.apbQrLink    = data.apbQrLink;
      if (data.apbQrImage   !== undefined) payload.apbQrImage   = data.apbQrImage;

      const tour = await prisma.tour.update({ where: { id }, data: payload });

      revalidatePath('/admin');
      revalidatePath('/tour');
      if (data.slug) revalidatePath(`/tour/${data.slug}`);
      revalidatePath('/');
      return { success: true, data: tour };
    } catch (error: unknown) {
      // 🛡️ Защита от утечки данных
      console.error('Update Tour Error:', error);
      return { success: false, error: 'Произошла внутренняя ошибка сервера при обновлении тура.' };
    }
  })
);

// ==========================================
// 3. УДАЛЕНИЕ ТУРА (ЗАЩИЩЕНО + АУДИТ)
// ==========================================
export const deleteTour = withAdminAuth(
  withAdminAudit({
    actionName: 'DELETE_TOUR',
    getTargetId: (id: string) => id,
  })(async (id: string) => {
    try {
      const tour = await prisma.tour.findUnique({
        where: { id },
        select: { slug: true },
      });

      await prisma.tour.delete({ where: { id } });

      revalidatePath('/admin');
      revalidatePath('/tour');
      if (tour?.slug) revalidatePath(`/tour/${tour.slug}`);
      revalidatePath('/');
      return { success: true };
    } catch (error: unknown) {
      // 🛡️ Защита от утечки данных
      console.error('Delete Tour Error:', error);
      return { success: false, error: 'Произошла внутренняя ошибка сервера при удалении тура.' };
    }
  })
);