import { createServerSupabaseClient } from '@/lib/supabase/server';

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