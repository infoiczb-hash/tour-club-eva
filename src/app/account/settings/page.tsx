import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth';
import SettingsFormWrapper from './SettingsFormWrapper'; // Подключаем нашу обертку

export default async function SettingsPage() {
  const user = await getServerUser();
  if (!user) redirect('/login?next=/account/settings');

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        telegram: true,
        instagram: true,
        viber: true,
        foodPref: true,
        shoeSize: true,
        clothesSize: true,
        lifeJacketSize: true,
        inventory: true,
        tgChatId: true, 
    }
  });

  if (!profile) redirect('/login?next=/account/settings');

  return (
    <div className="space-y-6">
      {/* ── LCP ЭЛЕМЕНТ (Остается мгновенным) ── */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Настройки профиля</h1>
        <p className="text-sm text-slate-400">Ваша походная карточка. Заполните её один раз, чтобы мы учитывали это во всех турах.</p>
      </div>

      {/* Вызываем клиентскую обертку, которая лениво подтянет саму форму */}
      <SettingsFormWrapper profile={profile} />
    </div>
  );
}