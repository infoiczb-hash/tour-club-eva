import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ActorType } from '@prisma/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AuditConfig<TArgs extends unknown[]> {
  actionName: string;
  getTargetId?: (...args: TArgs) => string | undefined;
  sanitizeChanges?: (...args: TArgs) => unknown;
}

type ServerAction<TArgs extends unknown[], TReturn> = (...args: TArgs) => Promise<TReturn>;

/**
 * Higher-Order Function для логирования действий администраторов в Server Actions.
 * Сохраняет полную типизацию аргументов и возвращаемого значения исходного экшена.
 */
export function withAdminAudit<TArgs extends unknown[], TReturn>(
  config: AuditConfig<TArgs>
): (action: ServerAction<TArgs, TReturn>) => ServerAction<TArgs, TReturn> {
  return (action) => async (...args: TArgs): Promise<TReturn> => {
    // 1. Читаем контекст запроса ДО асинхронных операций экшена.
    // Это предотвращает ошибку потери контекста Next.js (Error: Invariant: headers() expects to have request storage)
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
    const userAgent = headersList.get('user-agent') || '';

    // 2. Выполняем оригинальную бизнес-логику (Server Action)
    const result = await action(...args);

    // 3. Формируем payload для лога, маскируем данные при необходимости
    const targetId = config.getTargetId ? config.getTargetId(...args) : undefined;
    let changesToLog: unknown = args;

    try {
      if (config.sanitizeChanges) {
        changesToLog = config.sanitizeChanges(...args);
      }
    } catch (sanitizeError) {
      console.error('[Audit Log] Error in sanitizeChanges:', sanitizeError);
      changesToLog = { error: 'Failed to sanitize changes' };
    }

    // 4. Запускаем асинхронное логирование.
    // Не блокируем возврат результата клиенту.
    Promise.resolve().then(async () => {
      try {
        // Мы вызываем Supabase Client здесь. Поскольку Server Action всё ещё "жив", 
        // пока выполняются все промисы внутри его скоупа, вызов cookies() внутри клиента отработает корректно.
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        await prisma.adminLog.create({
          data: {
            actorType: ActorType.ADMIN,
            adminId: user?.id || null,
            adminName: user?.user_metadata?.full_name || user?.email || null,
            action: config.actionName,
            targetId: targetId || null,
            // JSON.parse(JSON.stringify()) убирает undefined и несериализуемые объекты
            changes: changesToLog ? JSON.parse(JSON.stringify(changesToLog)) : null,
            ip,
            userAgent,
          },
        });
      } catch (error) {
        // Мы только логируем ошибку в консоль сервера, чтобы не "ронять" основное приложение
        // если вдруг БД логов недоступна
        console.error('[Audit Log Error]:', error);
      }
    });

    // 5. Моментально отдаем результат работы экшена клиенту
    return result;
  };
}

/**
 * Отдельная функция для использования внутри CRON-задач или системных webhooks,
 * где нет контекста запроса (IP, User-Agent) и администратора.
 */
export async function logSystemAction(
  actionName: string,
  payload?: { targetId?: string; changes?: unknown }
): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        actorType: ActorType.SYSTEM,
        action: actionName,
        targetId: payload?.targetId || null,
        changes: payload?.changes ? JSON.parse(JSON.stringify(payload.changes)) : null,
      },
    });
  } catch (error) {
    console.error('[System Audit Log Error]:', error);
  }
}