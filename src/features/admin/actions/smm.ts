// src/features/admin/actions/smm.ts
'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';
import { env } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { performAiTask } from './ai';
import { Prisma } from '@prisma/client';

// --- ТИПЫ ---
export type SmmSource = {
  id: string;
  title: string;
  type: 'tour' | 'blog';
  image: string | null;
  categoryColor: string;
  price?: number;
  date?: Date | string | null;
};

// --- 1. ПОЛУЧЕНИЕ ИСХОДНИКОВ ДЛЯ SMM-ПУЛЬТА ---
export const getSmmSourcesAction = withAdminAuth(async (): Promise<{ success: boolean; data?: SmmSource[]; error?: string }> => {
  try {
    const [tours, posts] = await Promise.all([
      prisma.tour.findMany({
        where: { isActive: true, deletedAt: null },
        select: { 
          id: true, 
          title: true, 
          coverImage: true, 
          price: true,
          // ✅ ИСПРАВЛЕНИЕ: Берем ближайшую будущую дату через новую связь
          tourDates: {
            where: { startDate: { gte: new Date() }, isActive: true },
            orderBy: { startDate: 'asc' },
            take: 1,
            select: { startDate: true }
          },
          category: { select: { color: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.blog.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          title: true, 
          image: true,
          blogCategory: { select: { slug: true } }
        },
        orderBy: { date: 'desc' },
        take: 50,
      }),
    ]);

    const tourSources: SmmSource[] = tours.map(t => {
      // Извлекаем дату из связи
      const firstDate = t.tourDates?.[0]?.startDate || null;
      return {
        id: t.id,
        title: t.title,
        type: 'tour',
        image: t.coverImage,
        price: t.price,
        date: firstDate,
        categoryColor: t.category?.color || 'teal',
      };
    });

    const blogSources: SmmSource[] = posts.map(p => ({
      id: p.id,
      title: p.title,
      type: 'blog',
      image: p.image,
      categoryColor: 'violet',
    }));

    return { success: true, data: [...tourSources, ...blogSources] };
  } catch (error) {
    console.error('getSmmSourcesAction Error:', error);
    return { success: false, error: 'Ошибка при загрузке источников' };
  }
});

// --- 2. СОХРАНЕНИЕ / ОБНОВЛЕНИЕ ЧЕРНОВИКА (С АУДИТОМ) ---
export type SaveScheduledPostPayload = {
  id?: string;
  platform: string;
  format: string;
  content: string;
  imageUrl?: string | null;
  status: string;
  scheduledFor?: string | Date | null;
  sourceType: string;
  sourceId?: string | null;
  sourceUrl?: string | null;
  templateStyle?: string | null;
  metadata?: Record<string, unknown>; // ✅ ИСПРАВЛЕНИЕ: Строгая типизация
};

export const saveScheduledPostAction = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_SCHEDULED_POST',
    getTargetId: (payload: SaveScheduledPostPayload) => payload.id,
  })(async (payload: SaveScheduledPostPayload) => {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      const dataToSave = {
        platform: payload.platform,
        format: payload.format,
        content: payload.content,
        imageUrl: payload.imageUrl || null,
        status: payload.status || 'draft',
        scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : null,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId || null,
        sourceUrl: payload.sourceUrl || null,
        templateStyle: payload.templateStyle || null,
        metadata: payload.metadata ? (payload.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        adminId: user?.id,
        errorMessage: null,
      };

      let post;
      if (payload.id) {
        post = await prisma.scheduledPost.update({
          where: { id: payload.id },
          data: dataToSave,
        });
      } else {
        post = await prisma.scheduledPost.create({ data: dataToSave });
      }

      revalidatePath('/admin');
      return { success: true, data: post };
    } catch (error) {
      console.error('Save Scheduled Post Error:', error);
      return { success: false, error: 'Не удалось сохранить пост' };
    }
  })
);

// --- 3. ПОЛУЧЕНИЕ СПИСКА ЗАПЛАНИРОВАННЫХ ПОСТОВ ---
export const getScheduledPostsAction = withAdminAuth(async () => {
  try {
    const posts = await prisma.scheduledPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { success: true, data: posts };
  } catch (error) {
    return { success: false, error: 'Ошибка загрузки постов', data: [] };
  }
});

