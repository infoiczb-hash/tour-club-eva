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
  type: 'tour' | 'blog' | 'calendar'; // Добавлен calendar
  image: string | null;
  gallery?: string[];
  categoryColor: string;
  categoryTitle?: string;
  price?: number;
  currency?: string;
  location?: string;
  duration?: string;
  tags?: string[];
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
          currency: true,
          location: true,
          duration: true,
          tags: true,
          tourDates: {
            where: { startDate: { gte: new Date() }, isActive: true },
            orderBy: { startDate: 'asc' },
            take: 1,
            select: { startDate: true }
          },
          category: { select: { color: true, title: true } }
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

    // Маппинг туров с безопасным парсингом тегов
    const tourSources: SmmSource[] = tours.map(t => {
      const firstDate = t.tourDates?.[0]?.startDate || null;
      
      let parsedTags: string[] = [];
      if (Array.isArray(t.tags)) {
        parsedTags = t.tags as string[];
      } else if (typeof t.tags === 'string') {
        try { 
          parsedTags = JSON.parse(t.tags); 
        } catch (e) { 
          parsedTags = []; 
        }
      }

      return {
        id: t.id,
        title: t.title,
        type: 'tour',
        image: t.coverImage,
        price: t.price ? Number(t.price) : undefined,
        gallery: t.coverImage ? [t.coverImage] : [],
        currency: t.currency || 'MDL',
        location: t.location || '',
        duration: t.duration || '',
        tags: parsedTags,
        date: firstDate,
        categoryColor: t.category?.color || 'teal',
        categoryTitle: t.category?.title || 'ТУР',
      };
    });

    const blogSources: SmmSource[] = posts.map(p => ({
      id: p.id,
      title: p.title,
      type: 'blog',
      image: p.image,
      categoryColor: 'violet',
      categoryTitle: 'БЛОГ'
    }));

    // Добавляем виртуальный источник для АФИШИ
    const calendarSource: SmmSource = {
      id: 'monthly_calendar',
      title: '📅 АФИША НА МЕСЯЦ',
      type: 'calendar',
      image: tours[0]?.coverImage || null, // Берем обложку любого тура для фона
      categoryColor: 'amber',
      categoryTitle: 'АФИША'
    };

    return { success: true, data: [calendarSource, ...tourSources, ...blogSources] };
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
  metadata?: Record<string, unknown>; // Строгая типизация
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
  steps, 
}: {
  sourceType: 'tour' | 'blog' | 'calendar';
  sourceId: string;
  platform: 'instagram' | 'telegram' | 'facebook' | 'threads';
  tone: 'fun' | 'epic' | 'info' | 'sell' | 'strict';
  goal?: 'warmup' | 'sell';
  audience?: 'cold' | 'warm';
  steps?: string[]; 
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
          difficulty: true, // ✅ ДОБАВЛЕНО
          included: true, // ✅ ДОБАВЛЕНО
          additionalExpenses: true, // ✅ ДОБАВЛЕНО
          program: true, // ✅ ДОБАВЛЕНО
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
      
      // ✅ ДОБАВЛЕНО: Сверхточный контекст. ИИ теперь работает как форматер данных из БД.
      contextData = `
        ТИП КОНТЕНТА: Анонс туристического маршрута
        НАЗВАНИЕ: ${tour.title}
        ЛОКАЦИЯ: ${tour.location}
        ДЛИТЕЛЬНОСТЬ: ${tour.duration}
        СЛОЖНОСТЬ: ${tour.difficulty || 'Не указана'}
        ДАТА БЛИЖАЙШЕГО: ${tourDateStr}
        ЦЕНА: ${tour.price} ${tour.currency}
        ВКЛЮЧЕНО В СТОИМОСТЬ: ${Array.isArray(tour.included) ? tour.included.join(', ') : 'Не указано'}
        ДОП. РАСХОДЫ: ${Array.isArray(tour.additionalExpenses) ? tour.additionalExpenses.join(', ') : 'Нет'}
        ПРОГРАММА ПО ДНЯМ: ${JSON.stringify(tour.program)}
        МАРКЕТИНГОВОЕ ОПИСАНИЕ: ${tour.subtitle || ''}. ${tour.description?.substring(0, 500) || ''}...
        ССЫЛКА НА БРОНЬ: ${siteUrl}/tour/${sourceId}
      `;
    } else if (sourceType === 'calendar') {
      // Подтягиваем 10 ближайших активных туров для генерации афиши
      const upcomingTours = await prisma.tourDate.findMany({
        where: { 
          startDate: { gte: new Date() }, 
          isActive: true, 
          tour: { isActive: true } 
        },
        orderBy: { startDate: 'asc' },
        take: 10,
        include: { tour: { select: { title: true, price: true, currency: true } } }
      });
      
      const scheduleString = upcomingTours.map(t => 
        `- ${t.startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}: ${t.tour.title} (${t.tour.price} ${t.tour.currency})`
      ).join('\n');

      contextData = `ТИП: Афиша туров на ближайший месяц.\nРАСПИСАНИЕ МЕРОПРИЯТИЙ:\n${scheduleString}`;

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
      tone,
      steps 
    })) as { 
      success: boolean; 
      data?: { 
        caption: string; 
        slides: { title: string; text: string }[]; 
        hashtags: string[] 
      }; 
      error?: string 
    };

    if (!result.success) {
      throw new Error(result.error || 'Неизвестная ошибка ИИ');
    }

    return { success: true, data: result.data };
 } catch (error) {
    console.error('SMM Controller Error:', error);
    let friendlyError = 'Не удалось сгенерировать контент. Попробуйте позже.';
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes('quota') || msg.includes('429') || msg.includes('exceeded')) {
        friendlyError = 'Превышен лимит запросов к AI. Пожалуйста, подождите минуту и попробуйте снова.';
      } else if (msg.includes('fetch') || msg.includes('network')) {
        friendlyError = 'Проблема с сетью. Проверьте подключение к интернету.';
      } else if (msg.includes('timeout')) {
        friendlyError = 'Превышено время ожидания ответа от AI. Попробуйте ещё раз.';
      }
    }
    return { success: false, error: friendlyError };
  }
});

