"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Users, ShieldCheck, Crown, Baby, Ticket, Check } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { clsx } from 'clsx';
import { useModalStore } from '@/shared/store/useModalStore';
import { joinWaitlistAction } from '@/features/account/actions/waitlist';
import { getMyProfileAction } from '@/features/account/actions/getProfile';

interface TourSidebarProps {
  tour: Tour;
}

export default function TourSidebar({ tour }: TourSidebarProps) {
  const openBookingModal = useModalStore((state) => state.openBookingModal);

  const { price, currency = 'RUB', priceOld, priceMember, priceChild, priceFamily } = tour;
  
  const currentPrice = Number(price || 0);
  const oldPriceVal = Number(priceOld || 0);

  const hasDiscount = oldPriceVal > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((oldPriceVal - currentPrice) / oldPriceVal) * 100) : 0;

  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  
  // Стейты для Листа ожидания
  const [waitlistName,     setWaitlistName]     = useState('');
  const [waitlistPhone,    setWaitlistPhone]    = useState('+373 ');
  const [waitlistLoading,  setWaitlistLoading]  = useState(false);
  const [waitlistDone,     setWaitlistDone]     = useState(false);
  const [waitlistError,    setWaitlistError]    = useState<string | null>(null);
  const [isProfileLoaded,  setIsProfileLoaded]  = useState(false);

  // ✅ Клиентская подгрузка профиля (безопасно для SSR)
  useEffect(() => {
    getMyProfileAction().then(p => {
      if (p) {
        setIsProfileLoaded(true);
        if (p.name) setWaitlistName(p.name);
        if (p.phone) setWaitlistPhone(p.phone);
      }
    }).catch(err => console.error("Ошибка загрузки профиля в сайдбаре:", err));
  }, []);

  // Умная логика доступности (Global Availability)
  const { isGlobalSoldOut, activeSpotsLeft } = useMemo(() => {
    if (!tour?.tourDates || tour.tourDates.length === 0) {
      const fallbackLeft = Number(tour?.spotsLeft || 0);
      return { isGlobalSoldOut: fallbackLeft <= 0, activeSpotsLeft: fallbackLeft };
    }

    const now = new Date();
    const futureDates = tour.tourDates
      .filter((d: any) => new Date(d.startDate) >= now)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const firstFree = futureDates.find((d: any) => {
      const capacity = d.capacity || 0;
      const booked = d._count?.bookings || 0;
      return (capacity - booked) > 0;
    });

    const totalLeft = futureDates.reduce((acc: number, d: any) => {
      const capacity = d.capacity || 0;
      const booked = d._count?.bookings || 0;
      return acc + Math.max(0, capacity - booked);
    }, 0);

    return {
      isGlobalSoldOut: futureDates.length > 0 ? !firstFree : true,
      activeSpotsLeft: futureDates.length > 0 ? totalLeft : 0
    };
  }, [tour]);

  const left = activeSpotsLeft;
  const isSoldOut = isGlobalSoldOut;
  const isLowSpots = left > 0 && left <= 5;

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistName.trim()) return;
    setWaitlistLoading(true);
    setWaitlistError(null);

    const result = await joinWaitlistAction({
      tourId:  String(tour.id),
      name:    waitlistName.trim(),
      phone:   waitlistPhone.trim() || undefined,
    });

    if (result.success) {
      setWaitlistDone(true);
    } else {
      setWaitlistError(result.error || 'Ошибка. Попробуйте ещё раз.');
    }
    setWaitlistLoading(false);
  };

  return (
    <aside className="sticky top-24 z-30 self-start">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50 overflow-hidden relative">
        
        {/* БЛОК 1: Цена и Места */}
        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
          <div>
            <p className="text-slate-300 text-[14px] font-bold uppercase tracking-wider mb-1">Стоимость участия</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl xl:text-4xl font-black text-white tracking-tight">
                {currentPrice.toLocaleString('ru-RU')}
              </span>
              <span className="text-sm font-bold text-teal-500">{currency}</span>
            </div>
            
            {hasDiscount && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-300 line-through text-xs font-medium decoration-rose-500/50">
                  {oldPriceVal.toLocaleString('ru-RU')}
                </span>
                <span className="bg-rose-500/10 text-rose-500 text-[14px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
                  Выгода {discountPercent}%
                </span>
              </div>
            )}
          </div>
          
          <div className="text-right">
              <p className="text-slate-300 text-[14px] font-bold uppercase tracking-wider mb-1">Свободных мест</p>
              <div className={clsx("text-2xl font-black tabular-nums", isSoldOut ? "text-rose-500" : (isLowSpots ? "text-amber-500" : "text-teal-400"))}>
                {isSoldOut ? "0" : left}
              </div>
              {isLowSpots && !isSoldOut && (
                <span className="text-[12px] font-bold text-amber-500 uppercase ">Заканчиваются!</span>
              )}
          </div>
        </div>

        {/* БЛОК 2: Доступные тарифы */}
        {((priceMember || 0) > 0 || (priceChild || 0) > 0 || (priceFamily || 0) > 0) && (
          <div className="space-y-3 mb-6">
            <p className="text-slate-300 text-[14px] font-bold uppercase mb-2">Доступные тарифы</p>
            
            <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2 text-slate-300">
                 <Ticket size={14} className="text-slate-300"/>
                 <span>Взрослый</span>
               </div>
               <span className="font-bold text-white">{currentPrice.toLocaleString()} {currency}</span>
            </div>
            
            {(priceMember ?? 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-amber-400">
                  <Crown size={14} />
                  <span className="font-bold">Клубная карта</span>
                </div>
                <span className="font-bold text-amber-400">{priceMember?.toLocaleString()} {currency}</span>
              </div>
            )}
            
            {(priceChild ?? 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-pink-400">
                  <Baby size={14} />
                  <span>Детский (до 13)</span>
                </div>
                <span className="font-bold text-white">{priceChild?.toLocaleString()} {currency}</span>
              </div>
            )}
            
            {(priceFamily ?? 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-blue-400">
                  <Users size={14} />
                  <span>Семья (2+1)</span>
                </div>
                <span className="font-bold text-white">{priceFamily?.toLocaleString()} {currency}</span>
              </div>
            )}
          </div>
        )}

        {/* БЛОК 3: Кнопка Бронирования / Вайтлист */}
        {!isSoldOut ? (
          <button
            onClick={() => openBookingModal(tour)}
            className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] hover:-translate-y-0.5 active:translate-y-0"
          >
            Записаться в группу
          </button>
        ) : waitlistDone ? (
          <div className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider text-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Вы в списке ожидания!
          </div>
        ) : showWaitlistForm ? (
          <form onSubmit={handleWaitlistSubmit} className="space-y-3">
            {!isProfileLoaded && (
              <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 mb-2 text-xs text-slate-300">
                💡 <a href="/login" className="text-teal-400 hover:underline font-bold">Войдите в кабинет</a>, чтобы мы автоматически уведомляли вас о новых местах и других датах тура!
              </div>
            )}
            <input
              required
              type="text"
              placeholder="Ваше имя"
              value={waitlistName}
              onChange={(e) => setWaitlistName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none transition-all"
            />
            <input
              type="tel"
              placeholder="Телефон (необязательно)"
              value={waitlistPhone}
              onChange={(e) => setWaitlistPhone(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none transition-all"
            />
            {waitlistError && (
              <p className="text-xs text-rose-400 font-bold">{waitlistError}</p>
            )}
            <button
              type="submit"
              disabled={waitlistLoading}
              className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {waitlistLoading ? <Loader2 size={16} className="animate-spin" /> : 'Встать в очередь'}
            </button>
            <button
              type="button"
              onClick={() => setShowWaitlistForm(false)}
              className="w-full text-xs text-slate-300 hover:text-slate-300 transition-colors font-bold uppercase tracking-wider py-1"
            >
              Отмена
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowWaitlistForm(true)}
            className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            Мест нет — в список ожидания
          </button>
        )}
        
        {/* БЛОК 4: Гарантии */}
        {!isSoldOut && (
          <div className="mt-4 flex items-center justify-center gap-4 opacity-60">
              <p className="text-[12px] text-slate-300 uppercase font-bold flex items-center gap-1">
                <ShieldCheck size={10} className="text-teal-500"/> Без предоплаты
              </p>
              <p className="text-[12px] text-slate-300 uppercase font-bold flex items-center gap-1">
                <Check size={10} className="text-teal-500"/>Автоматическое подтверждение в ТГ
              </p>
          </div>
        )}
        
      </div>
    </aside>
  );
}