// --- 4. ГЕНЕРАЦИЯ SMM-КОНТЕНТА (ЧИСТЫЙ КОНТРОЛЛЕР) ---
export const generateSmmContentAction = withAdminAuth(async ({
  sourceType,
  sourceId,
  platform,
  tone,
  goal,      
  audience,   
}: {
  sourceType: 'tour' | 'blog';
  sourceId: string;
  platform: 'instagram' | 'telegram' | 'facebook' | 'threads';
  tone: 'fun' | 'epic' | 'info' | 'sell' | 'strict';
  goal?: 'warmup' | 'sell';   // 🔥 ДОБАВЛЕНО
  audience?: 'cold' | 'warm'; // 🔥 ДОБАВЛЕНО
}) => {
  try {
    let contextData = '';
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

    // 1. Формируем контекстную строку для ИИ
    if (sourceType === 'tour') {
      const tour = await prisma.tour.findUnique({
        where: { id: sourceId },
        select: { 
          title: true, 
          subtitle: true, 
          description: true, 
          price: true, 
          currency: true, 
          duration: true, 
          location: true,
          // ✅ ИСПРАВЛЕНИЕ: Берем ближайшую дату тура вместо поля date
          tourDates: {
            where: { startDate: { gte: new Date() }, isActive: true },
            orderBy: { startDate: 'asc' },
            take: 1,
            select: { startDate: true }
          }
        }
      });
      if (!tour) throw new Error('Тур не найден');
      
      const firstDate = tour.tourDates?.[0]?.startDate || null;
      const tourDateStr = firstDate ? new Date(firstDate).toLocaleDateString('ru-RU') : 'Открытая дата';
      
      contextData = `ТИП: Анонс тура\nНАЗВАНИЕ: ${tour.title}\nЛОКАЦИЯ: ${tour.location}\nДЛИТЕЛЬНОСТЬ: ${tour.duration}\nДАТА: ${tourDateStr}\nЦЕНА: ${tour.price} ${tour.currency}\nОПИСАНИЕ: ${tour.subtitle || ''}. ${tour.description?.substring(0, 500) || ''}...\nССЫЛКА: ${siteUrl}/tour/${sourceId}`;
    } else {
      const post = await prisma.blog.findUnique({
        where: { id: sourceId },
        select: { title: true, excerpt: true, content: true }
      });
      if (!post) throw new Error('Статья не найдена');
      
      contextData = `ТИП: Анонс статьи блога\nНАЗВАНИЕ: ${post.title}\nОПИСАНИЕ: ${post.excerpt || post.content.substring(0, 500)}...\nССЫЛКА: ${siteUrl}/blog/${sourceId}`;
    }

    // 2. Вызываем наш центральный AI модуль и явно указываем тип возвращаемых данных
   const result = (await performAiTask({
      mode: 'smm_post',
      context: `ЦЕЛЬ ПОСТА: ${goal === 'sell' ? 'Продать места' : 'Прогреть аудиторию'}\nАУДИТОРИЯ: ${audience === 'warm' ? 'Теплая (знают нас)' : 'Холодная'}\n\n${contextData}`,
      platform,
      tone
    })) as { success: boolean; data?: { text: string; hashtags: string[] }; error?: string };

    if (!result.success) {
      throw new Error(result.error || 'Неизвестная ошибка ИИ');
    }

    // Теперь TS знает, что data имеет нужную структуру
    return { success: true, data: result.data };
  } catch (error) {
    console.error('SMM Controller Error:', error);
    return { success: false, error: 'Ошибка генерации контента' };
  }
});
// Строгий тип для нашего экшена
export type FreezeAndPublishPayload = {
  imageUrls: string[];
  content: string;
  platform: string;
  isPublic?: boolean;
};

export const freezeAndPublishSmmAction = withAdminAuth(
  withAdminAudit({
    actionName: 'FREEZE_AND_PUBLISH_SMM',
    // ✅ ИСПРАВЛЕНО: Явно передаем payload, чтобы TS понял, какие аргументы ждет функция
    getTargetId: (payload: FreezeAndPublishPayload) => 'telegram_post',
  })(async (payload: FreezeAndPublishPayload) => {
    // Распаковываем payload внутри функции
    const { imageUrls, content, platform, isPublic = false } = payload;
    
    try {
      const supabase = await createServerSupabaseClient();
      const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';
      const permanentUrls: string[] = [];

      // 1. ЗАМОРОЗКА: Скачиваем динамические OG картинки и кладем в Storage
      for (const relUrl of imageUrls) {
        // Превращаем относительный путь /api/og... в абсолютный
        const absoluteUrl = relUrl.startsWith('http') ? relUrl : `${siteUrl}${relUrl}`;

        const res = await fetch(absoluteUrl);
        if (!res.ok) throw new Error(`Ошибка генерации картинки: ${res.statusText}`);

        const arrayBuffer = await res.arrayBuffer();
        
        // Генерируем уникальное имя файла
        const fileName = `smm-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const filePath = `smm/${fileName}`; // Кладем в папку smm внутри бакета

        const { error } = await supabase.storage
          .from('tours-images')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (error) throw new Error(`Ошибка загрузки в Supabase: ${error.message}`);

        const { data } = supabase.storage.from('tours-images').getPublicUrl(filePath);
        permanentUrls.push(data.publicUrl);
      }

      // 2. ОТПРАВКА В TELEGRAM (С КАРУСЕЛЯМИ)
      if (platform === 'telegram') {
        const { publishMediaGroupToTelegram } = await import('@/features/admin/actions/telegram');
        // Отправляем массив вечных ссылок
        const tgRes = await publishMediaGroupToTelegram(content, permanentUrls, isPublic);

        if (!tgRes.success) {
          throw new Error(tgRes.error);
        }
      }

      return { success: true, permanentUrls };
    } catch (error) {
      console.error('Freeze & Publish Error:', error);
      return { success: false, error: (error as Error).message };
    }
  })
);