// src/features/admin/actions/smm.ts
'use server';

import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';
import { env } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { performAiTask, type PerformAiTaskResult } from './ai';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

// ============================================================================
// 0. СТРУКТУРИРОВАННОЕ ЛОГИРОВАНИЕ
// ============================================================================
function logSmmError(source: string, error: unknown) {
  console.error(JSON.stringify({
    level: 'error',
    source,
    error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    ts: new Date().toISOString(),
  }));
}

// ============================================================================
// 1. ТИПЫ ДАННЫХ
// ============================================================================
export type SmmSource = {
  id: string;
  title: string;
  type: 'tour' | 'blog' | 'calendar';
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
  program?: any;        // Для мгновенной автосборки слайдов
  included?: string[];  // Для мгновенной автосборки слайдов
};

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
  metadata?: Record<string, unknown>;
};

export type FreezeAndPublishPayload = {
  imageUrls: string[];
  content: string;
  platform: string;
  isPublic?: boolean;
};

// ============================================================================
// 2. ПОЛУЧЕНИЕ ИСХОДНИКОВ ДЛЯ SMM-ПУЛЬТА (С ПРОГРАММОЙ И INCLUDED)
// ============================================================================
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
          program: true,
          included: true,
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

    const tourSources: SmmSource[] = tours.map(t => {
      const firstDate = t.tourDates?.[0]?.startDate || null;
      
      let parsedTags: string[] = [];
      if (Array.isArray(t.tags)) {
        parsedTags = t.tags as string[];
      } else if (typeof t.tags === 'string') {
        try { parsedTags = JSON.parse(t.tags); } catch (e) { parsedTags = []; }
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
        program: t.program,
        included: t.included,
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

    const calendarSource: SmmSource = {
      id: 'monthly_calendar',
      title: '📅 АФИША НА МЕСЯЦ',
      type: 'calendar',
      image: tours[0]?.coverImage || null,
      categoryColor: 'amber',
      categoryTitle: 'АФИША'
    };

    return { success: true, data: [calendarSource, ...tourSources, ...blogSources] };
  } catch (error) {
    logSmmError('getSmmSourcesAction', error);
    return { success: false, error: 'Ошибка при загрузке источников' };
  }
});

// ============================================================================
// 3. ПОЛУЧЕНИЕ СОБЫТИЙ ДЛЯ ГЕНЕРАТОРА АФИШИ
// ============================================================================
export const getSmmCalendarEventsAction = withAdminAuth(async (daysAmount: number = 30) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = new Date(now.getTime() + daysAmount * 24 * 60 * 60 * 1000);

    const dates = await prisma.tourDate.findMany({
      where: {
        startDate: { gte: now, lte: endDate },
        isActive: true,
        tour: { isActive: true, deletedAt: null }
      },
      include: {
        tour: {
          select: { 
            title: true, 
            duration: true, 
            location: true, 
            price: true, 
            currency: true, 
            category: { select: { color: true, title: true } } 
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    // Форматируем строго под интерфейс CalendarEvent из route.tsx
    const events = dates.map(d => ({
      date: d.startDate.toISOString().split('T')[0],
      category: d.tour.category?.title || 'ТУР',
      color: d.tour.category?.color || 'teal',
      duration: d.tour.duration || undefined,
      title: d.tour.title,
      location: d.tour.location || undefined,
      price: d.basePrice ?? d.tour.price ?? null,
      currency: d.tour.currency || 'MDL'
    }));

    return { success: true, data: events };
  } catch (error) {
    logSmmError('getSmmCalendarEventsAction', error);
    return { success: false, error: 'Ошибка загрузки расписания' };
  }
});

// ============================================================================
// 4. СОХРАНЕНИЕ / ОБНОВЛЕНИЕ ЧЕРНОВИКА
// ============================================================================
export const saveScheduledPostAction = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_SCHEDULED_POST',
    getTargetId: (payload: SaveScheduledPostPayload) => payload.id || 'new_scheduled_post',
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
      logSmmError('saveScheduledPostAction', error);
      return { success: false, error: 'Не удалось сохранить пост' };
    }
  })
);

