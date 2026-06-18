"use client";

import dynamic from 'next/dynamic';
import { SettingsProfileProps } from '@/features/account/components/SettingsForm';

// Скелетон переехал сюда
function SettingsFormSkeleton() {
  return (
    <div className="space-y-6 pb-28 md:pb-12 animate-pulse">
      <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-[450px]" />
        <div className="space-y-6">
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-48" />
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-48" />
        </div>
      </div>
    </div>
  );
}

// Теперь ssr: false легален, так как мы находимся в "use client" файле
const SettingsFormLazy = dynamic(() => import('@/features/account/components/SettingsForm'), {
  ssr: false,
  loading: () => <SettingsFormSkeleton />,
});

export default function SettingsFormWrapper({ profile }: { profile: SettingsProfileProps }) {
  return <SettingsFormLazy profile={profile} />;
}