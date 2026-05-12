import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Кэшированный запрос пользователя для Server Components.
 * Гарантирует ОДИН запрос к Supabase за цикл рендера.
 */
export const getServerUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

/**
 * Проверяет авторизацию в Server Actions.
 * Бросает Error('Unauthorized'), если пользователь не залогинен.
 */
export async function requireAuth() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

/**
 * Функция валидации параметра next (Защита от Open Redirect).
 * Пропускает только относительные пути, начинающиеся с /
 *
 */
export function sanitizeNextUrl(next: string | null): string {
  const fallback = '/account/dashboard';
  if (!next) return fallback;
  
  // Запрещаем абсолютные URL (содержащие ://) и протокол-относительные (//)
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return fallback;
  }
  
  return next;
}

/**
 * 🔥 Обертка для защиты серверных экшенов админки (Защита от BAC).
 * Пропускает только пользователей с ролью 'admin'.
 */
export function withAdminAuth<TArgs extends any[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn | { success: false; error: string }> => {
    try {
      // 1. Проверяем базовую авторизацию
      const user = await requireAuth();

      // 2. Достаем профиль и проверяем роль admin
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { role: true } 
      });

      if (!profile || profile.role !== 'admin') {
        console.warn(`[SECURITY] Попытка несанкционированного доступа к админке! User: ${user.id}`);
        return { success: false, error: 'Нет прав доступа. Действие заблокировано.' };
      }

      // 3. Выполняем экшен
      return await action(...args);
    } catch (error: unknown) {
      console.error('Admin Auth Error:', error);
      
      if (error instanceof Error && error.message === 'Unauthorized') {
        return { success: false, error: 'Пожалуйста, авторизуйтесь' };
      }
      
      return { success: false, error: 'Ошибка проверки прав доступа' };
    }
  };
}