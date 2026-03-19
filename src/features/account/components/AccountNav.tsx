'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, Calendar, Clock, Heart,
  FlaskConical, LogOut, ChevronRight, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

// ─── типы ───────────────────────────────────────────────────────────
interface AccountNavProps {
  profile: {
    name: string | null;
    level: string;
    totalTours: number;
  };
}

// ─── пункты навигации ───────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/account/dashboard', label: 'Главная',   icon: LayoutDashboard },
  { href: '/account/bookings',  label: 'Брони',     icon: Calendar },
  { href: '/account/history',   label: 'История',   icon: Clock },
  { href: '/account/wishlist',  label: 'Вишлист',   icon: Heart },
  { href: '/account/tests',     label: 'Тесты',     icon: FlaskConical },
];

// ─── цвета уровней ──────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  'Первопроходец': 'text-teal-400 bg-teal-400/10',
  'Походник':      'text-green-400 bg-green-400/10',
  'Бывалый':       'text-blue-400 bg-blue-400/10',
  'Ветеран':       'text-purple-400 bg-purple-400/10',
  'Легенда клуба': 'text-amber-400 bg-amber-400/10',
};

// ─── компонент ──────────────────────────────────────────────────────
export default function AccountNav({ profile }: AccountNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const levelColor = LEVEL_COLORS[profile.level] ?? 'text-slate-400 bg-slate-400/10';
  const displayName = profile.name ?? 'Участник';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-slate-900 border-r border-white/5 z-40">

        {/* Логотип */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xs font-black tracking-widest text-teal-400 uppercase">
              ЭВА
            </span>
            <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
              Кабинет
            </span>
          </Link>
        </div>

        {/* Профиль */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* Аватар */}
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-teal-400">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', levelColor)}>
                {profile.level}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {profile.totalTours} {plural(profile.totalTours, 'тур', 'тура', 'туров')}
          </p>
        </div>

        {/* Навигация */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-teal-500/10 text-teal-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Выход */}
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>

      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">

          {/* Логотип */}
          <Link href="/" className="text-xs font-black tracking-widest text-teal-400 uppercase">
            ЭВА
          </Link>

          {/* Имя + уровень */}
          <div className="flex items-center gap-2">
            <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', levelColor)}>
              {profile.level}
            </span>
          </div>

          {/* Бургер */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Меню"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Mobile menu overlay ─────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={clsx(
          'md:hidden fixed top-[53px] left-0 right-0 z-30 bg-slate-900 border-b border-white/5 transition-all duration-300',
          mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        {/* Профиль */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <span className="text-sm font-bold text-teal-400">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{displayName}</p>
            <p className="text-xs text-slate-500">
              {profile.totalTours} {plural(profile.totalTours, 'тур', 'тура', 'туров')}
            </p>
          </div>
        </div>

        {/* Пункты */}
        <nav className="px-3 py-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-teal-500/10 text-teal-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Выход */}
        <div className="px-3 py-3 border-t border-white/5">
          <button
            onClick={() => { setMobileOpen(false); handleLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </div>

      {/* ── Отступ для десктоп sidebar ──────────────────────────── */}
      <div className="hidden md:block w-60 shrink-0" />

      {/* ── Отступ для мобильного хедера ────────────────────────── */}
      <div className="md:hidden h-[53px]" />
    </>
  );
}

// ─── склонение числительных ─────────────────────────────────────────
function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs >= 11 && abs <= 19) return many;
  if (mod === 1) return one;
  if (mod >= 2 && mod <= 4) return few;
  return many;
}
