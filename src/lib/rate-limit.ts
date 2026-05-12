import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { env } from "@/lib/env";

// Инициализация Redis клиента
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// ====================== ОБЩИЕ ЛИМИТЕРЫ ======================

export const basicRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(8, "1 m"),
  analytics: true,
  prefix: "evatur:ratelimit:basic",
});

export const adminRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "1 m"),
  analytics: true,
  prefix: "evatur:ratelimit:admin",
});

// ====================== СПЕЦИАЛЬНЫЕ ЛИМИТЕРЫ ======================

/**
 * 5 броней в час с одного IP — для формы бронирования
 */
export const bookingIpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 m"),
  analytics: true,
  prefix: "evatur:ratelimit:booking:ip",
});

/**
 * 2 брони за 10 минут с одного номера телефона
 */
export const bookingPhoneRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "10 m"),
  analytics: true,
  prefix: "evatur:ratelimit:booking:phone",
});

/**
 * Вспомогательная функция для получения IP пользователя.
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  return headersList.get("x-real-ip") || "127.0.0.1";
}