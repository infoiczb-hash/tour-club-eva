// src/features/fun/actions.ts
'use server';

import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getTours } from '@/features/tours/api'; 
import { Tour } from '@/features/tours/types';
import { headers } from 'next/headers';

// ==========================================
// IN-MEMORY RATE LIMITER 
// ==========================================
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const LIMIT = 50; 
const WINDOW_MS = 60 * 60 * 1000; 

async function checkRateLimit() {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();
    const userLimit = rateLimitMap.get(ip);

    if (!userLimit || now > userLimit.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
      return true;
    }

    if (userLimit.count >= LIMIT) {
      return false; 
    }

    userLimit.count += 1;
    return true;
  } catch (e) {
    return true; 
  }
}

// ==========================================
// 🔥 СВЕРХЛЕГКИЙ КОНТЕКСТ ДЛЯ ИИ (ЗАЩИТА ОТ ОШИБКИ 429)
// ==========================================
async function getLiteToursContext() {
  const allTours = await getTours();
  const liteContext = allTours.slice(0, 10).map(t => ({
    id: t.id,
    title: t.title
  }));
  return { allTours, liteContext };
}

// ==========================================
// 1. АНАЛИЗ СТРАХОВ (Fear Debrief)
// ==========================================
export async function analyzeFearsAction(fearsDetailed: string[]) {
  try {
    if (!(await checkRateLimit())) return { success: false, error: "Превышен лимит запросов к ИИ." };

    const { allTours, liteContext } = await getLiteToursContext();
    const stream = createStreamableValue();

    (async () => {
      try {
        const { partialObjectStream } = await streamObject({
          model: google('gemini-1.5-flash'),
          schema: z.object({
            analysis: z.string().describe('Глубокий психологический разбор страхов (2-3 абзаца). Тон: эмпатичный, обращайся на "ты".'),
            recommendedTourId: z.string().nullable().describe('ID идеального тура из списка для старта.')
          }),
          prompt: `
            Ты — туристический психолог. Клиент боится: 
            \n${fearsDetailed.join('\n')}
            
            Туры клуба (только названия и ID):
            \n${JSON.stringify(liteContext)}
            
            Сделай разбор страхов и выбери 1 подходящий тур по ID.
          `
        });

        for await (const partialObject of partialObjectStream) {
          stream.update(partialObject);
        }
        stream.done();
      } catch (error) {
        console.error("Stream error:", error);
        stream.error(error);
      }
    })();

    return { success: true, stream: stream.value, allTours };
  } catch (error: any) {
    console.error("AI Fear Analysis Error:", error);
    return { success: false, error: "Не удалось проанализировать страхи" };
  }
}

// ==========================================
// 2. АНАЛИЗ ФИЗИЧЕСКОЙ ФОРМЫ (Physical Readiness)
// ==========================================
export async function analyzePhysicalAction(answersText: string, levelTitle: string, levelSummary: string) {
  try {
    if (!(await checkRateLimit())) return { success: false, error: "Превышен лимит запросов к ИИ." };

    const { allTours, liteContext } = await getLiteToursContext();
    const stream = createStreamableValue();

    (async () => {
      try {
        const { partialObjectStream } = await streamObject({
          model: google('gemini-1.5-flash'),
          schema: z.object({
            analysis: z.string().describe('Разбор формы (2-3 абзаца). Тон: спортивный врач. Обращайся на "ты".'),
            recommendedTourId: z.string().nullable().describe('ID идеального тура из списка.')
          }),
          prompt: `
            Уровень формы: "${levelTitle}" (${levelSummary}).
            Ответы: \n${answersText}
            
            Туры клуба: \n${JSON.stringify(liteContext)}
            
            Сделай анализ формы и выбери 1 подходящий тур по ID.
          `
        });

        for await (const partialObject of partialObjectStream) {
          stream.update(partialObject);
        }
        stream.done();
      } catch (error) {
        console.error("Stream error:", error);
        stream.error(error);
      }
    })();

    return { success: true, stream: stream.value, allTours };
  } catch (error: any) {
    console.error("AI Physical Analysis Error:", error);
    return { success: false, error: "Не удалось проанализировать данные" };
  }
}

