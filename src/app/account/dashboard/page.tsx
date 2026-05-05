import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDashboardData } from '@/features/account/api';
import DashboardClient from './DashboardClient';

//   Оставляем настройки динамического рендеринга из оригинала
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  // 1. Проверка сессии на стороне сервера
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Если не авторизован — редирект
  if (!user) {
    redirect('/login?next=/account/dashboard');
  }

  // 3. Запрос данных через новый API-слой (использует React.cache)
  const data = await getDashboardData(user.id);

  // 4. Обработка случая, если профиль не найден
  if (!data) {
    redirect('/login');
  }

  // 5. Передача всех данных в Client Component
  return <DashboardClient {...data} />;
}