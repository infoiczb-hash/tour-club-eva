import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import SettingsForm from '@/features/account/components/SettingsForm';

export const dynamic = 'force-dynamic';
export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/account/settings');

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id }
  });

  if (!profile) redirect('/login?next=/account/settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Настройки профиля</h1>
        <p className="text-sm text-ui-muted">Ваша походная карточка. Заполните её один раз, чтобы мы учитывали это во всех турах.</p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  );
}