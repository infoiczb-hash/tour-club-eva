'use server';

// ✅ Полностью на Prisma — Supabase JS убран
// createTour / updateTour / deleteTour

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

import { Tour } from './types';

// ==========================================
// 1. СОЗДАНИЕ ТУРА
// ==========================================
export async function createTour(data: Partial<Tour>) {
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

      dates: (data.dates ?? []) as Prisma.InputJsonValue,

      // Связь с гидом через connect — правильный Prisma-способ
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

      highlights: (data.highlights ?? []) as Prisma.InputJsonValue,
      program:    (data.program    ?? []) as Prisma.InputJsonValue,
      faq:        (data.faq        ?? []) as Prisma.InputJsonValue,
      checklist:  (data.checklist  ?? []) as Prisma.InputJsonValue,
      documents:  (data.documents  ?? []) as Prisma.InputJsonValue,

      included:           data.included           ?? [],
      additionalExpenses: data.additionalExpenses ?? [],

      metaTitle: data.metaTitle ?? null,
      metaDesc:  data.metaDesc  ?? null,
    };

    const tour = await prisma.tour.create({ data: payload });

    revalidatePath('/admin');
    revalidatePath('/tour');
    revalidatePath('/');
    return { success: true, data: tour };
  } catch (error: any) {
    console.error('Create Tour Error:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. ОБНОВЛЕНИЕ ТУРА
// ==========================================
export async function updateTour(id: string, data: Partial<Tour>) {
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
    : { disconnect: true }; // Или undefined, если это только для создания (Create)
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
      payload.dates = data.dates as Prisma.InputJsonValue;
    }

    // connect / disconnect — не guideId напрямую
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

    if (data.highlights !== undefined) payload.highlights = data.highlights as Prisma.InputJsonValue;
    if (data.program    !== undefined) payload.program    = data.program    as Prisma.InputJsonValue;
    if (data.faq        !== undefined) payload.faq        = data.faq        as Prisma.InputJsonValue;
    if (data.checklist  !== undefined) payload.checklist  = data.checklist  as Prisma.InputJsonValue;
    if (data.documents  !== undefined) payload.documents  = data.documents  as Prisma.InputJsonValue;

    if (data.included           !== undefined) payload.included           = data.included;
    if (data.additionalExpenses !== undefined) payload.additionalExpenses = data.additionalExpenses;

    if (data.metaTitle !== undefined) payload.metaTitle = data.metaTitle;
    if (data.metaDesc  !== undefined) payload.metaDesc  = data.metaDesc;

    const tour = await prisma.tour.update({ where: { id }, data: payload });

    revalidatePath('/admin');
    revalidatePath('/tour');
    if (data.slug) revalidatePath(`/tour/${data.slug}`);
    revalidatePath('/');
    return { success: true, data: tour };
  } catch (error: any) {
    console.error('Update Tour Error:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 3. УДАЛЕНИЕ ТУРА
// ==========================================
export async function deleteTour(id: string) {
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
  } catch (error: any) {
    console.error('Delete Tour Error:', error);
    return { success: false, error: error.message };
  }
}