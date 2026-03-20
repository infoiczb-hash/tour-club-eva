// src/app/account/layout.tsx
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AccountNav from '@/features/account/components/AccountNav';
// 👇 1. Импортируем наш новый компонент
import OnboardingModal from '@/features/account/components/OnboardingModal';

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

  if (!user) {
    redirect('/login?next=/account');
  }

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

    if (phone) {
      await prisma.booking.updateMany({
        where: { phone, memberId: null },
        data: { memberId: profile.id },
      });
    }
  }

  // 👇 2. Проверяем, нужен ли онбординг (если телефон пустой)
  const needsOnboarding = !profile.phone;

  return (
    <div className="min-h-screen bg-slate-950 relative">

      {/* Навигация кабинета */}
      <AccountNav
        profile={{
          name: profile.name,
          level: profile.level,
          totalTours: profile.totalTours,
        }}
      />

      {/* Контент страницы */}
      <main className="container mx-auto px-4 pt-6 pb-20 max-w-5xl relative z-10">
        {children}
        
        {/* 👇 3. Блокируем ЛК, если нет телефона */}
        {needsOnboarding && <OnboardingModal />}
      </main>

    </div>
  );
}