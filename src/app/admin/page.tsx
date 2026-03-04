import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAllTours } from '@/features/tours/api';
import AdminDashboard from '@/features/admin/components/AdminDashboard';

export const metadata = {
  title: 'Админка | ЭВА Турклуб',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Серверная проверка сессии
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const tours = await getAllTours();

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminDashboard initialTours={tours} />
    </div>
  );
}
