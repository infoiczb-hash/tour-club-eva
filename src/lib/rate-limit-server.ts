import { NextResponse } from 'next/server';
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';

// ─── Для Route Handlers (/api/*) ────────────────────────────────────────────
// Использование: export const GET = withRateLimitRoute(async (req) => { ... })

export function withRateLimitRoute<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const ip = await getClientIp();
      const { success } = await basicRateLimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: 'Слишком много запросов. Пожалуйста, подождите минуту.' },
          { status: 429 }
        );
      }

      return await handler(...args);
    } catch (error) {
      console.error('Rate limit execution error', error);
      return await handler(...args);
    }
  }) as T;
}

// ─── Для Server Actions ──────────────────────────────────────────────────────
// Использование: export const myAction = withRateLimit(async (data) => { ... })

type RateLimitError = { success: false; error: string };

export function withRateLimit<TArgs extends unknown[], TReturn extends object>(
  action: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn | RateLimitError> {
  return async (...args: TArgs): Promise<TReturn | RateLimitError> => {
    try {
      const ip = await getClientIp();
      const { success } = await basicRateLimit.limit(ip);

      if (!success) {
        return {
          success: false,
          error: 'Слишком много запросов. Пожалуйста, подождите минуту.',
        };
      }

      return await action(...args);
    } catch (error) {
      console.error('Rate limit execution error', error);
      // При падении Redis пропускаем запрос, чтобы не ломать сайт
      return await action(...args);
    }
  };
}