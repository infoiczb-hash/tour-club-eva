import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth';
import dynamic from 'next/dynamic';

// 1. Ленивая загрузка тяжелой формы. 
// ssr: false позволяет серверу не ждать сборки формы и выдать LCP-элемент (H1) мгновенно.
const SettingsForm = dynamic(() => import('@/features/account/components/SettingsForm'), {
  ssr: false,
  loading: () => <SettingsFormSkeleton />,
});

export default async function SettingsPage() {
  // 2. Используем кэшированное получение юзера
  const user = await getServerUser();
  
  if (!user) redirect('/login?next=/account/settings');

  // 3. Оптимизированный запрос к БД (тянем только нужное для SettingsForm)
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
        tgChatId: true, // Нужен для проверки коннекта к боту
    }
  });

  if (!profile) redirect('/login?next=/account/settings');

  return (
    <div className="space-y-6">
      {/* ── LCP ЭЛЕМЕНТ ──────────────────────────────────────────────
          Рендерится на сервере и улетает в браузер первым чанком. 
          Пользователь видит заголовок за ~100-200мс.
      */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Настройки профиля</h1>
        <p className="text-sm text-slate-400">Ваша походная карточка. Заполните её один раз, чтобы мы учитывали это во всех турах.</p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  );
}

// 4. Скелетон, имитирующий структуру SettingsForm
function SettingsFormSkeleton() {
  return (
    <div className="space-y-6 pb-28 md:pb-12 animate-pulse">
      {/* Telegram-блок */}
      <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-24" />
      
      {/* Две колонки (как в SettingsForm) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая колонка: Основные данные */}
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-[450px]" />
        
        {/* Правая колонка: Параметры и снаряжение */}
        <div className="space-y-6">
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-48" />
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-48" />
        </div>
      </div>
    </div>
  );
}