import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AccountNav from '@/features/account/components/AccountNav';
import OnboardingModal from '@/features/account/components/OnboardingModal';
import type { Metadata } from 'next';
import type { MemberProfile } from '@prisma/client';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  // 1. Пытаемся найти профиль
  let profile: MemberProfile | null = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });

  // 2. Если профиля нет — это первый вход. Создаем профиль и привязываем данные.
  if (!profile) {
    const phone = user.phone ?? '';
    
    profile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
        phone,
        level: 'Первопроходец',
      },
    });

    // Безопасно переносим старые брони только в момент регистрации
    if (phone) {
      await prisma.booking.updateMany({
        where: { phone, memberId: null },
        data: { memberId: profile.id },
      });
    }
  }

  const needsOnboarding = !profile.phone;

  return (
    <div className="min-h-screen bg-slate-950 relative flex">
      <AccountNav
        profile={{
          name: profile.name,
          level: profile.level,
          totalTours: profile.totalTours,
        }}
      />

      {/* ✅ Главный контент с улучшенными, гибкими классами Tailwind */}
      <main 
        className="flex-1 w-full max-w-5xl mx-auto 
                   px-4 md:px-6 lg:px-8 
                   pt-24 md:pt-28 lg:pt-32 
                   pb-20 md:pb-12 
                   md:ml-64 
                   relative z-10 transition-all duration-300"
      >
        {children}
        
        {/* Показываем онбординг только если нет телефона */}
        {needsOnboarding && <OnboardingModal />}
      </main>
    </div>
  );
}