// ============================================================================
// 5. ПОЛУЧЕНИЕ СПИСКА ЗАПЛАНИРОВАННЫХ ПОСТОВ
// ============================================================================
export const getScheduledPostsAction = withAdminAuth(async () => {
  try {
    const posts = await prisma.scheduledPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { success: true, data: posts };
  } catch (error) {
    logSmmError('getScheduledPostsAction', error);
    return { success: false, error: 'Ошибка загрузки постов', data: [] };
  }
});

// ============================================================================
// 6. УДАЛЕНИЕ ЗАПЛАНИРОВАННОГО ПОСТА
// ============================================================================
export const deleteScheduledPostAction = withAdminAuth(async (id: string) => {
  try {
    await prisma.scheduledPost.delete({ where: { id } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logSmmError('deleteScheduledPostAction', error);
    return { success: false, error: 'Ошибка при удалении поста' };
  }
}); 

// ============================================================================
// 7. ГЕНЕРАЦИЯ SMM-КОНТЕНТА (AI ИЛИ АВТОСБОРКА)
// ============================================================================
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

    // Формируем детальный контекст для ИИ
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
          difficulty: true,
          included: true,
          additionalExpenses: true,
          program: true,
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
    
const result = (await performAiTask({
      mode: 'smm_post',
      context: `ЦЕЛЬ ПОСТА: ${goal === 'sell' ? 'Продать места' : 'Прогреть аудиторию'}\nАУДИТОРИЯ: ${audience === 'warm' ? 'Теплая (знают нас)' : 'Холодная'}\n\n${contextData}`,
      platform,
      tone,
      steps 
    })) as PerformAiTaskResult;

    // Строгая проверка типов через дискриминатор
    if (!result.success || result.mode !== 'smm_post') {
      throw new Error(result.success === false ? result.error : 'Неверный режим ответа AI');
    }

    return { success: true, data: result.data };
  } catch (error) {
    logSmmError('generateSmmContentAction', error);
    
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

// ============================================================================
// 8. ЗАМОРОЗКА И ПУБЛИКАЦИЯ В TELEGRAM
// ============================================================================
export const freezeAndPublishSmmAction = withAdminAuth(
  withAdminAudit({
    actionName: 'FREEZE_AND_PUBLISH_SMM',
    // Генерируем уникальный ID для логов на основе контента, так как поста в БД нет
    getTargetId: (payload: FreezeAndPublishPayload) => 
      crypto.createHash('md5').update(payload.content).digest('hex'),
  })(async (payload: FreezeAndPublishPayload) => {
    const { imageUrls, content, platform, isPublic = false } = payload;
    
    try {
      const supabase = await createServerSupabaseClient();
      const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';
      const permanentUrls: string[] = [];

      // 1. ЗАМОРОЗКА: Скачиваем динамические OG картинки и кладем в Storage
      for (const relUrl of imageUrls) {
        const absoluteUrl = relUrl.startsWith('http') ? relUrl : `${siteUrl}${relUrl}`;

        const res = await fetch(absoluteUrl);
        if (!res.ok) throw new Error(`Ошибка генерации картинки: ${res.statusText}`);

        const arrayBuffer = await res.arrayBuffer();
        
        // Используем криптографически безопасный UUID
        const fileName = `smm-${crypto.randomUUID()}.png`;
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

      // 2. ОТПРАВКА В TELEGRAM (Независимо от платформы)
      const { publishMediaGroupToTelegram } = await import('@/features/admin/actions/telegram');
      const tgRes = await publishMediaGroupToTelegram(content, permanentUrls, isPublic);

      if (!tgRes.success) {
        throw new Error(tgRes.error);
      }

      return { success: true, permanentUrls };
    } catch (error) {
      logSmmError('freezeAndPublishSmmAction', error);
      
      let friendlyError = 'Не удалось опубликовать пост. Попробуйте позже.';
      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes('fetch') || msg.includes('network')) {
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