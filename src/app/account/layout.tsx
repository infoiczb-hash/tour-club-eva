import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AccountNav from '@/features/account/components/AccountNav';

// Загружаем профиль участника — используется во всех дочерних страницах
export async function getAccountProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });

  return profile;
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware уже редиректит, но дублируем для надёжности
  if (!user) {
    redirect('/login?next=/account');
  }

  // Если профиль ещё не создан (первый вход до завершения link-profile)
  // — создаём минимальный профиль здесь
  let profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    const phone = user.phone ?? '';
    profile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
        phone,
        level: 'Первопроходец',
      },
    });

    // Привязываем исторические брони если есть телефон
    if (phone) {
      await prisma.booking.updateMany({
        where: { phone, memberId: null },
        data: { memberId: profile.id },
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Навигация кабинета */}
      <AccountNav
        profile={{
          name: profile.name,
          level: profile.level,
          totalTours: profile.totalTours,
        }}
      />

      {/* Контент страницы */}
      <main className="container mx-auto px-4 pt-6 pb-20 max-w-5xl">
        {children}
      </main>

    </div>
  );
}
