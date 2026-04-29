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
import { redis } from '@/lib/redis';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

// ============================================================================
// 1. КОНФИГУРАЦИЯ ИИ
// ============================================================================
const primaryModel = google('gemini-2.5-flash');
const fallbackModel = createGroq({ apiKey: process.env.GROQ_API_KEY! })('llama3-70b-8192');

// ============================================================================
// 2. СТРУКТУРИРОВАННОЕ ЛОГИРОВАНИЕ (АУДИТ)
// ============================================================================
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
  currency: z.enum(['RUB', 'RUB', 'EUR']).default('RUB'),
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
  | { 
      mode: 'generate_image'; 
      prompt: string;
      engine?: 'dalle3' | 'flux-schnell' | 'flux-dev' | 'flux' | 'dalle';
      enhance?: boolean;
      imageUrl?: string;        // URL исходного фото для i2i
      promptStrength?: number;  // Сила изменения (0.1 - 1.0)
      aspectRatio?: string;     // Формат: '1:1', '16:9', '9:16', '4:5', '3:2'
    }
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
  | { success: true; mode: 'generate_tour'; data: TourAiData }
  | { success: true; mode: 'parse_tour_text'; data: TourAiData }
  | { success: true; mode: 'generate_blog'; data: BlogAiData }
  | { success: true; mode: 'generate_checklist'; data: ChecklistData }
  | { success: true; mode: 'smm_post'; data: SmmPostData }
  | { success: true; mode: 'generate_image'; data: string }
  | { success: true; mode: 'improve_text'; data: string }
  | { success: true; mode: 'chat'; data: string }
  | { success: false; error: string };

