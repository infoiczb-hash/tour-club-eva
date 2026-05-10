import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma'; // Добавили импорт Prisma для проверки базы

/**
 * Кэшированный запрос пользователя для Server Components.
 * React cache() гарантирует, что сетевой запрос к Supabase выполнится ОДИН раз
 * за цикл рендера страницы (например, в Header и Footer).
 */
export const getServerUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

/**
 * Проверяет авторизацию в Server Actions.
 * Бросает Error('Unauthorized') если пользователь не залогинен.
 * Использовать в начале каждого write-action.
 */
export async function requireAuth() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
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
      // 1. Проверяем базовую авторизацию (и сразу получаем user.id)
      const user = await requireAuth();

      // 2. Достаем профиль из базы и проверяем роль
      // ВНИМАНИЕ: Убедись, что в Prisma (модель MemberProfile) у тебя есть поле role: String!
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { role: true } 
      });

      if (!profile || profile.role !== 'admin') {
        console.warn(`[SECURITY] Попытка взлома админки! Пользователь: ${user.id}`);
        return { success: false, error: 'Нет прав доступа. Действие заблокировано.' };
      }

      // 3. Если всё ок - выполняем сам экшен
      return await action(...args);
} catch (error: unknown) {
      console.error('Admin Auth Error:', error);
      
      // Сначала проверяем, что это объект Error, а затем читаем сообщение
      if (error instanceof Error && error.message === 'Unauthorized') {
        return { success: false, error: 'Пожалуйста, авторизуйтесь' };
      }
      
      return { success: false, error: 'Ошибка проверки прав доступа' };
    }
  };
}