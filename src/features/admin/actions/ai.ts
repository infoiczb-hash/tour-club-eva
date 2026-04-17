// src/features/admin/actions/ai.ts
'use server';

import { generateObject, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';
import { adminRateLimit, getClientIp } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

// ============================================================================
// 1. КОНФИГУРАЦИЯ ИИ
// ============================================================================
const model = google('gemini-2.5-flash');

// ============================================================================
// 2. СТРУКТУРИРОВАННОЕ ЛОГИРОВАНИЕ (АУДИТ)
// ============================================================================
// Структурированный JSON-лог — удобно парсить в Sentry, Datadog, Loki и т.д.
function logAiError(mode: string, error: unknown, meta?: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: 'error',
    source: 'performAiTask',
    mode,
    error: error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : String(error),
    ...meta,
    ts: new Date().toISOString(),
  }));
}

function logAiInfo(mode: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({
    level: 'info',
    source: 'performAiTask',
    mode,
    ...meta,
    ts: new Date().toISOString(),
  }));
}

// ============================================================================
// 3. ОБЩИЙ КОНТЕКСТ БРЕНДА (DRY ПРОМПТЫ)
// ============================================================================
const EVA_BRAND_CONTEXT = `
Ты — AI-ассистент туристического клуба «ЭВА» (г. Тирасполь, Приднестровье).

О клубе:
- Организуем активный отдых: пешие походы, SUP, каяк, туры для детей, локальные экскурсии.
- Аудитория: взрослые 25–45 лет и семьи с детьми из Приднестровья и Молдовы.
- Тон бренда: живой, вдохновляющий, дружелюбный — как советы от опытного друга-инструктора.
- Валюта по умолчанию: MDL (молдавские леи), реже RUB (рубли ПМР) или EUR.
- Язык: русский, без канцеляризмов, штампов и «водянистых» оборотов.

Правила для всех текстов:
- Пиши по-русски, грамотно, живо.
- Избегай клише: «незабываемый», «уникальный», «погрузитесь в атмосферу», «насладитесь».
- Конкретика важнее общих слов: лучше «8 км по берегу Днестра», чем «интересный маршрут».
- Никогда не выдумывай факты (цены, даты, расстояния, имена) — только то, что передано в контексте.
`.trim();

// ============================================================================
// 4. СХЕМЫ ДАННЫХ (ZOD INJECTIONS)
// ============================================================================

const TourAiSchema = z.object({
  title: z.string().describe('Маркетинговое название тура — конкретное, без клише'),
  subtitle: z.string().describe('Краткий слоган — 1 предложение, цепляющее'),
  type: z.enum(['hiking', 'kayaking', 'sup', 'kids', 'local']),
  description: z.string().describe('Продающее описание тура в Markdown (2–3 абзаца). Конкретика, атмосфера, без воды.'),
  location: z.string(),
  meeting_point: z.string().optional().describe('Точка сбора — если не указана в запросе, не выдумывай'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration: z.string(),
  distance: z.string().optional().describe('Дистанция — только если известна из запроса'),
  price_adult: z.number().describe('Цена в MDL — только если указана в запросе, иначе 0'),
  currency: z.enum(['RUB', 'MDL', 'EUR']).default('MDL'),
  dates: z.array(z.string()).optional().describe('Даты — только из запроса, не придумывать'),
  program: z.array(z.object({
    day: z.number(),
    title: z.string(),
    activities: z.array(z.object({
      time: z.string().optional(),
      title: z.string(),
      icon: z.string()
    }))
  })).describe('Программа по дням. Если данных нет — сгенерируй логичную структуру и пометь как примерную.'),
  included: z.array(z.string()).describe('Что включено в стоимость — реальный список, без фантазий'),
  additionalExpenses: z.array(z.string()),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).optional().describe('3–5 частых вопросов, актуальных для этого типа тура'),
  meta_title: z.string().describe('SEO-заголовок до 60 символов'),
  meta_desc: z.string().describe('SEO-описание 120–160 символов, с ключевыми словами'),
});

const ChecklistSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    items: z.array(z.string())
  })).describe('5–8 категорий снаряжения, 5–10 пунктов в каждой. Без дублей между категориями.')
});

const BlogAiSchema = z.object({
  title: z.string().describe('Заголовок статьи — конкретный, с пользой для читателя'),
  excerpt: z.string().describe('Анонс — 2–3 предложения, зацепи читателя'),
  content: z.string().describe('Тело статьи в Markdown. Структура: введение → основная часть (с подзаголовками) → заключение с призывом. Длина: 600–900 слов.'),
  category: z.string().describe('Категория: Снаряжение / Маршруты / Советы / Новости / Дети'),
  read_time: z.string().describe('Примерное время чтения, напр. «5 мин»')
});