// ============================================================================
// 6. RAG: КОНТЕКСТ ИЗ БД ДЛЯ ВНУТРЕННЕГО ЧАТА
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

    const [tours, posts] = await Promise.all([
      prisma.tour.findMany({
        where: {
          isActive: true,
          tourDates: { some: { startDate: { gte: now, lte: in60days }, isActive: true } }
        },
        select: {
          title: true,
          price: true,
          currency: true,
          location: true,
          difficulty: true,
          tourDates: {
            where: { startDate: { gte: now, lte: in60days }, isActive: true },
            select: { startDate: true },
            orderBy: { startDate: 'asc' },
            take: 3,
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      prisma.blog.findMany({
        where: { isActive: true },
        select: { title: true, blogCategory: { select: { slug: true } }, date: true },
        orderBy: { date: 'desc' },
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
// 7. КЭШИРОВАНИЕ И ХЕЛПЕРЫ УСТОЙЧИВОСТИ
// ============================================================================

function isQuotaExceededError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('429') ||
    msg.includes('exceeded') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted') ||
    msg.includes('too many requests')
  );
}

function generateCacheKey(mode: string, params: Record<string, unknown>): string {
  const serialized = JSON.stringify({ mode, ...params });
  const hash = crypto.createHash('sha256').update(serialized).digest('hex');
  return `ai:${mode}:${hash}`;
}

async function getCachedResult<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }
  } catch {
    // игнорируем ошибки Redis – просто идём в AI
  }
  return null;
}

async function setCachedResult<T>(key: string, value: T, ttlSeconds = 86400): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // не критично
  }
}

async function withAiFallback<T>(
  mode: string,
  cacheParams: Record<string, unknown>,
  generateFn: (model: any) => Promise<T>
): Promise<T> {
  const cacheKey = generateCacheKey(mode, cacheParams);
  const cached = await getCachedResult<T>(cacheKey);
  if (cached) {
    logAiInfo(mode, { cacheHit: true });
    return cached;
  }

  try {
    const result = await generateFn(primaryModel);
    await setCachedResult(cacheKey, result);
    return result;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      Sentry.captureMessage(`Gemini quota exceeded for mode: ${mode}`, {
        level: 'warning',
        tags: { mode },
      });
      logAiInfo(mode, { fallback: 'groq' });
      try {
        const result = await generateFn(fallbackModel);
        await setCachedResult(cacheKey, result);
        return result;
      } catch (fallbackError) {
        logAiError(mode, fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

// ============================================================================
// 8. ГЛАВНЫЙ ЭКШЕН И МАРШРУТИЗАТОР (CONTROLLER)
// ============================================================================
export const performAiTask = withAdminAuth(
  withAdminAudit({
    actionName: 'PERFORM_AI_TASK',
    getTargetId: (task: AiTaskType) => task.mode,
  })(async (task: AiTaskType): Promise<PerformAiTaskResult> => {

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
      // GENERATE IMAGE (Flux Schnell / Flux Dev / DALL·E 3)
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_image') {
        try {
          const engine = task.engine || 'flux-schnell';
          const shouldEnhance = task.enhance !== false; // По умолчанию включено
          
          // НОВЫЕ ПАРАМЕТРЫ
          const imageUrl = task.imageUrl; 
          const strength = task.promptStrength || 0.75; 
          const aspectRatio = task.aspectRatio || '1:1'; 

          let finalPrompt = task.prompt;

          // 1. Улучшаем промпт через LLM, если тумблер включен
          if (shouldEnhance) {
            finalPrompt = await withAiFallback(
              'enhance_image_prompt',
              { prompt: task.prompt },
              async (model) => {
                const { text } = await generateText({
                  model,
                  temperature: 0.7,
                  system: `You are an expert image generation prompt engineer.
The user will give you a simple idea in Russian or English.

SAFETY CHECK: If the idea contains harmful, violent, adult, or illegal content — respond with exactly the word: BLOCKED

Otherwise:
- Translate the idea to English
- Expand it into a detailed, cinematic, hyperrealistic photography prompt
- Include: lighting, composition, mood, camera angle, style
- Return ONLY the English prompt. No explanations, no preamble.`,
                  prompt: task.prompt
                });
                return text;
              }
            );

            if (finalPrompt.trim() === 'BLOCKED') {
              return { success: false, error: 'Запрос содержит недопустимый контент и заблокирован.' };
            }
          }

          // 2. МАРШРУТИЗАЦИЯ ПО ДВИЖКАМ
          if (engine === 'dalle3' || engine === 'dalle') {
            // === DALL·E 3 ===
            if (imageUrl) {
              return { success: false, error: 'DALL-E 3 не поддерживает модификацию фото. Пожалуйста, выберите модель Flux.' };
            }

            if (!process.env.OPENAI_API_KEY) {
              return { success: false, error: 'Нет ключа OPENAI_API_KEY в .env' };
            }

            // Адаптер форматов для DALL-E 3
            let dalleSize: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";
            if (aspectRatio === '16:9' || aspectRatio === '3:2') dalleSize = "1792x1024";
            if (aspectRatio === '9:16' || aspectRatio === '4:5') dalleSize = "1024x1792";

            const { OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const response = await openai.images.generate({
              model: "dall-e-3",
              prompt: finalPrompt.substring(0, 4000),
              n: 1,
              size: dalleSize,
              quality: "standard",
            });

            const generatedUrl = response.data?.[0]?.url;
            if (!generatedUrl) throw new Error('DALL·E 3 не вернул изображение');

            return { success: true, mode: 'generate_image', data: generatedUrl };

          } else {
            // === FLUX (Schnell или Dev) ===
            const falKey = process.env.FAL_KEY;
            if (!falKey) {
              return { success: false, error: 'Нет ключа FAL_KEY (.env)' };
            }

            // Адаптер форматов для Fal.ai (Flux)
            const falSizeMap: Record<string, string> = {
              '1:1': 'square_1_1',
              '16:9': 'landscape_16_9',
              '9:16': 'portrait_9_16',
              '4:5': 'portrait_4_5',
              '3:2': 'landscape_3_2'
            };
            const falSize = falSizeMap[aspectRatio] || 'square_1_1';

            // Базовый эндпоинт и payload (Text-to-Image)
            let falEndpoint = engine === 'flux-dev' ? 'fal-ai/flux/dev' : 'fal-ai/flux/schnell';
            let falBody: Record<string, any> = { 
              prompt: finalPrompt, 
              image_size: falSize, 
              num_inference_steps: engine === 'flux-dev' ? 20 : 4 
            };

            // Если передана картинка -> Переключаемся на Image-to-Image
            if (imageUrl) {
              falEndpoint = engine === 'flux-dev' ? 'fal-ai/flux/dev/image-to-image' : 'fal-ai/flux/schnell/image-to-image';
              falBody = {
                prompt: finalPrompt,
                image_url: imageUrl,
                strength: strength,
                num_inference_steps: engine === 'flux-dev' ? 20 : 4
              };
              // В i2i пропорции обычно наследуются от исходного фото, поэтому image_size опускаем
            }

            const falRes = await fetch(`https://fal.run/${falEndpoint}`, {
              method: 'POST',
              headers: { 
                'Authorization': `Key ${falKey}`, 
                'Content-Type': 'application/json' 
              },
              body: JSON.stringify(falBody)
            });

            if (!falRes.ok) {
              const errText = await falRes.text();
              logAiError('generate_image:fal', errText, { 
                status: falRes.status, 
                engine,
                isI2i: !!imageUrl 
              });
              throw new Error('Fal.ai API error');
            }

            const falData = await falRes.json();
            const generatedUrl = falData.images?.[0]?.url;
            if (!generatedUrl) return { success: false, error: 'Провайдер не вернул изображение' };

            return { success: true, mode: 'generate_image', data: generatedUrl };
          }

        } catch (e) {
          logAiError('generate_image', e, { 
            promptLength: task.prompt.length,
            engine: task.engine 
          });
          return { success: false, error: 'Ошибка при генерации картинки' };
        }
      }

      // ─────────────────────────────────────────────
      // GENERATE TOUR
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_tour') {
        const result = await withAiFallback(
          'generate_tour',
          { prompt: task.prompt },
          async (model) => {
            const { object } = await generateObject({
              model,
              temperature: 0.7,
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
            return object;
          }
        );
        return { success: true, mode: 'generate_tour', data: result };
      }

      // ─────────────────────────────────────────────
      // GENERATE BLOG
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_blog') {
        const result = await withAiFallback(
          'generate_blog',
          { topic: task.topic },
          async (model) => {
            const { object } = await generateObject({
              model,
              temperature: 0.7,
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
            return object;
          }
        );
        return { success: true, mode: 'generate_blog', data: result };
      }

      // ─────────────────────────────────────────────
      // PARSE TOUR TEXT
      // ─────────────────────────────────────────────
      if (task.mode === 'parse_tour_text') {
        const result = await withAiFallback(
          'parse_tour_text',
          { text: task.text },
          async (model) => {
            const { object } = await generateObject({
              model,
              temperature: 0.1,
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
            return object;
          }
        );
        return { success: true, mode: 'parse_tour_text', data: result };
      }

      // ─────────────────────────────────────────────
      // GENERATE CHECKLIST
      // ─────────────────────────────────────────────
      if (task.mode === 'generate_checklist') {
        const result = await withAiFallback(
          'generate_checklist',
          { location: task.location, season: task.season, type: task.type },
          async (model) => {
            const { object } = await generateObject({
              model,
              temperature: 0.1, 
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
            return object;
          }
        );
        return { success: true, mode: 'generate_checklist', data: result };
      }

      // ─────────────────────────────────────────────
      // IMPROVE TEXT
      // ─────────────────────────────────────────────
      if (task.mode === 'improve_text') {
        const tone = task.tone ?? 'selling';
        const toneInstructions: Record<string, string> = {
          selling: `Твоя цель — продать тур. Сделай текст эмоциональным, конкретным, с призывом к действию. Убери воду.`,
          fix: `Твоя цель — корректор и редактор. Исправь грамматику, пунктуацию. Убери повторы. Сохрани смысл оригинала.`,
          casual: `Твоя цель — сделать текст живым и понятным. Пиши как опытный друг.`
        };

        const result = await withAiFallback(
          'improve_text',
          { text: task.text, tone },
          async (model) => {
            const { text } = await generateText({
              model,
              system: `${EVA_BRAND_CONTEXT}\n\n${toneInstructions[tone]}`,
              prompt: `Улучши этот текст:\n\n${task.text}`,
            });
            return text;
          }
        );
        return { success: true, mode: 'improve_text', data: result };
      }

      // ─────────────────────────────────────────────
      // SMM POST
      // ─────────────────────────────────────────────
      if (task.mode === 'smm_post') {
        const platform = task.platform ?? 'telegram';
        const tone = task.tone ?? 'fun';
        const steps = task.steps ?? [];

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

        const selectedTone = toneInstructions[tone];
        const selectedPlatform = platformInstructions[platform];

        const structureInstruction = steps.length > 0
          ? `СЛАЙДЫ КАРУСЕЛИ: сгенерируй ровно ${steps.length} слайдов.\nСтрогая последовательность:\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nФУНДАМЕНТАЛЬНОЕ ПРАВИЛО: ты форматер, а не фантазёр. Используй данные ТОЛЬКО из контекста.`
          : 'СЛАЙДЫ: не нужны. Оставь массив slides пустым. Напиши только текст поста (caption).';

        const result = await withAiFallback(
          'smm_post',
          { context: task.context, platform, tone, steps },
          async (model) => {
            const { object } = await generateObject({
              model,
              temperature: 0.7,
              schema: SmmPostSchema,
              system: `${EVA_BRAND_CONTEXT}\n\nТы — SMM-маркетолог. \n${selectedTone}\n${selectedPlatform}\n\n${structureInstruction}`,
              prompt: `Напиши пост и тексты слайдов на основе этих данных (используй как источник фактов):\n\n${task.context}`,
            });
            return object;
          }
        );
        return { success: true, mode: 'smm_post', data: result };
      }

      // ─────────────────────────────────────────────
      // CHAT
      // ─────────────────────────────────────────────
     if (task.mode === 'chat') {
  const dbContext = await loadChatContext();
  const contextBlock = formatContextForPrompt(dbContext);

  logAiInfo('chat', {
    upcomingToursCount: dbContext.upcomingTours.length,
    recentPostsCount: dbContext.recentBlogPosts.length,
    messagesCount: task.messages.length,
  });

  const chatSystem = `${EVA_BRAND_CONTEXT}

Ты — EVA, стратегический AI-ассистент для команды клуба.
Помогаешь с: планированием туров, маркетингом, текстами, анализом, идеями.

=== АКТУАЛЬНЫЕ ДАННЫЕ КЛУБА ИЗ БАЗЫ ДАННЫХ ===
${contextBlock}
=== КОНЕЦ ДАННЫХ ===

Правила работы с данными:
- На вопросы о расписании и ценах отвечай ТОЛЬКО на основе данных выше.
- Если тур не в списке — скажи: «Этого тура нет в ближайшем расписании».
- Не придумывай туры, цены и даты, которых нет в контексте.
- Отвечай конкретно и по делу.`;

  const chatMessages = task.messages.map((m) => ({ role: m.role, content: m.content }));

  let chatText: string;
  try {
    ({ text: chatText } = await generateText({
      model: primaryModel,
      system: chatSystem,
      messages: chatMessages,
    }));
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;
    Sentry.captureMessage('Gemini quota exceeded for mode: chat', { level: 'warning', tags: { mode: 'chat' } });
    logAiInfo('chat', { fallback: 'groq' });
    ({ text: chatText } = await generateText({
      model: fallbackModel,
      system: chatSystem,
      messages: chatMessages,
    }));
  }

  return { success: true, mode: 'chat', data: chatText };
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