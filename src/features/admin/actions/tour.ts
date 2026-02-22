'use server';

import { z } from 'zod'; // Используем Zod для валидации
import { prisma } from '@/lib/prisma'; 
import { revalidatePath } from 'next/cache';

// === 1. ZOD SCHEMA (Валидация данных с формы) ===
const tourSchema = z.object({
  id: z.string().optional(),
  
  // Статус
  isActive: z.boolean().default(false), // Было is_active, стало isActive
  
  // Шапка
  title: z.string().min(3, "Название обязательно"),
  subtitle: z.string().optional().nullable(),
  slug: z.string().min(3),
  
  // Маркетинг
  type: z.string().default("hiking"),
  difficulty: z.string().default("medium"),
  label: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),

  // Логистика
  location: z.string(),
  route: z.string().optional().nullable(),
  distance: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  meetingPoint: z.string().optional().nullable(), // Было meeting_point

  // Даты (JSON)
  dates: z.array(z.object({
    start: z.string(),
    end: z.string().optional(),
    time: z.string().optional(),
    guide_id: z.string().optional().nullable(),
  })).default([]),
  
  // Деньги
  currency: z.string().default("RUB"),
  price: z.coerce.number(), 
  priceOld: z.coerce.number().optional().nullable(),   
  priceChild: z.coerce.number().optional().nullable(), // Было price_child
  priceFamily: z.coerce.number().optional().nullable(), // Было price_family
  priceMember: z.coerce.number().optional().nullable(), // Было price_member
  
  spots: z.coerce.number().default(15),
  spotsLeft: z.coerce.number().default(15), // Было spots_left

  // Медиа
  coverImage: z.string().optional().nullable(), // Было cover_image
  gallery: z.array(z.string()).default([]),
  
  // Контент (JSON)
  description: z.string().optional().nullable(),
  highlights: z.array(z.any()).default([]), 
  program: z.array(z.any()).default([]),    
  faq: z.array(z.any()).default([]),
  checklist: z.array(z.any()).default([]),
  documents: z.array(z.any()).default([]),

  // Списки строк
  included: z.array(z.string()).default([]), 
  additionalExpenses: z.array(z.string()).default([]), // Было additional_expenses

  // SEO
  metaTitle: z.string().optional().nullable(), // Было meta_title
  metaDesc: z.string().optional().nullable(),  // Было meta_desc
});

// === 2. СОХРАНЕНИЕ ТУРА (CREATE / UPDATE) ===
export async function saveTour(formData: any) {
  try {
    console.log("💾 Saving tour:", formData.title);

    // 1. Предобработка данных перед валидацией
    // Некоторые поля могут прийти как строки или undefined
    const rawData = {
      ...formData,
      // Приводим к camelCase, если форма шлет snake_case
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
      
      // Гарантируем массивы
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      included: Array.isArray(formData.included) ? formData.included : [],
    };

    // 2. Валидация Zod
    const result = tourSchema.safeParse(rawData);

    if (!result.success) {
      console.error("❌ Validation Error:", result.error.flatten());
      return { success: false, error: "Ошибка проверки данных. Проверьте обязательные поля." };
    }

    const data = result.data;

    // 🔥 3. ВЫЧИСЛЯЕМ ГЛАВНОГО ГИДА
    // Берем guide_id из первой даты. Если там нет, то null.
    // Это критически важно для отображения гида в карточке.
    const mainGuideId = data.dates?.[0]?.guide_id || null;

    // 4. ПОДГОТОВКА PAYLOAD ДЛЯ PRISMA
    // Используем camelCase ключи, как в schema.prisma
    const prismaPayload = {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle,
      isActive: data.isActive,
      
      type: data.type,
      difficulty: data.difficulty,
      label: data.label,
      tags: data.tags,
      
      location: data.location,
      route: data.route,      
      distance: data.distance,
      duration: data.duration,
      meetingPoint: data.meetingPoint,
      
      dates: data.dates as any, // JSON
      guideId: mainGuideId,     // 🔥 Связь с таблицей Guide

      currency: data.currency,
      price: data.price,
      priceOld: data.priceOld,
      priceChild: data.priceChild,
      priceFamily: data.priceFamily,
      priceMember: data.priceMember,
      
      spots: data.spots,
      spotsLeft: data.spotsLeft,
      
      coverImage: data.coverImage,
      gallery: data.gallery,
      
      description: data.description,
      highlights: data.highlights as any, // JSON
      program: data.program as any,       // JSON
      faq: data.faq as any,               // JSON
      checklist: data.checklist as any,   // JSON
      documents: data.documents as any,   // JSON
      
      included: data.included,
      additionalExpenses: data.additionalExpenses,
      
      metaTitle: data.metaTitle,
      metaDesc: data.metaDesc,
    };

    // 5. ЗАПИСЬ В БД
    if (formData.id) {
      // Обновление
      await prisma.tour.update({
        where: { id: formData.id },
        // 👇 ДОБАВЛЕНО "as any"
        data: prismaPayload as any, 
      });
    } else {
      // Создание
      // Проверка на уникальность slug
      const existing = await prisma.tour.findUnique({ where: { slug: data.slug } });
      if (existing) {
        // Если slug занят, добавляем рандом
        prismaPayload.slug = `${data.slug}-${Math.floor(Math.random() * 1000)}`;
      }
      
      await prisma.tour.create({
        // 👇 ДОБАВЛЕНО "as any"
        data: prismaPayload as any, 
      });
    }

    // 6. СБРОС КЭША
    revalidatePath('/admin');
    revalidatePath('/tours');
    revalidatePath('/'); // Обновляем главную
    
    return { success: true };

  } catch (error: any) {
    console.error("❌ Database Error:", error);
    return { success: false, error: error.message || "Ошибка сохранения в базу" };
  }
}

// === 3. ПОЛУЧЕНИЕ СПИСКА АКТИВНЫХ ГИДОВ (Для формы) ===
export async function getActiveGuides() {
  try {
    const guides = await prisma.guide.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    return guides;
  } catch (error) {
    console.error("Error fetching guides:", error);
    return [];
  }
}

// === 4. УДАЛЕНИЕ ТУРА ===
export async function deleteTour(id: string) {
  try {
    await prisma.tour.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/tours');
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Ошибка удаления" };
  }
}

// === 5. ОБНОВЛЕНИЕ СТАТУСА (Быстрый тоггл) ===
export async function updateTourStatus(id: string, isActive: boolean) {
  try {
    await prisma.tour.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath('/admin');
    revalidatePath('/tours');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ошибка обновления статуса" };
  }
}