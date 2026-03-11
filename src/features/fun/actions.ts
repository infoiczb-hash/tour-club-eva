'use server';

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getTours } from '@/features/tours/api'; 
import { Tour } from '@/features/tours/types';
import { headers } from 'next/headers';

// ==========================================
// IN-MEMORY RATE LIMITER (Защита от спама ИИ)
// ==========================================
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const LIMIT = 5; // Максимум 10 запросов к ИИ с одного IP
const WINDOW_MS = 60 * 60 * 1000; // В течение 1 часа

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
      return false; // Лимит исчерпан
    }

    userLimit.count += 1;
    return true;
  } catch (e) {
    return true; // Если не удалось получить IP, пропускаем, чтобы не блокировать честных юзеров
  }
}

// ==========================================
// 1. АНАЛИЗ СТРАХОВ (Fear Debrief)
// ==========================================
export async function analyzeFearsAction(fearsDetailed: string[]) {
  try {
    if (!(await checkRateLimit())) {
      return { success: false, error: "Превышен лимит запросов к ИИ. Попробуйте через час." };
    }

    const allTours = await getTours();
    
    // Делаем компактную выжимку туров для ИИ, чтобы экономить токены
    const toursContext = allTours.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category?.title || 'Активный отдых',
      difficulty: t.difficulty,
      location: t.location,
      duration: t.duration
    }));

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: z.object({
        analysis: z.string().describe('Глубокий психологический разбор страхов пользователя (2-3 абзаца). Тон: эмпатичный, профессиональный, поддерживающий. Прямо обращайся к пользователю на "ты".'),
        recommendedTourId: z.string().nullable().describe('ID идеального тура из предложенного списка, который лучше всего подойдет для старта и мягко снимет эти страхи. Если ничего не подходит, верни null.')
      }),
      prompt: `
        Ты — туристический психолог и опытный гид. Клиент хочет пойти в поход, но его останавливают следующие страхи: 
        \n${fearsDetailed.join('\n')}
        
        Вот список актуальных туров нашего клуба:
        \n${JSON.stringify(toursContext)}
        
        Твоя задача:
        1. Сделай терапевтичный разбор: почему эти страхи нормальны и как они решаются в реальности.
        2. Выбери из списка туров ОДИН идеальный для этого человека по ID, чтобы он мог сделать первый безопасный шаг.
      `
    });

    const recommendedTour = allTours.find(t => t.id === object.recommendedTourId) || null;

    return { success: true, analysis: object.analysis, tour: recommendedTour as Tour | null };
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
    if (!(await checkRateLimit())) {
      return { success: false, error: "Превышен лимит запросов к ИИ. Попробуйте через час." };
    }

    const allTours = await getTours();
    const toursContext = allTours.map(t => ({
      id: t.id, 
      title: t.title, 
      category: t.category?.title || 'Активный отдых',
      difficulty: t.difficulty, 
      location: t.location, 
      duration: t.duration
    }));

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: z.object({
        analysis: z.string().describe('Персональный разбор (2-3 абзаца). Тон: профессиональный, как спортивный врач или опытный гид. Обращайся на "ты". Опиши сильные стороны и дай один конкретный совет по подготовке.'),
        recommendedTourId: z.string().nullable().describe('ID идеального тура из списка, который подходит под уровень подготовки человека. Для слабых - легкие (вода/локал), для сильных - горы. Если ничего нет, верни null.')
      }),
      prompt: `
        Ты — спортивный врач и гид турклуба. Клиент прошел тест на физическую готовность к походу.
        Его базовый результат: "${levelTitle}" (${levelSummary}).
        
        Вот ответы на вопросы:
        \n${answersText}
        
        Вот список актуальных туров нашего клуба:
        \n${JSON.stringify(toursContext)}
        
        Твоя задача:
        1. Сделай персональный анализ его физической формы на основе ответов.
        2. Выбери из списка туров ОДИН идеальный для него по ID. Обоснуй выбор: почему этот тур подходит его уровню.
      `
    });

    const recommendedTour = allTours.find(t => t.id === object.recommendedTourId) || null;

    return { success: true, analysis: object.analysis, tour: recommendedTour as Tour | null };
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
    if (!(await checkRateLimit())) {
      return { success: false, error: "Превышен лимит запросов к ИИ. Попробуйте через час." };
    }

    const allTours = await getTours();
    const toursContext = allTours.map(t => ({
      id: t.id, 
      title: t.title, 
      category: t.category?.title || 'Активный отдых',
      difficulty: t.difficulty, 
      location: t.location, 
      duration: t.duration
    }));

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: z.object({
        analysis: z.string().describe('Анализ симптомов (2-3 абзаца). Тон: заботливый врач, без паники, информативно. Обращайся на "ты". Объясни возможную общую причину симптомов и дай советы.'),
        recommendedTourId: z.string().nullable().describe('ID идеального тура из списка, который будет безопасен и комфортен при таких симптомах. (Например, при боли в коленях — вода/сплавы). Если ничего нет, верни null.')
      }),
      prompt: `
        Ты — спортивный врач туристического клуба. Турист отметил следующие симптомы во время похода:
        \n${symptomsDetailed.join('\n')}
        
        Вот список актуальных туров нашего клуба:
        \n${JSON.stringify(toursContext)}
        
        Твоя задача:
        1. Сделай персональный разбор: как эти симптомы связаны, что они говорят о состоянии тела.
        2. Выбери из списка туров ОДИН, который идеально подойдет этому человеку прямо сейчас (щадящий для его симптомов). Обоснуй выбор.
      `
    });

    const recommendedTour = allTours.find(t => t.id === object.recommendedTourId) || null;

    return { success: true, analysis: object.analysis, tour: recommendedTour as Tour | null };
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
    if (!(await checkRateLimit())) {
      return { success: false, error: "Превышен лимит запросов к ИИ. Попробуйте через час." };
    }

    const allTours = await getTours();
    const toursContext = allTours.map(t => ({
      id: t.id, 
      title: t.title, 
      category: t.category?.title || 'Активный отдых',
      difficulty: t.difficulty, 
      location: t.location, 
      duration: t.duration
    }));

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: z.object({
        analysis: z.string().describe('Глубокий разбор. Структура: "Что я вижу", "Твой инсайт", "Вопрос на потом". Тон: тёплый, честный, как умный друг. Обращайся на "ты". Используй форматирование Markdown (**жирный**).'),
        recommendedTourId: z.string().nullable().describe('ID идеального тура для СЛЕДУЮЩЕГО шага на основе его рефлексии. Например, если он хочет больше тишины - дай спокойный тур, если хочет превзойти себя - дай сложный поход. Если нет подходящего, верни null.')
      }),
      prompt: `
        Ты — психолог, работающий с опытом природных путешествий. Человек вернулся из похода и написал рефлексию:
        \n${answersText}
        
        Вот список актуальных туров нашего клуба:
        \n${JSON.stringify(toursContext)}
        
        Твоя задача:
        1. Сделай персональный анализ его опыта. Что в нем проявилось? Какой главный вывод он может забрать с собой?
        2. Выбери из списка туров ОДИН идеальный тур для его следующего приключения. Обоснуй выбор, опираясь на его инсайты.
      `
    });

    const recommendedTour = allTours.find(t => t.id === object.recommendedTourId) || null;

    return { success: true, analysis: object.analysis, tour: recommendedTour as Tour | null };
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
    if (!(await checkRateLimit())) {
      return { success: false, error: "Превышен лимит запросов к ИИ. Попробуйте через час." };
    }

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: z.object({
        summaryTitle: z.string(),
        psychologicalPortrait: z.string(),
        mainInsight: z.string(),
        advice: z.string()
      }),
      prompt: `Проведи глубокий психологический синтез профиля туриста:
        - Страхи: ${profile.fears?.length ? profile.fears.join(', ') : 'Не указаны'}
        - Физика: ${profile.physicalLevel || 'Не указана'}
        - Тело: ${profile.bodySymptoms?.length ? profile.bodySymptoms.join(', ') : 'Жалоб нет'}
        - Игровой архетип (Тотем/Психотип/Навыки): ${profile.touristType || 'Не определен'}
        
        Дай портрет личности, один мощный инсайт и совет по росту. Учитывай его игровой архетип (если он есть) как метафору его характера. Туры не предлагай.`
    });

    return { success: true, ...object };
  } catch (e) {
    console.error("AI Full Profile Error:", e);
    return { success: false, error: "Ошибка синтеза профиля" };
  }
}