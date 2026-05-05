'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Wallet, Tent, Map, Moon,
  ChevronDown, Star, FlaskConical, Gift, Mountain, Bell, Info
} from 'lucide-react';

import VirtualCard from '@/features/account/components/VirtualCard';
import BookingCard from '@/features/account/components/BookingCard';
import AchievementsBox from '@/features/account/components/AchievementsBox';
import ReferralCard from '@/features/account/components/ReferralCard';

interface DashboardClientProps {
  profile: any;
  promoCode: any;
  upcomingBookings: any[];
  unreadCount: number;
  stats: {
    totalTours: number;
    totalKm: number;
    balance: number;
    totalNights: number;
  };
  achievements: any;
}

export default function DashboardClient({
  profile,
  promoCode,
  upcomingBookings,
  unreadCount,
  stats,
  achievements
}: DashboardClientProps) {
  const displayName = profile.name ?? 'Участник';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 pb-16 px-4 md:px-0">
      {/* 1. ШАПКА: Читаемый текст и акценты */}
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
          Личный кабинет
        </h1>
        <p className="text-slate-200 text-base md:text-lg font-medium opacity-90">
          Управляйте своими путешествиями и привилегиями
        </p>
      </header>

      {/* 2. ГЛАВНЫЙ ЭКРАН: Сетка 2 колонки */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА: Виртуальная карта */}
        <div className="w-full xl:w-5/12 shrink-0">
          <VirtualCard 
            name={displayName} 
            level={profile.level} 
            totalTours={stats.totalTours}
            totalKm={stats.totalKm}      
            memberId={profile.id}
            // Информацию о туре и листе ожидания убрали согласно стратегии
          />
        </div>

        {/* ПРАВАЯ КОЛОНКА: Восстановленные блоки */}
        <div className="w-full xl:w-7/12 flex flex-col gap-6">
          
          {/* Статистика: "Вы прошли с нами" */}
          <section className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-6 uppercase tracking-wider flex items-center gap-2">
              <Mountain size={18} className="text-teal-400" /> Вы прошли с нами
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Tent size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white leading-none">{stats.totalTours}</div>
                  <div className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-2">Туров</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                  <Map size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white leading-none">{stats.totalKm}</div>
                  <div className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-2">Км</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Moon size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white leading-none">{stats.totalNights}</div>
                  <div className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-2">Ночей</div>
                </div>
              </div>
            </div>
          </section>

          {/* Блок уведомлений: Заметный и функциональный */}
          <Link 
            href="/account/notifications" 
            className="group flex items-center justify-between p-6 bg-slate-900 border border-slate-700/50 rounded-3xl hover:border-teal-500/50 hover:bg-slate-800/50 transition-all shadow-lg"
          >
            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center w-14 h-14 bg-teal-500/10 text-teal-400 rounded-2xl group-hover:bg-teal-500 group-hover:text-slate-900 transition-all duration-300 shadow-inner">
                <Bell size={28} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-red-500 border-2 border-slate-900 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Уведомления</h3>
                <p className="text-sm text-slate-300 font-medium">
                  {unreadCount > 0 ? `У вас ${unreadCount} новых сообщений` : 'История ваших пушей'}
                </p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
          </Link>

          {/* Баланс и Бонусы */}
          <div className="bg-slate-900 border border-amber-500/20 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-6 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                  <Wallet size={28} />
                </div>
                <div>
                  <h3 className="text-amber-500 font-bold text-xs uppercase tracking-widest mb-1">Ваш баланс</h3>
                  <div className="text-3xl md:text-4xl font-black text-white flex items-baseline gap-2">
                    {stats.balance} <span className="text-xl font-bold text-amber-500/50">₽</span>
                  </div>
                </div>
              </div>
            </div>

            <details className="group border-t border-amber-500/10">
              <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors list-none">
                <span className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={16} /> Как получать бонусы?
                </span>
                <ChevronDown size={20} className="text-slate-300 group-open:rotate-180 transition-transform duration-300" />
              </summary>
              
              <div className="px-5 pb-6 pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4 bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                  <Star size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Отзывы о турах</p>
                    <p className="text-sm text-slate-200 leading-relaxed">Получите +10 ₽ за отзыв на сайте после прохождения маршрута.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                  <FlaskConical size={20} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Fan-сектор</p>
                    <p className="text-sm text-slate-200 leading-relaxed">Проходите веселые тесты в личном кабинете и получайте +1 ₽ за каждый.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                  <Gift size={20} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Пригласить друга</p>
                    <p className="text-sm text-slate-200 leading-relaxed">Дайте другу промокод на первый тур, у которого нет личного кабинета. После его первой поездки вы получите бонус!</p>
                  </div>
                </div>
              </div>
            </details>
          </div>

        </div>
      </div>

      {/* 3. НИЖНИЕ БЛОКИ */}
      <section className="space-y-10">
        {/* Достижения */}
        <div className="pt-4">
          <AchievementsBox stats={achievements} />
        </div>

        {/* Реферальная программа */}
        <ReferralCard 
          promoCode={promoCode.code} 
          rewardAmount={promoCode.reward} 
          friendReward={promoCode.discount} 
        />

        {/* Брони */}
        <div className="space-y-6 pt-6 border-t border-white/5">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            Предстоящие поездки
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-10 text-center">
              <p className="text-slate-200 text-lg mb-6">У вас пока нет запланированных туров</p>
              <Link href="/tour" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-8 py-4 rounded-2xl transition-all shadow-lg">
                Выбрать приключение <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {upcomingBookings.map(booking => {
                const guestsCount = (booking.ticketsAdult || 0) + (booking.ticketsChild || 0) + (booking.ticketsMember || 0) + ((booking.ticketsFamily || 0) * 3);
                return (
                  <BookingCard 
                    key={booking.id} 
                    bookingId={booking.id}
                    booking={{ ...booking, guestsCount }} 
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}