// ==========================================
// 3. АНАЛИЗ СИМПТОМОВ ТЕЛА (Body Signals)
// ==========================================
export async function analyzeBodySignalsAction(symptomsDetailed: string[]) {
  try {
    if (!(await checkRateLimit())) return { success: false, error: "Превышен лимит запросов к ИИ." };

    const { allTours, liteContext } = await getLiteToursContext();
    const stream = createStreamableValue();

    (async () => {
      try {
        const { partialObjectStream } = await streamObject({
          model: google('gemini-1.5-flash'),
          schema: z.object({
            analysis: z.string().describe('Анализ симптомов (2-3 абзаца). Тон: врач, без паники.'),
            recommendedTourId: z.string().nullable().describe('ID безопасного тура из списка.')
          }),
          prompt: `
            Симптомы в походе: \n${symptomsDetailed.join('\n')}
            
            Туры: \n${JSON.stringify(liteContext)}
            
            Сделай разбор симптомов и выбери 1 щадящий тур по ID.
          `
        });

        for await (const partialObject of partialObjectStream) {
          stream.update(partialObject);
        }
        stream.done();
      } catch (error) {
        console.error("Stream error:", error);
        stream.error(error);
      }
    })();

    return { success: true, stream: stream.value, allTours };
  } catch (error: any) {
    console.error("AI Body Signals Analysis Error:", error);
    return { success: false, error: "Не удалось проанализировать симптомы" };
  }
}

// ==========================================
// 4. РЕФЛЕКСИЯ ПОСЛЕ ТУРА (Tour Debrief)
// ==========================================
export async function analyzeDebriefAction(answersText: string) {
  try {
    if (!(await checkRateLimit())) return { success: false, error: "Превышен лимит запросов к ИИ." };

    const { allTours, liteContext } = await getLiteToursContext();
    const stream = createStreamableValue();

    (async () => {
      try {
        const { partialObjectStream } = await streamObject({
          model: google('gemini-1.5-flash'),
          schema: z.object({
            analysis: z.string().describe('Глубокий разбор: "Что я вижу", "Инсайт". Тон: теплый.'),
            recommendedTourId: z.string().nullable().describe('ID идеального следующего тура.')
          }),
          prompt: `
            Рефлексия туриста: \n${answersText}
            
            Туры: \n${JSON.stringify(liteContext)}
            
            Дай анализ опыта и выбери 1 следующий тур по ID.
          `
        });

        for await (const partialObject of partialObjectStream) {
          stream.update(partialObject);
        }
        stream.done();
      } catch (error) {
        console.error("Stream error:", error);
        stream.error(error);
      }
    })();

    return { success: true, stream: stream.value, allTours };
  } catch (error: any) {
    console.error("AI Debrief Analysis Error:", error);
    return { success: false, error: "Не удалось провести рефлексию" };
  }
}

// ==========================================
// 5. ПОЛНЫЙ СИНТЕЗ ПРОФИЛЯ (Full Profile)
// ==========================================
export async function analyzeFullProfileAction(profile: any) {
  try {
    if (!(await checkRateLimit())) return { success: false, error: "Превышен лимит запросов к ИИ." };

    const stream = createStreamableValue();

    (async () => {
      try {
        const { partialObjectStream } = await streamObject({
          model: google('gemini-1.5-flash'),
          schema: z.object({
            summaryTitle: z.string(),
            psychologicalPortrait: z.string(),
            mainInsight: z.string(),
            advice: z.string()
          }),
          prompt: `
            Синтез профиля:
            - Страхи: ${profile.fears?.length ? profile.fears.join(', ') : 'Нет'}
            - Физика: ${profile.physicalLevel || 'Нет'}
            - Тело: ${profile.bodySymptoms?.length ? profile.bodySymptoms.join(', ') : 'Нет'}
            - Архетип: ${profile.touristType || 'Нет'}
            
            Дай портрет личности, инсайт и совет по росту.
          `
        });

        for await (const partialObject of partialObjectStream) {
          stream.update(partialObject);
        }
        stream.done();
      } catch (error) {
        console.error("Stream error:", error);
        stream.error(error);
      }
    })();

    return { success: true, stream: stream.value };
  } catch (e) {
    console.error("AI Full Profile Error:", e);
    return { success: false, error: "Ошибка синтеза профиля" };
  }
}