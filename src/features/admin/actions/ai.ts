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
const model = google('gemini-1.5-pro'); 

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

const SmmPostSchema = z.object({
  text: z.string().describe('Основной текст поста, разделенный на абзацы. Без хештегов.'),
  hashtags: z.array(z.string()).describe('Массив хештегов без символа #, например ["турклубэва", "горы"]')
});

// === 3. ТИПЫ ЗАДАЧ ===
export type AiTaskType =
  | { mode: 'generate_tour'; prompt: string }
  | { mode: 'generate_blog'; topic: string }
  | { mode: 'generate_image'; prompt: string }
  | { mode: 'parse_tour_text'; text: string }
  | { mode: 'generate_checklist'; location: string; season: string; type: string }
  | { mode: 'improve_text'; text: string; tone?: 'selling' | 'fix' | 'casual' }
  | { mode: 'smm_post'; context: string; platform: 'instagram' | 'telegram' | 'facebook' | 'threads'; tone?: 'fun' | 'epic' | 'strict' | 'info' | 'sell' }
  | { mode: 'chat'; messages: { role: 'user' | 'assistant'; content: string }[] };

export type TourAiData = z.infer<typeof TourAiSchema>;
export type BlogAiData = z.infer<typeof BlogAiSchema>;
export type ChecklistData = z.infer<typeof ChecklistSchema>;
export type SmmPostData = z.infer<typeof SmmPostSchema>;

export type PerformAiTaskResult =
  | { success: true; data: TourAiData }                                    
  | { success: true; data: BlogAiData }                                    
  | { success: true; data: ChecklistData }                                 
  | { success: true; data: SmmPostData }                                   
  | { success: true; data: string }                                        
  | { success: true; data: Record<string, unknown> }                       
  | { success: false; error: string };

// === 5. ГЛАВНЫЙ ЭКШЕН ===
export const performAiTask = withAdminAuth(
  withAdminAudit({
    actionName: 'PERFORM_AI_TASK',
    getTargetId: (task: AiTaskType) => task.mode,
  })(async (task: AiTaskType): Promise<PerformAiTaskResult> => {
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
    }

    try {
      if (task.mode === 'generate_image') {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { success: false, error: "Нет API ключа OpenAI (.env)" };

        const openai = new OpenAI({ apiKey });
        const { data } = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional travel photography, cinematic lighting, highly detailed. Subject: ${task.prompt}`,
          n: 1, size: "1024x1024",
        });
        return { success: true, data: data?.[0]?.url ?? '' };
      }

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
        const platformPrompts: Record<string, string> = {
          instagram: 'Instagram. Короткие абзацы (не более 2-3 строк). Используй эмодзи. Призыв к действию: "Ссылка на бронирование в шапке профиля". Никаких кликабельных ссылок в самом тексте.',
          telegram: 'Telegram. Структурированно. Используй Markdown (**жирный** для акцентов).',
          facebook: 'Facebook. Официально, информативно, для взрослой аудитории.',
          threads: 'Threads. Коротко, дерзко, хук в начале.'
        };

        const tonePrompts: Record<string, string> = {
          fun: "Стиль: Веселый, хайповый, на 'ты', много эмодзи.",
          epic: "Стиль: Эпичный, вдохновляющий, 'зов природы', кинематографично.",
          strict: "Стиль: Сдержанный, по делу, только факты.",
          info: "Стиль: Информативный, спокойный, экспертный.",
          sell: "Стиль: Продающий, акцент на дефицит мест (FOMO) и выгоду."
        };

        const selectedTone = tonePrompts[task.tone || 'fun'];
        const selectedPlatform = platformPrompts[task.platform || 'telegram'];

        const { object } = await generateObject({
          model,
          schema: SmmPostSchema,
          system: `Ты — профессиональный SMM-маркетолог туристического клуба "ЭВА". 
            Твоя задача — писать вовлекающие, продающие посты.
            НАСТРОЕНИЕ: ${selectedTone}
            ПЛАТФОРМА: ${selectedPlatform}
            Выдай результат строго в формате JSON.`,
          prompt: `Напиши пост на основе этих данных:\n${task.context}`,
        });
        
        return { success: true, data: object };
      }

      if (task.mode === 'chat') {
        const { text } = await generateText({
          model,
          system: 'Ты — EVA, стратегический AI-партнер.',
          messages: task.messages.map((m) => ({
            role: m.role,
            content: m.content,
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