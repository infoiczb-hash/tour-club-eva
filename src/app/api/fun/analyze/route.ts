// src/app/api/fun/analyze/route.ts
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getTours } from '@/features/tours/api';
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
    if (userLimit.count >= LIMIT) return false; 
    
    userLimit.count += 1;
    return true;
  } catch (e) {
    return true; 
  }
}

// ==========================================
// СВЕРХЛЕГКИЙ КОНТЕКСТ ДЛЯ ИИ
// ==========================================
async function getLiteToursContext() {
  const allTours = await getTours();
  return allTours.slice(0, 10).map(t => ({ id: t.id, title: t.title }));
}

// ==========================================
// ГЛАВНЫЙ POST ОБРАБОТЧИК
// ==========================================
export async function POST(req: Request) {
  // 1. Проверяем лимиты
  if (!(await checkRateLimit())) {
    return new Response(JSON.stringify({ error: "Превышен лимит запросов к ИИ." }), { status: 429 });
  }

  // 2. Получаем тип квиза и его данные
  const { type, payload } = await req.json();

  let schema: z.ZodType<any>;
  let prompt = '';

  // Схема по умолчанию для 4 из 5 квизов (Текст + ID тура)
  const baseQuizSchema = z.object({
    analysis: z.string().describe('Развернутый ответ ИИ.'),
    recommendedTourId: z.string().nullable().describe('ID подходящего тура из списка.')
  });

  // 3. Распределитель (Switch) логики в зависимости от квиза
  switch (type) {
    case 'fears': {
      const liteContext = await getLiteToursContext();
      schema = baseQuizSchema;
      prompt = `
        Ты — туристический психолог. Клиент боится: \n${payload.fearsDetailed?.join('\n')}
        Туры клуба: \n${JSON.stringify(liteContext)}
        Сделай глубокий психологический разбор (2-3 абзаца, эмпатично, на "ты") и выбери 1 подходящий тур по ID.
      `;
      break;
    }

    case 'physical': {
      const liteContext = await getLiteToursContext();
      schema = baseQuizSchema;
      prompt = `
        Уровень формы: "${payload.levelTitle}" (${payload.levelSummary}).
        Ответы: \n${payload.answersText}
        Туры клуба: \n${JSON.stringify(liteContext)}
        Сделай анализ формы (2-3 абзаца, тон: спортивный врач, на "ты") и выбери 1 тур по ID.
      `;
      break;
    }

    case 'body-signals': {
      const liteContext = await getLiteToursContext();
      schema = baseQuizSchema;
      prompt = `
        Симптомы в походе: \n${payload.symptomsDetailed?.join('\n')}
        Туры: \n${JSON.stringify(liteContext)}
        Сделай разбор симптомов (2-3 абзаца, тон: врач, без паники) и выбери 1 щадящий тур по ID.
      `;
      break;
    }

    case 'debrief': {
      const liteContext = await getLiteToursContext();
      schema = baseQuizSchema;
      prompt = `
        Рефлексия туриста: \n${payload.answersText}
        Туры: \n${JSON.stringify(liteContext)}
        Дай теплый анализ опыта (инсайты) и выбери 1 следующий тур по ID.
      `;
      break;
    }

   case 'full-profile': {
      // Специфичная схема для финального разбора профиля
      schema = z.object({
        summaryTitle: z.string(),
        psychologicalPortrait: z.string(),
        mainInsight: z.string(),
        advice: z.string()
      });
      prompt = `
        Синтез профиля:
        - Страхи: ${payload.profile?.fears?.length ? payload.profile.fears.join(', ') : 'Нет'}
        - Физика: ${payload.profile?.physicalLevel || 'Нет'}
        - Тело: ${payload.profile?.bodySymptoms?.length ? payload.profile.bodySymptoms.join(', ') : 'Нет'}
        - Архетип: ${payload.profile?.touristType || 'Нет'}
        
        Дай портрет личности, инсайт и совет по росту.
      `;
      break;
    }

    default:
      return new Response(JSON.stringify({ error: "Неизвестный тип квиза" }), { status: 400 });
  } // <--- ВОТ ЗДЕСЬ ЗАКАНЧИВАЕТСЯ SWITCH

  // 👇 ДОБАВЛЯЕМ ВОТ ЭТОТ БЛОК 👇
  if (schema === baseQuizSchema) {
    prompt += `\n\nВАЖНОЕ ТРЕБОВАНИЕ К JSON: Ключ "analysis" ДОЛЖЕН быть самым первым ключом в генерируемом объекте. Это критически важно для потоковой передачи на клиент. Ключ "recommendedTourId" генерируй в самом конце.`;
  }
  // 👆 КОНЕЦ ВСТАВКИ 👆

  // 4. Запускаем магию Gemini
  const result = await streamObject({
    model: google('gemini-1.5-flash'),
    schema,
    prompt,
  });

  // 5. Возвращаем поток клиенту
  return result.toTextStreamResponse();
}