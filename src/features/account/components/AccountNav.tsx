'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Ticket, 
  History, 
  Heart, 
  Settings, 
  LogOut,
  Compass
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AccountNavProps = {
  profile: {
    name: string | null;
    level: string;
    totalTours: number;
  };
};

const NAV_LINKS = [
  { name: 'Дашборд', href: '/account/dashboard', icon: LayoutDashboard },
  { name: 'Мои туры', href: '/account/bookings',  icon: Ticket },
  { name: 'История', href: '/account/history',   icon: History },
  { name: 'Вишлист', href: '/account/wishlist',  icon: Heart },
  // 👇 ИСПРАВЛЕНО: правильный путь до настроек
  { name: 'Настройки', href: '/account/settings',   icon: Settings }, 
];

export default function AccountNav({ profile }: AccountNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* ─── ДЕСКТОПНАЯ ВЕРСИЯ (Левый сайдбар) ─────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-slate-950/80 backdrop-blur-xl border-r border-white/5">
        
        {/* Логотип и мини-профиль */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-teal-400 transition-colors mb-6">
            <Compass size={28} className="text-teal-500" />
            <span className="font-black tracking-widest uppercase text-lg">EVA</span>
          </Link>
          
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              {profile.name || 'Турист'}
            </p>
            <p className="text-xs text-teal-400 font-medium">
              {profile.level} · {profile.totalTours} туров
            </p>
          </div>
        </div>

        {/* Ссылки навигации */}
        <nav className="flex-1 flex flex-col gap-2 p-4">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-400' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Кнопка выхода */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>


      {/* ─── МОБИЛЬНАЯ ВЕРСИЯ (Нижний свайп-бар) ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center overflow-x-auto snap-x snap-mandatory overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-2 gap-1">
          
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`snap-start shrink-0 flex flex-col items-center justify-center w-[72px] h-14 rounded-2xl transition-all relative ${
                  isActive 
                    ? 'text-teal-400' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-teal-500/10 rounded-2xl -z-10 animate-in fade-in zoom-in duration-300" />
                )}
                <Icon size={20} className={isActive ? 'mb-1' : 'mb-1 opacity-80'} />
                <span className="text-[10px] font-bold tracking-wide">
                  {link.name}
                </span>
              </Link>
            );
          })}

          <div className="shrink-0 w-px h-8 bg-white/10 mx-1" />

          <button
            onClick={handleLogout}
            className="snap-start shrink-0 flex flex-col items-center justify-center w-[72px] h-14 rounded-2xl text-slate-600 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} className="mb-1" />
            <span className="text-[10px] font-bold tracking-wide">
              Выход
            </span>
          </button>
          
          <div className="shrink-0 w-2" />
        </div>
      </nav>
    </>
  );
}