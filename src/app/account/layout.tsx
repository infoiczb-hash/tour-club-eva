import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AccountNav from '@/features/account/components/AccountNav';
import OnboardingModal from '@/features/account/components/OnboardingModal';
import type { Metadata } from 'next';

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

      {/* Главный контент аккаунта с надёжным отступом от Header */}
      <main 
        className="flex-1 w-full max-w-5xl mx-auto 
                   px-4 md:px-6 lg:px-8 
                   pt-[88px] md:pt-[108px] lg:pt-[118px] 
                   pb-20 md:pb-12 
                   md:ml-64 
                   relative z-10 transition-all duration-300"
      >
        {children}
        
        {needsOnboarding && <OnboardingModal />}
      </main>

    </div>
  );
}