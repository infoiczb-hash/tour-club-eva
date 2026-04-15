// src/features/admin/actions/ai.ts
'use server';

import { generateObject, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import OpenAI from 'openai';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';
import { adminRateLimit, getClientIp } from '@/lib/rate-limit';

// === 1. КОНФИГУРАЦИЯ ===
const model = google('gemini-2.0-flash-001'); 

// === 2. СХЕМЫ ДАННЫХ (ZOD) ===

const TourAiSchema = z.object({
  title: z.string().describe('Маркетинговое название тура'),
  subtitle: z.string().describe('Краткий слоган'),
  type: z.enum(['hiking', 'kayaking', 'sup', 'kids', 'local']),
  description: z.string().describe('Вкусное, продающее описание (Markdown, 2-3 абзаца)'),
  location: z.string(),
  meeting_point: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration: z.string(),
  distance: z.string().optional(),
  price_adult: z.number(),
  currency: z.enum(['RUB', 'MDL', 'EUR']).default('MDL'),
  dates: z.array(z.string()).optional(),
  program: z.array(z.object({
    day: z.number(),
    title: z.string(),
    activities: z.array(z.object({
      time: z.string().optional(),
      title: z.string(),
      icon: z.string()
    }))
  })),
  included: z.array(z.string()),
  additionalExpenses: z.array(z.string()),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  meta_title: z.string(),
  meta_desc: z.string(),
});

const ChecklistSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    items: z.array(z.string())
  }))
});

const BlogAiSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  category: z.string(),
  read_time: z.string()
});

// ✅ Схема доработана под Проблемы 1, 4, 6
const SmmPostSchema = z.object({
  caption: z.string().describe('Текст поста. СТРОГО разделять абзацы через \\n\\n. Должен быть легким для чтения.'),
  slides: z.array(z.object({
    title: z.string().describe('Заголовок для UI-карточки (до 5 слов, КАПСОМ)'),
    text: z.string().describe('Краткий тезис (до 90 символов), чтобы не перекрывать дизайн')
  })).describe('Массив слайдов карусели. Количество должно совпадать с запрошенной структурой.'),
  hashtags: z.array(z.string()).describe('Массив тематических хештегов без символа #')
});

// === 3. ТИПЫ ЗАДАЧ ===
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

// Универсальный результат без any
export type PerformAiTaskResult =
  | { success: true; data: TourAiData | BlogAiData | ChecklistData | SmmPostData | string | Record<string, unknown> }
  | { success: false; error: string };

