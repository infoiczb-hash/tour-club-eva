import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { env } from "@/lib/env";

// Инициализация Redis клиента через наши валидированные переменные
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Базовый лимитер: 8 запросов в минуту (Sliding Window)
// Подходит для форм обратной связи и бронирования
export const basicRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(8, "1 m"),
  analytics: true,
  prefix: "evatur:ratelimit:basic",
});

// Админский лимитер: 15 запросов в минуту (Sliding Window)
// Подходит для AI-генерации и других тяжелых задач в админке
export const adminRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(15, "1 m"),
  analytics: true,
  prefix: "evatur:ratelimit:admin",
});

/**
 * Вспомогательная функция для получения IP пользователя.
 * Адаптировано под Next.js 16+ (headers() является асинхронным).
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  
  // x-forwarded-for может содержать цепочку IP. Нам нужен первый (исходный IP клиента)
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  // Fallback для некоторых прокси или локальной разработки
  return headersList.get("x-real-ip") || "127.0.0.1";
}