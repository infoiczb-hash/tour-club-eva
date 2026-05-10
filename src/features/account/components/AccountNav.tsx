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
  Compass,
  FlaskConical,
  Bell, ShoppingBag
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
  { name: 'Уведомления', href: '/account/notifications', icon: Bell }, // 🔥 ДОБАВИЛИ ПУНКТ МЕНЮ
  // Удалили 'Мои туры' (/account/bookings)
  { name: 'Мои поездки', href: '/account/history', icon: History }, // Переименовали
  { name: 'Вишлист', href: '/account/wishlist',  icon: Heart },
  { name: 'Мои тесты', href: '/account/tests',  icon: FlaskConical },
  { name: 'Настройки', href: '/account/settings',   icon: Settings }, 
  { name:'Магазин',  href: '/account/shop', icon: ShoppingBag }
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
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-ui-bg/90 backdrop-blur-xl border-r border-ui-border">
        
        {/* Логотип и мини-профиль */}
        <div className="p-6 border-b border-ui-border">
          <Link href="/" className="flex items-center gap-2 text-ui-text hover:text-ui-accent transition-colors mb-6">
            <Compass size={28} className="text-ui-accent" />
            <span className="font-black tracking-widest uppercase text-lg">EVA</span>
          </Link>
          
          <div>
            <p className="text-sm font-bold text-ui-text leading-tight">
              {profile.name || 'Турист'}
            </p>
            <p className="text-xs text-ui-accent font-medium">
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
                    ? 'bg-ui-accent/10 text-ui-accent' 
                    : 'text-ui-muted hover:text-ui-text hover:bg-ui-border/50'
                }`}
              >
                <Icon size={18} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        
       {/* Кнопка выхода */}
        <div className="p-4 border-t border-ui-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-ui-muted hover:text-ui-danger hover:bg-ui-danger/10 transition-all"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* ─── МОБИЛЬНАЯ ВЕРСИЯ (Нижний свайп-бар) ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ui-bg/95 backdrop-blur-xl border-t border-ui-border pb-safe">
        <div className="flex items-center overflow-x-auto snap-x snap-mandatory overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-2 gap-1">
          
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`snap-start shrink-0 flex flex-col items-center justify-center w-[100px] h-14 rounded-2xl transition-all relative ${
                  isActive 
                    ? 'text-ui-accent' 
                    : 'text-ui-muted hover:text-ui-text'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-ui-accent/10 rounded-2xl -z-10 animate-in fade-in zoom-in duration-300" />
                )}
                <Icon size={20} className={isActive ? 'mb-1' : 'mb-1 opacity-80'} />
                <span className="text-xs font-bold tracking-wide truncate w-full text-center px-1">
  {link.name}
</span>
              </Link>
            );
          })}

          <div className="shrink-0 w-px h-8 bg-ui-border mx-1" />

          <button
            onClick={handleLogout}
            className="snap-start shrink-0 flex flex-col items-center justify-center w-[72px] h-14 rounded-2xl text-ui-muted hover:text-ui-danger transition-colors"
          >
            <LogOut size={20} className="mb-1" />
            <span className="text-xs font-bold tracking-wide">
  Выход
</span>
          </button>
          
          <div className="shrink-0 w-2" />
        </div>
      </nav>
    </>
  );
}