const SmmPostSchema = z.object({
  caption: z.string().describe('Основной текст поста. Логические абзацы разделяй двойным переносом \\n\\n. Без хештегов. Только суть и польза.'),
  slides: z.array(z.object({
    title: z.string().describe('Короткий заголовок слайда (до 5 слов). Используй триггеры из переданного запроса.'),
    text: z.string().describe(
      'Текст слайда. Строгие правила по типу:\n' +
      '- ВПЕЧАТЛЕНИЯ / ВКЛЮЧЕНО: пункты через дефис «-», только факты из контекста.\n' +
      '- ДЕТАЛИ: формат «Локация: ... | Длительность: ... | Сложность: ...».\n' +
      '- ПРОГРАММА: формат «ЧЧ:ММ — Событие | ЧЧ:ММ — Событие», только реальное расписание.\n' +
      '- АФИША: формат «ДД МЕС : Название : Цена», только реальные даты из контекста.\n' +
      '- ПРИЗЫВ (CTA): ТОЛЬКО маркетинговый призыв к бронированию. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ списки снаряжения и советы.'
    )
  })).describe('Слайды карусели. Количество карточек должно СТРОГО совпадать с запрошенной структурой.'),
  hashtags: z.array(z.string()).describe('Хештеги без символа #, 5–10 релевантных штук')
});

// ============================================================================
// 5. ТИПЫ С ДИСКРИМИНАТОРОМ (TYPESCRIPT 2026)
// ============================================================================
export type AiTaskType =
  | { mode: 'generate_tour'; prompt: string }
  | { mode: 'generate_blog'; topic: string }
  | { mode: 'generate_image'; prompt: string }
  | { mode: 'parse_tour_text'; text: string }
  | { mode: 'generate_checklist'; location: string; season: string; type: string }
  | { mode: 'improve_text'; text: string; tone?: 'selling' | 'fix' | 'casual' }
  | { mode: 'smm_post'; context: string; platform: 'instagram' | 'telegram' | 'facebook' | 'threads'; tone?: 'fun' | 'epic' | 'strict' | 'info' | 'sell'; steps?: string[] }
  | { mode: 'chat'; messages: { role: 'user' | 'assistant'; content: string }[] };

export type TourAiData = z.infer<typeof TourAiSchema>;
export type BlogAiData = z.infer<typeof BlogAiSchema>;
export type ChecklistData = z.infer<typeof ChecklistSchema>;
export type SmmPostData = z.infer<typeof SmmPostSchema>;

export type PerformAiTaskResult =
  | { success: true; mode: 'generate_tour';      data: TourAiData }
  | { success: true; mode: 'parse_tour_text';    data: TourAiData }
  | { success: true; mode: 'generate_blog';      data: BlogAiData }
  | { success: true; mode: 'generate_checklist'; data: ChecklistData }
  | { success: true; mode: 'smm_post';           data: SmmPostData }
  | { success: true; mode: 'generate_image';     data: string }
  | { success: true; mode: 'improve_text';       data: string }
  | { success: true; mode: 'chat';               data: string }
  | { success: false; error: string };

// ============================================================================
// 6. RAG: КОНТЕКСТ ИЗ БД ДЛЯ ВНУТРЕННЕГО ЧАТА (ИСПРАВЛЕНЫ PRISMA СВЯЗИ)
// ============================================================================
interface UpcomingTour {
  title: string;
  type: string;
  date: string;
  price: number;
  currency: string;
  location: string;
  difficulty: string;
}

interface RecentPost {
  title: string;
  category: string;
  publishedAt: string;
}

interface ChatDbContext {
  upcomingTours: UpcomingTour[];
  recentBlogPosts: RecentPost[];
}

