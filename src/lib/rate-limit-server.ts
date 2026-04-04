// src/lib/rate-limit-server.ts
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';

export function withRateLimit<TArgs extends any[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn | { success: false; error: string }> => {
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
       // В случае падения самого Redis, лучше пропустить запрос, чем "положить" сайт
       return await action(...args);
    }
  };
}