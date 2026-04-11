import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AccountNav from '@/features/account/components/AccountNav';
import OnboardingModal from '@/features/account/components/OnboardingModal';
import type { Metadata } from 'next';
import { MemberProfile } from '@prisma/client';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  // 1. Пытаемся найти профиль
  let profile: MemberProfile | null = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });

  // 2. Если профиля нет — это первый вход (Омниканальная регистрация).
  if (!profile) {
    // Строго заменяем пустые строки на null для защиты БД от ошибки Unique Constraint
    const phone = user.phone || null;
    const email = user.email || null;
    
    // Создаем профиль, сохраняя все доступные данные из провайдера (Google/TG)
    profile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
        phone, 
        email, 
        level: 'Первопроходец',
      },
    });

    // 3. УМНАЯ ПРИВЯЗКА (Smart Linking)
    // А) Ищем старые брони по номеру телефона (если он есть)
    if (phone) {
      await prisma.booking.updateMany({
        where: { phone, memberId: null },
        data: { memberId: profile.id },
      });
    }

    // Б) Ищем старые брони по Email (спасает тех, кто бронировал по почте, а зашел через Google)
    if (email) {
      await prisma.booking.updateMany({
        where: { email, memberId: null },
        data: { memberId: profile.id },
      });
    }
  }

  // Пока оставляем OnboardingModal для тех, у кого нет телефона, 
  // но теперь сама регистрация и вход будут работать на 100% стабильно.
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

      {/* Главный контент */}
      <main 
        className="flex-1 w-full max-w-5xl mx-auto 
                   px-4 md:px-6 lg:px-8 
                   pt-24 md:pt-28 lg:pt-32 
                   pb-20 md:pb-12 
                   md:ml-64 
                   relative z-10 transition-all duration-300"
      >
        {children}
        
        {/* Модалка появится, если телефон всё-таки нужен для походов */}
        {needsOnboarding && <OnboardingModal />}
      </main>

    </div>
  );
}