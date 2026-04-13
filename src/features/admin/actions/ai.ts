'use server';

import { generateObject, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import OpenAI from 'openai';
import { z } from 'zod';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit'; // ✅ Добавлен аудит
import { adminRateLimit, getClientIp } from '@/lib/rate-limit';

// === 1. КОНФИГУРАЦИЯ ===
const model = google('gemini-1.5-flash');

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

// === 3. ТИПЫ ЗАДАЧ ===
export type AiTaskType = // Экспортируем, чтобы не было конфликтов при импорте, если понадобится
  | { mode: 'generate_tour'; prompt: string }
  | { mode: 'generate_blog'; topic: string }
  | { mode: 'generate_image'; prompt: string }
  | { mode: 'parse_tour_text'; text: string }
  | { mode: 'generate_checklist'; location: string; season: string; type: string }
  | { mode: 'improve_text'; text: string; tone?: 'selling' | 'fix' | 'casual' }
  | { mode: 'smm_post'; context: any; platform: 'instagram' | 'telegram' | 'facebook' | 'threads'; tone?: 'fun' | 'epic' | 'strict' }
  | { mode: 'chat'; messages: { role: 'user' | 'assistant'; content: string }[] }

// === 4. ГЛАВНЫЙ ЭКШЕН (🔥 ТЕПЕРЬ ЗАЩИЩЕН И ЛОГИРУЕТСЯ) ===
export const performAiTask = withAdminAuth(
  withAdminAudit({
    actionName: 'PERFORM_AI_TASK',
    getTargetId: (task: AiTaskType) => task.mode, // Используем мод как targetId
  })(async (task: AiTaskType) => {
    // Rate Limiting (защита кошелька API от спама)
    try {
      const ip = await getClientIp();
      const { success: rateLimitSuccess } = await adminRateLimit.limit(ip);

      if (!rateLimitSuccess) {
        return { 
          success: false, 
          error: 'Превышен лимит запросов к AI (15 в минуту). Пожалуйста, немного подождите.' 
        };
      }
    } catch (error) {
      console.error('Rate limit error in performAiTask:', error);
      // При падении Redis пропускаем запрос, чтобы админ мог продолжить работу
    }

    try {
      // --- ГЕНЕРАЦИЯ КАРТИНКИ (DALL-E) ---
      if (task.mode === 'generate_image') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { success: false, error: "Нет API ключа OpenAI (.env)" };

        const openai = new OpenAI({ apiKey });
        const { data } = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional travel photography, cinematic lighting, highly detailed. Subject: ${task.prompt}`,
          n: 1, size: "1024x1024",
        });
        return { success: true, data: data?.[0]?.url };
      }

      // --- GEMINI ЗАДАЧИ ---
      if (task.mode === 'generate_tour') {
        const { object } = await generateObject({
          model, schema: TourAiSchema,
          prompt: `Придумай план тура: "${task.prompt}". Валюта: MDL.`,
        });
        return { success: true, data: object };
      }

      if (task.mode === 'generate_blog') {
        const { object } = await generateObject({
          model, schema: BlogAiSchema,
          prompt: `Статья для блога турклуба: "${task.topic}".`,
        });
        return { success: true, data: object };
      }

      if (task.mode === 'parse_tour_text') {
        const { object } = await generateObject({
          model, schema: TourAiSchema,
          prompt: `Извлеки структуру тура из текста: "${task.text}"`,
        });
        return { success: true, data: object };
      }

      if (task.mode === 'generate_checklist') {
        const { object } = await generateObject({
          model, schema: ChecklistSchema,
          prompt: `Список вещей. Локация: ${task.location}, Тип: ${task.type}, Сезон: ${task.season}.`,
        });
        return { success: true, data: object };
      }

      if (task.mode === 'improve_text') {
        const prompts: Record<string, string> = {
          selling: 'Твоя цель: продать. Сделай текст эмоциональным, ярким, с призывом.',
          fix: 'Твоя цель: корректор. Исправь ошибки, убери воду.',
          casual: 'Твоя цель: друг. Сделай текст простым и понятным.'
        };

        const { text } = await generateText({
          model,
          system: prompts[task.tone || 'selling'],
          prompt: `Улучши этот текст для описания тура:\n\n${task.text}`,
        });
        return { success: true, data: text };
      }

      if (task.mode === 'smm_post') {
        const platformPrompts = {
          instagram: 'Instagram. Визуал, эмодзи, абзацы, хештеги.',
          telegram: 'Telegram. Информативно, Markdown разметка, без воды.',
          facebook: 'Facebook. Официально, дружелюбно.',
          threads: 'Threads. Коротко, дерзко, хук в начале.'
        };

        const tonePrompts = {
          fun: "Стиль: Веселый, хайповый, на 'ты', много эмодзи.",
          epic: "Стиль: Эпичный, вдохновляющий, 'зов природы', кинематографично.",
          strict: "Стиль: Сдержанный, по делу, только факты."
        };

        const selectedTone = tonePrompts[task.tone || 'fun'];

        const { text } = await generateText({
          model,
          system: `Ты — SMM-менеджер турклуба. Твоя задача — написать пост.`,
          prompt: `
            ПЛАТФОРМА: ${platformPrompts[task.platform]}
            НАСТРОЕНИЕ: ${selectedTone}

            ДАННЫЕ ТУРА (Контекст):
            ${JSON.stringify(task.context)}

            ЗАДАЧА: Напиши готовый к публикации пост. В конце призыв к действию.
          `,
        });
        return { success: true, data: text };
      }

      if (task.mode === 'chat') {
        const { text } = await generateText({
          model,
          system: 'Ты — EVA, стратегический AI-партнер.',
          // 🔥 ИСПРАВЛЕНО: Убрали any, используем выведенный тип из interface
          messages: task.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content as string,
          })),
        });
        return { success: true, data: text };
      }

      return { success: false, error: 'Неизвестная команда AI' };

    } catch (error) {
      console.error("AI Error:", error);
      return { success: false, error: (error as Error).message || "Ошибка обработки AI" };
    }
  })
);