// Строгий тип для экшена заморозки
export type FreezeAndPublishPayload = {
  imageUrls: string[];
  content: string;
  platform: string;
  isPublic?: boolean;
};

export const freezeAndPublishSmmAction = withAdminAuth(
  withAdminAudit({
    actionName: 'FREEZE_AND_PUBLISH_SMM',
    getTargetId: (payload: FreezeAndPublishPayload) => 'telegram_post',
  })(async (payload: FreezeAndPublishPayload) => {
    // Распаковываем payload
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
        const filePath = `smm/${fileName}`;

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

      // 2. ОТПРАВКА В TELEGRAM
      // Убрано ограничение `if (platform === 'telegram')`, теперь публикует всегда
      const { publishMediaGroupToTelegram } = await import('@/features/admin/actions/telegram');
      const tgRes = await publishMediaGroupToTelegram(content, permanentUrls, isPublic);

      if (!tgRes.success) {
        throw new Error(tgRes.error);
      }
    return { success: true, permanentUrls };
  } catch (error) {
    console.error('Freeze & Publish Error:', error);
    let friendlyError = 'Не удалось опубликовать пост. Попробуйте позже.';
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes('quota') || msg.includes('429') || msg.includes('exceeded')) {
        friendlyError = 'Превышен лимит запросов к AI. Пожалуйста, подождите минуту.';
      } else if (msg.includes('fetch') || msg.includes('network')) {
        friendlyError = 'Проблема с сетью. Проверьте подключение.';
      } else if (msg.includes('timeout')) {
        friendlyError = 'Превышено время ожидания. Попробуйте ещё раз.';
      } else if (msg.includes('storage') || msg.includes('supabase')) {
        friendlyError = 'Ошибка сохранения изображений. Попробуйте позже.';
      }
    }
    return { success: false, error: friendlyError };
  }
  })
);
export const deleteScheduledPostAction = withAdminAuth(async (id: string) => {
  try {
    await prisma.scheduledPost.delete({ where: { id } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ошибка при удалении поста' };
  }
}); 