async function loadChatContext(): Promise<ChatDbContext> {
  try {
    const now = new Date();
    const in60days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // ✅ ИСПРАВЛЕНИЕ БАЗЫ: Адаптировано под твою реальную схему prisma
    const [tours, posts] = await Promise.all([
      prisma.tour.findMany({
        where: {
          isActive: true, // исправлено с isPublished
          tourDates: { some: { startDate: { gte: now, lte: in60days }, isActive: true } } // исправлено с dates.date
        },
        select: {
          title: true,
          price: true, // исправлено с price_adult
          currency: true,
          location: true,
          difficulty: true,
          tourDates: { // исправлено с dates
            where: { startDate: { gte: now, lte: in60days }, isActive: true },
            select: { startDate: true },
            orderBy: { startDate: 'asc' },
            take: 3,
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      prisma.blog.findMany({ // исправлено с blogPost
        where: { isActive: true }, // исправлено с isPublished
        select: { title: true, blogCategory: { select: { slug: true } }, date: true }, // исправлено
        orderBy: { date: 'desc' }, // исправлено
        take: 5,
      }),
    ]);

    const upcomingTours: UpcomingTour[] = tours.flatMap((tour) =>
      tour.tourDates.map((d) => ({
        title: tour.title,
        type: 'tour',
        date: d.startDate ? d.startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Скоро',
        price: tour.price ? Number(tour.price) : 0,
        currency: tour.currency || 'RUB',
        location: tour.location || 'Уточняется',
        difficulty: tour.difficulty || 'Не указана',
      }))
    );

    const recentBlogPosts: RecentPost[] = posts.map((p) => ({
      title: p.title,
      category: p.blogCategory?.slug || 'blog',
      publishedAt: p.date ? p.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Недавно',
    }));

    return { upcomingTours, recentBlogPosts };
  } catch (err) {
    logAiError('chat:loadContext', err);
    return { upcomingTours: [], recentBlogPosts: [] };
  }
}

function formatContextForPrompt(ctx: ChatDbContext): string {
  if (ctx.upcomingTours.length === 0 && ctx.recentBlogPosts.length === 0) {
    return 'База данных временно пуста. Отвечай на общие вопросы, не придумывай даты и цены.';
  }

  const toursBlock = ctx.upcomingTours.length > 0
    ? 'БЛИЖАЙШИЕ ТУРЫ (следующие 60 дней):\n' +
      ctx.upcomingTours.map((t) =>
        `• ${t.title} | ${t.date} | ${t.price} ${t.currency} | Локация: ${t.location} | Сложность: ${t.difficulty}`
      ).join('\n')
    : 'Ближайших туров в расписании нет.';

  const blogBlock = ctx.recentBlogPosts.length > 0
    ? '\n\nПОСЛЕДНИЕ СТАТЬИ БЛОГА:\n' +
      ctx.recentBlogPosts.map((p) => `• «${p.title}» (Категория: ${p.category}, ${p.publishedAt})`).join('\n')
    : '';

  return toursBlock + blogBlock;
}

// ============================================================================
// 7. ГЛАВНЫЙ ЭКШЕН И МАРШРУТИЗАТОР (CONTROLLER)
// ============================================================================
export const performAiTask = withAdminAuth(
  withAdminAudit({
    actionName: 'PERFORM_AI_TASK',
    getTargetId: (task: AiTaskType) => task.mode,
  })(async (task: AiTaskType): Promise<PerformAiTaskResult> => {

    // Rate limit
    try {
      const ip = await getClientIp();
      const { success: rateLimitSuccess } = await adminRateLimit.limit(ip);
      if (!rateLimitSuccess) {
        return { success: false, error: 'Превышен лимит запросов к AI (15 в минуту). Пожалуйста, подождите.' };
      }
    } catch (error) {
      logAiError('rate-limit', error);
    }

    logAiInfo(task.mode);

    try {

      // ─────────────────────────────────────────────
      // GENERATE IMAGE (Fal.ai + Groq)
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_image') {
        const groqKey = process.env.GROQ_API_KEY;
        const falKey = process.env.FAL_KEY;

        if (!groqKey || !falKey) {
          return { success: false, error: 'Нет ключей GROQ_API_KEY или FAL_KEY (.env)' };
        }

        try {
          const groq = createGroq({ apiKey: groqKey });

          // Расширяем промпт через быструю Llama 3
          const { text: enhancedPrompt } = await generateText({
            model: groq('llama3-70b-8192'),
            system: `You are an expert Flux image generation prompt engineer.
The user will give you a simple idea in Russian or English.

SAFETY CHECK: If the idea contains harmful, violent, adult, or illegal content — respond with exactly the word: BLOCKED

Otherwise:
- Translate the idea to English
- Expand it into a detailed, cinematic, hyperrealistic photography prompt for Flux
- Include: lighting, composition, mood, camera angle, style
- Return ONLY the English prompt. No explanations, no preamble.`,
            prompt: task.prompt
          });

          if (enhancedPrompt.trim() === 'BLOCKED') {
            return { success: false, error: 'Запрос содержит недопустимый контент и заблокирован.' };
          }

          // Генерируем картинку через Fal.ai
          const falRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
            method: 'POST',
            headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: enhancedPrompt, image_size: 'landscape_4_3', num_inference_steps: 4 })
          });

          if (!falRes.ok) {
            const errText = await falRes.text();
            logAiError('generate_image:fal', errText, { status: falRes.status });
            throw new Error('Fal.ai API error');
          }

          const falData = await falRes.json();
          const imageUrl = falData.images?.[0]?.url;
          if (!imageUrl) return { success: false, error: 'Провайдер не вернул изображение' };

          return { success: true, mode: 'generate_image', data: imageUrl };
        } catch (e) {
          logAiError('generate_image', e, { promptLength: task.prompt.length });
          return { success: false, error: 'Ошибка при генерации картинки' };
        }
      }

      // ─────────────────────────────────────────────
      // GENERATE TOUR
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_tour') {
        const { object } = await generateObject({
          model,
          schema: TourAiSchema,
          system: `${EVA_BRAND_CONTEXT}

Ты генерируешь карточку тура для сайта клуба.
Правила:
- description — продающий Markdown, 2–3 живых абзаца, конкретика
- program — логичная структура для данного типа тура
- included — реалистичный список для бюджета клуба
- faq — 3–5 вопросов, которые реально задают перед таким туром
- meta_title — до 60 символов, с ключевым словом
- Если данные не указаны в запросе — придумывай логично, но не пиши конкретные цены и даты`,
          prompt: `Создай карточку тура: «${task.prompt}». Валюта: MDL.`,
        });
        return { success: true, mode: 'generate_tour', data: object };
      }

      // ─────────────────────────────────────────────
      // GENERATE BLOG
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_blog') {
        const { object } = await generateObject({
          model,
          schema: BlogAiSchema,
          system: `${EVA_BRAND_CONTEXT}

Ты пишешь статью для блога турклуба.
Правила:
- Целевая аудитория: активные взрослые и семьи из Приднестровья и Молдовы
- Структура: хук в начале → полезное содержание → призыв записаться в тур
- Используй подзаголовки (##), списки и выделения где уместно
- Избегай банальных советов — пиши как опытный инструктор
- SEO: естественно упоминай ключевые слова (активный отдых, туры, природа Днестра)`,
          prompt: `Напиши статью для блога на тему: «${task.topic}».`,
        });
        return { success: true, mode: 'generate_blog', data: object };
      }

      // ─────────────────────────────────────────────
      // PARSE TOUR TEXT (Извлечение структуры)
      // ─────────────────────────────────────────────
      if (task.mode === 'parse_tour_text') {
        const { object } = await generateObject({
          model,
          schema: TourAiSchema,
          system: `${EVA_BRAND_CONTEXT}

Ты извлекаешь структуру тура из произвольного текста.

КРИТИЧЕСКИ ВАЖНО — АНТИГАЛЛЮЦИНАЦИОННЫЕ ПРАВИЛА:
- Используй ТОЛЬКО данные из переданного текста
- Если поле не упоминается в тексте — оставь его пустым
- ЗАПРЕЩЕНО выдумывать: цены, даты, места встречи, дистанции, программу дней
- Если не уверен в значении — лучше оставь поле пустым, чем угадывать`,
          prompt: `Извлеки структуру тура из следующего текста:\n\n${task.text}`,
        });
        return { success: true, mode: 'parse_tour_text', data: object };
      }

      // ─────────────────────────────────────────────
      // GENERATE CHECKLIST (Список вещей)
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_checklist') {
        const { object } = await generateObject({
          model,
          schema: ChecklistSchema,
          system: `${EVA_BRAND_CONTEXT}

Ты составляешь список снаряжения для участника тура.
Правила:
- Ровно 5–8 категорий
- В каждой категории 5–10 конкретных пунктов
- Без дублей
- Учитывай специфику региона (Приднестровье/Молдова, климат, рельеф)
- Пиши конкретно: не «обувь», а «треккинговые ботинки или кроссовки с агрессивным протектором»`,
          prompt: `Список вещей для тура.\nЛокация: ${task.location}\nТип активности: ${task.type}\nСезон: ${task.season}`,
        });
        return { success: true, mode: 'generate_checklist', data: object };
      }

      // ─────────────────────────────────────────────
      // IMPROVE TEXT (Редактор)
      // ─────────────────────────────────────────────
      if (task.mode === 'improve_text') {
        const toneInstructions: Record<string, string> = {
          selling: `Твоя цель — продать тур. Сделай текст эмоциональным, конкретным, с призывом к действию. Убери воду.`,
          fix: `Твоя цель — корректор и редактор. Исправь грамматику, пунктуацию. Убери повторы. Сохрани смысл оригинала.`,
          casual: `Твоя цель — сделать текст живым и понятным. Пиши как опытный друг.`
        };

        const { text } = await generateText({
          model,
          system: `${EVA_BRAND_CONTEXT}\n\n${toneInstructions[task.tone ?? 'selling']}`,
          prompt: `Улучши этот текст:\n\n${task.text}`,
        });
        return { success: true, mode: 'improve_text', data: text };
      }

      // ─────────────────────────────────────────────
      // SMM POST (Для SMM-Пульта)
      // ─────────────────────────────────────────────
      if (task.mode === 'smm_post') {
        const platformInstructions: Record<string, string> = {
          instagram: 'Платформа: Instagram. Короткие абзацы (2–3 строки). Эмодзи уместны. Без кликабельных ссылок в тексте.',
          telegram: 'Платформа: Telegram. Поддерживает Markdown. Вшивай ссылку в текст: [Забронировать тур](URL).',
          facebook: 'Платформа: Facebook. Официальный, информативный тон. Можно добавить ссылку.',
          threads: 'Платформа: Threads. Очень коротко. Хук в первых 2 строках. Дерзко и по делу.'
        };

        const toneInstructions: Record<string, string> = {
          fun: 'Стиль: весёлый, хайповый, на «ты», много эмодзи.',
          epic: 'Стиль: эпичный, вдохновляющий, кинематографично.',
          strict: 'Стиль: сдержанный, только факты, никаких эмодзи.',
          info: 'Стиль: информативный, экспертный, спокойный.',
          sell: 'Стиль: продающий. Акцент на дефицит мест (FOMO) и конкретную выгоду.'
        };

        const selectedTone = toneInstructions[task.tone ?? 'fun'];
        const selectedPlatform = platformInstructions[task.platform ?? 'telegram'];
        const targetSteps = task.steps && task.steps.length > 0 ? task.steps : [];

        const structureInstruction = targetSteps.length > 0
          ? `СЛАЙДЫ КАРУСЕЛИ: сгенерируй ровно ${targetSteps.length} слайдов.\nСтрогая последовательность:\n${targetSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nФУНДАМЕНТАЛЬНОЕ ПРАВИЛО: ты форматер, а не фантазёр. Используй данные ТОЛЬКО из контекста.`
          : 'СЛАЙДЫ: не нужны. Оставь массив slides пустым. Напиши только текст поста (caption).';

        const { object } = await generateObject({
          model,
          schema: SmmPostSchema,
          system: `${EVA_BRAND_CONTEXT}\n\nТы — SMM-маркетолог. \n${selectedTone}\n${selectedPlatform}\n\n${structureInstruction}`,
          prompt: `Напиши пост и тексты слайдов на основе этих данных (используй как источник фактов):\n\n${task.context}`,
        });

        return { success: true, mode: 'smm_post', data: object };
      }

      // ─────────────────────────────────────────────
      // CHAT (Внутренний ассистент с RAG контекстом БД)
      // ─────────────────────────────────────────────
      if (task.mode === 'chat') {
        const dbContext = await loadChatContext();
        const contextBlock = formatContextForPrompt(dbContext);

        logAiInfo('chat', {
          upcomingToursCount: dbContext.upcomingTours.length,
          recentPostsCount: dbContext.recentBlogPosts.length,
          messagesCount: task.messages.length,
        });

        const { text } = await generateText({
          model,
          system: `${EVA_BRAND_CONTEXT}

Ты — EVA, стратегический AI-ассистент для команды клуба.
Помогаешь с: планированием туров, маркетингом, текстами, анализом, идеями.

=== АКТУАЛЬНЫЕ ДАННЫЕ КЛУБА ИЗ БАЗЫ ДАННЫХ ===
${contextBlock}
=== КОНЕЦ ДАННЫХ ===

Правила работы с данными:
- На вопросы о расписании и ценах отвечай ТОЛЬКО на основе данных выше.
- Если тур не в списке — скажи: «Этого тура нет в ближайшем расписании».
- Не придумывай туры, цены и даты, которых нет в контексте.
- Отвечай конкретно и по делу.`,
          messages: task.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        return { success: true, mode: 'chat', data: text };
      }

      return { success: false, error: 'Неизвестная команда AI' };

    } catch (error) {
      logAiError(task.mode, error, {
        inputSize:
          'prompt' in task ? String(task.prompt).length
          : 'text' in task ? String(task.text).length
          : 'messages' in task ? task.messages.length
          : undefined,
      });
      return { success: false, error: (error as Error).message || 'Ошибка обработки AI' };
    }
  })
);