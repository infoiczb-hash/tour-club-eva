"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Bell } from 'lucide-react';

import VirtualCard from '@/features/account/components/VirtualCard';
import BookingCard from '@/features/account/components/BookingCard';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';
import AchievementsBox from '@/features/account/components/AchievementsBox';
import ReferralCard from '@/features/account/components/ReferralCard';

import type { DashboardData } from '@/features/account/api';

export default function DashboardClient({
  profile,
  promoCode,
  upcomingBookings,
  waitlists,
  unreadCount,
  stats,
  achievements
}: DashboardData) {
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Приветствие и Уведомления */}
      <div className="flex items-center justify-between px-2 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            Привет, {profile.name?.split(' ')[0] || 'Путешественник'}!
          </h1>
          <p className="text-ui-muted text-sm mt-1 font-medium">
            Добро пожаловать в личный кабинет
          </p>
        </div>
        
        <Link 
          href="/account/notifications" 
          className="relative p-3 bg-ui-panel rounded-full border border-ui-border hover:bg-white/10 transition-colors"
        >
          <Bell size={20} className="text-ui-muted" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-950 animate-pulse" />
          )}
        </Link>
      </div>
      
{/* 2. Верхние карточки: Карта участника и Достижения */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VirtualCard 
          name={profile.name} 
          level={profile.level} 
          totalTours={stats.totalTours} 
          totalKm={stats.totalKm} 
          memberId={profile.id} 
        />
        <AchievementsBox stats={achievements} />
      </div>

      {/* 3. Лист ожидания */}
      {waitlists.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-ui-border px-2 md:px-0">
          <h2 className="text-sm font-bold text-ui-muted uppercase tracking-wider">
            Лист ожидания ({waitlists.length})
          </h2>
          <div className="space-y-3">
            {waitlists.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4 bg-ui-panel/50 border border-ui-border rounded-2xl transition-colors hover:bg-ui-panel">
                <div>
                  <p className="text-white font-bold leading-tight">{w.tour.title}</p>
                  {w.tourDate && (
                    <p className="text-[12px] text-teal-400 font-bold mt-1 uppercase tracking-widest">
                      {new Date(w.tourDate.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
                <div className="shrink-0 ml-4">
                  <CancelWaitlistButton id={w.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Предстоящие поездки */}
      <section className="space-y-6 pt-4 border-t border-ui-border px-2 md:px-0">
        <h2 className="text-sm font-bold text-ui-muted uppercase tracking-wider">
          Предстоящие поездки
        </h2>

        {upcomingBookings.length === 0 ? (
          <div className="bg-ui-panel/60 border border-ui-border rounded-3xl p-8 text-center flex flex-col items-center">
            <p className="text-ui-muted text-sm mb-5">У вас пока нет запланированных туров</p>
            <Link 
              href="/tour" 
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] active:scale-[0.98]"
            >
              Выбрать приключение <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingBookings.map(booking => (
              // @ts-ignore - Временно игнорируем ошибку типов пропсов до обновления BookingCard
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Реферальная программа / Промокод */}
      <section className="pt-6 border-t border-ui-border px-2 md:px-0">
        <h2 className="text-sm font-bold text-ui-muted uppercase tracking-wider mb-4">
          Бонусная программа
        </h2>
        <ReferralCard promoCode={promoCode} />
      </section>

    </div>
  );
}