// === 5. ГЛАВНЫЙ ЭКШЕН ===
export const performAiTask = withAdminAuth(
  withAdminAudit({
    actionName: 'PERFORM_AI_TASK',
    getTargetId: (task: AiTaskType) => task.mode,
  })(async (task: AiTaskType): Promise<PerformAiTaskResult> => {
    
    // 1. RATE LIMITING
    try {
      const ip = await getClientIp();
      const { success: rateLimitSuccess } = await adminRateLimit.limit(ip);
      if (!rateLimitSuccess) {
        return { success: false, error: 'Превышен лимит (15/мин). Подождите немного.' };
      }
    } catch (error) {
      console.error('Rate limit error:', error);
    }

    try {
      // --- IMAGE GENERATION (DALL-E 3) ---
      if (task.mode === 'generate_image') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { success: false, error: "Нет API ключа OpenAI" };

        const openai = new OpenAI({ apiKey });
        const { data } = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional travel photography, high detail, 8k. Context: ${task.prompt}`,
          n: 1, size: "1024x1024",
        });
        return { success: true, data: data?.[0]?.url ?? '' };
      }

      // --- TOUR GENERATION ---
      if (task.mode === 'generate_tour') {
        const { object } = await generateObject({
          model, schema: TourAiSchema,
          prompt: `Придумай план тура на основе: "${task.prompt}". Валюта: MDL.`,
        });
        return { success: true, data: object };
      }

      // --- BLOG GENERATION ---
      if (task.mode === 'generate_blog') {
        const { object } = await generateObject({
          model, schema: BlogAiSchema,
          prompt: `Статья для блога: "${task.topic}".`,
        });
        return { success: true, data: object };
      }

      // --- TEXT PARSING ---
      if (task.mode === 'parse_tour_text') {
        const { object } = await generateObject({
          model, schema: TourAiSchema,
          prompt: `Извлеки структурированные данные из этого текста: "${task.text}"`,
        });
        return { success: true, data: object };
      }

      // --- CHECKLIST ---
      if (task.mode === 'generate_checklist') {
        const { object } = await generateObject({
          model, schema: ChecklistSchema,
          prompt: `Список вещей: ${task.location}, ${task.type}, ${task.season}.`,
        });
        return { success: true, data: object };
      }

      // --- TEXT IMPROVEMENT ---
      if (task.mode === 'improve_text') {
        const prompts = {
          selling: 'Сделай текст продающим, эмоциональным и ярким.',
          fix: 'Исправь грамматические ошибки и убери лишнюю воду.',
          casual: 'Сделай текст дружелюбным, простым, как для друга.'
        };
        const { text } = await generateText({
          model,
          system: prompts[task.tone || 'selling'],
          prompt: `Улучши этот текст:\n\n${task.text}`,
        });
        return { success: true, data: text };
      }

      // --- SMM POST (КЛЮЧЕВАЯ ЛОГИКА - ПРОБЛЕМЫ 1, 4, 6, 7) ---
      if (task.mode === 'smm_post') {
        const platformGuides: Record<string, string> = {
          instagram: 'Instagram. СТРОГО без кликабельных ссылок. Призыв: "Активная ссылка в шапке профиля 👆". Абзацы через \\n\\n.',
          telegram: 'Telegram. Используй Markdown (**bold**). Вшивай ссылки в текст: [Забронировать тур](URL).',
          facebook: 'Facebook. Солидно и развернуто. Ссылка в конце поста.',
          threads: 'Threads. Коротко и цепляюще.'
        };

        const toneGuides: Record<string, string> = {
          fun: "Хайпово, на 'ты', много огня и эмодзи.",
          epic: "Вдохновляюще, про силу природы и масштаб.",
          strict: "Только факты, тайминги и цена.",
          info: "Полезно, интересно, экспертно.",
          sell: "Продающий стиль с акцентом на дефицит мест (FOMO)."
        };

        const selectedTone = toneGuides[task.tone || 'fun'];
        const selectedPlatform = platformGuides[task.platform || 'instagram'];
        const targetSteps = task.steps?.length ? task.steps : ['Обложка', 'Суть', 'Детали', 'CTA'];

        const { object } = await generateObject({
          model,
          schema: SmmPostSchema,
          system: `Ты — Senior SMM турклуба "ЭВА". Твоя задача — создать безупречный контент.
            
            ПРАВИЛА ТЕКСТА:
            - Каждая новая мысль — это новый абзац.
            - Между абзацами ОБЯЗАТЕЛЬНО двойной отступ (\\n\\n).
            - Тон: ${selectedTone}
            - Платформа: ${selectedPlatform}
            
            ПРАВИЛА СЛАЙДОВ:
            - Текст для слайдов должен быть экстремально коротким (до 80-90 символов).
            - Сгенерируй ровно ${targetSteps.length} слайдов по структуре:
            ${targetSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
          prompt: `Создай контент для поста на основе данных:\n${task.context}`,
        });
        
        return { success: true, data: object };
      }

      // --- CHAT ---
      if (task.mode === 'chat') {
        const { text } = await generateText({
          model,
          system: 'Ты — EVA, интеллектуальный помощник турклуба.',
          messages: task.messages.map(m => ({ role: m.role, content: m.content })),
        });
        return { success: true, data: text };
      }

      return { success: false, error: 'Команда не распознана' };

    } catch (error) {
      console.error("AI Action Error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Ошибка AI" };
    }
  })
);