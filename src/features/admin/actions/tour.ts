'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

// ==========================================
// ZOD SCHEMA
// ==========================================
const tourSchema = z.object({
  id: z.string().optional(),

  isActive: z.boolean().default(false),

  title: z.string().min(3, 'Название обязательно'),
  subtitle: z.string().optional().nullable(),
  slug: z.string().min(3),

  type: z.string().default('hiking'),
  difficulty: z.string().default('medium'),
  label: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),

  location: z.string(),
  route: z.string().optional().nullable(),
  distance: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  meetingPoint: z.string().optional().nullable(),

  dates: z.array(z.object({
    start: z.string(),
    end: z.string().optional(),
    time: z.string().optional(),
    guide_id: z.string().optional().nullable(),
  })).default([]),

  currency: z.string().default('RUB'),
  price: z.coerce.number(),
  priceOld: z.coerce.number().optional().nullable(),
  priceChild: z.coerce.number().optional().nullable(),
  priceFamily: z.coerce.number().optional().nullable(),
  priceMember: z.coerce.number().optional().nullable(),

  spots: z.coerce.number().default(15),
  spotsLeft: z.coerce.number().default(15),

  coverImage: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),

  description: z.string().optional().nullable(),
  highlights: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
  })).default([]),
  program: z.array(z.object({
    day: z.number().optional(),
    title: z.string(),
    description: z.string().optional(),
    activities: z.array(z.string()).optional(),
  })).default([]),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
  checklist: z.array(z.object({
    title: z.string(),
    items: z.array(z.string()).optional(),
  })).default([]),
  documents: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
  })).default([]),

  included: z.array(z.string()).default([]),
  additionalExpenses: z.array(z.string()).default([]),

  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
});

type TourPayload = z.infer<typeof tourSchema>;

// ==========================================
// SAVE TOUR (CREATE / UPDATE)
// ==========================================
export async function saveTour(formData: any) {
  try {
    // ✅ AUTH CHECK
    await requireAuth();

    const rawData = {
      ...formData,
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
    };

    const result = tourSchema.safeParse(rawData);
    if (!result.success) {
      console.error('❌ Validation Error:', result.error.flatten());
      return { success: false, error: 'Ошибка проверки данных. Проверьте обязательные поля.' };
    }

    const data: TourPayload = result.data;
    const mainGuideId = data.dates?.[0]?.guide_id ?? null;

    // ✅ Типизированный payload — без as any
    const prismaPayload = {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      isActive: data.isActive,

      type: data.type,
      difficulty: data.difficulty,
      label: data.label ?? '',
      tags: data.tags,

      location: data.location,
      route: data.route ?? null,
      distance: data.distance ?? null,
      duration: data.duration ?? null,
      meetingPoint: data.meetingPoint ?? null,

      dates: data.dates,
      // ✅ connect/disconnect вместо guideId напрямую — иначе конфликт типов Prisma
      guide: mainGuideId
        ? { connect: { id: mainGuideId } }
        : { disconnect: true },

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
      highlights: data.highlights,
      program: data.program,
      faq: data.faq,
      checklist: data.checklist,
      documents: data.documents,

      included: data.included,
      additionalExpenses: data.additionalExpenses,

      metaTitle: data.metaTitle ?? null,
      metaDesc: data.metaDesc ?? null,
    };

    let slug = data.slug;

    if (formData.id) {
      // === UPDATE ===
      await prisma.tour.update({
        where: { id: formData.id },
        data: prismaPayload,
      });
    } else {
      // === CREATE — проверка slug, инкремент вместо рандома ===
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

      await prisma.tour.create({ data: prismaPayload });
    }

    // ✅ revalidatePath со slug
    revalidatePath('/admin');
    revalidatePath('/tour');
    revalidatePath(`/tour/${slug}`);
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' };
    }
    console.error('❌ Database Error:', error);
    return { success: false, error: error.message || 'Ошибка сохранения в базу' };
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
// DELETE TOUR
// ==========================================
export async function deleteTour(id: string) {
  try {
    // ✅ AUTH CHECK
    await requireAuth();

    const tour = await prisma.tour.findUnique({ where: { id }, select: { slug: true } });
    await prisma.tour.delete({ where: { id } });

    revalidatePath('/admin');
    revalidatePath('/tour');
    if (tour?.slug) revalidatePath(`/tour/${tour.slug}`); // ✅ slug, не ID
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' };
    }
    console.error('Delete Error:', error);
    return { success: false, error: 'Ошибка удаления' };
  }
}

// ==========================================
// TOGGLE STATUS
// ==========================================
export async function updateTourStatus(id: string, isActive: boolean) {
  try {
    // ✅ AUTH CHECK
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
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'Ошибка обновления статуса' };
  }
}