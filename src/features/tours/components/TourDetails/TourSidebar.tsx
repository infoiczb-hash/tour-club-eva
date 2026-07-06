"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Users, ShieldCheck, Crown, Baby, Ticket, Check, Zap, Flame } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { clsx } from 'clsx';
import { useModalStore } from '@/shared/store/useModalStore';
import { joinWaitlistAction } from '@/features/account/actions/waitlist';
import { getMyProfileAction } from '@/features/account/actions/getProfile';
import { calculateDynamicPrice } from '@/features/tours/lib/pricing';

interface TourSidebarProps {
  tour: Tour & { tourPriceCategories?: any[]; priceCategories?: any[] };
}

export default function TourSidebar({ tour }: TourSidebarProps) {
  const openBookingModal = useModalStore((state) => state.openBookingModal);

  const { price, currency = 'RUB', priceOld, priceMember, priceChild, priceFamily } = tour;
  const basePriceVal = Number(price || 0);

  // 1. Умная логика доступности
  const { isGlobalSoldOut, isLowSpots, nearestAvailableDate } = useMemo(() => {
    const allDates = tour?.tourDates || tour?.dates || [];
    if (!allDates || allDates.length === 0) {
      const fallbackLeft = Number(tour?.spotsLeft || 0);
      return { isGlobalSoldOut: fallbackLeft <= 0, isLowSpots: fallbackLeft > 0 && fallbackLeft <= 5, nearestAvailableDate: null };
    }

    const now = new Date();
    const futureDates = allDates.filter((d: any) => 
      (d.startDate || d.start || d.date) ? new Date(d.startDate || d.start || d.date) >= now : false
    ).sort((a: any, b: any) => {
       const dateA = new Date(a.startDate || a.start || a.date).getTime();
       const dateB = new Date(b.startDate || b.start || b.date).getTime();
       return dateA - dateB;
    });

    const totalLeft = futureDates.reduce((acc: number, d: any) => {
      const left = d.spotsLeft ?? (d.capacity - (d._count?.bookings || 0));
      return acc + Math.max(0, left);
    }, 0);

    const nearest = futureDates.find((d: any) => (d.spotsLeft ?? 1) > 0) || futureDates[0] || null;

    return {
      isGlobalSoldOut: futureDates.length > 0 ? totalLeft <= 0 : true,
      isLowSpots: totalLeft > 0 && totalLeft <= 5,
      nearestAvailableDate: nearest
    };
  }, [tour]);

  const isSoldOut = isGlobalSoldOut;

  // 2. ВЫЧИСЛЯЕМ ДИНАМИЧЕСКУЮ ЦЕНУ (V1) И ДЕЛЬТУ
  const dynamicPricing = calculateDynamicPrice(basePriceVal, nearestAvailableDate);
  const currentV1Price = dynamicPricing.price;
  const priceDelta = currentV1Price - basePriceVal;
  
  // 3. ПОДКЛЮЧАЕМ ГИБКИЕ ТАРИФЫ (V2)
  const priceCategories = useMemo(() => {
    return tour.tourPriceCategories || tour.priceCategories || [];
  }, [tour.tourPriceCategories, tour.priceCategories]);

  const activeCategories = priceCategories
    .filter((c: any) => c.isActive !== false)
    .map((c: any) => {
      const original = Number(c.price);
      const current = Math.max(0, original + priceDelta); // Применяем скидку
      return { ...c, originalPrice: original, currentPrice: current };
    });

  const isV2 = activeCategories.length > 0;
  
  // Флаг для отображения приписки "/ чел."
  const showPerPerson = isV2 && activeCategories.some((c: any) => (c.spotsPerUnit || 1) > 1);

  // 🚀 SENIOR FIX: Умный поиск минимальной цены ЗА ОДНО МЕСТО
  const minPrice = useMemo(() => {
    if (isV2) {
      // Делим цену тарифа на его вместимость
      return Math.min(...activeCategories.map((c: any) => c.currentPrice / Math.max(1, c.spotsPerUnit || 1)));
    }
    const p = [currentV1Price];
    if (tour.priceMember) p.push(Number(tour.priceMember));
    if (tour.priceChild) p.push(Number(tour.priceChild));
    return Math.min(...p);
  }, [isV2, activeCategories, currentV1Price, tour]);

  // Логика скидок (Зачеркнутая цена в шапке тоже делится на места)
  const hasDiscount = priceDelta < 0; 
  const headerOldPrice = isV2 
    ? Math.min(...activeCategories.map((c: any) => c.originalPrice / Math.max(1, c.spotsPerUnit || 1))) 
    : (dynamicPricing.oldPrice || Number(priceOld || 0));
    
  const discountPercent = hasDiscount && headerOldPrice > 0
    ? Math.round(((headerOldPrice - minPrice) / headerOldPrice) * 100) 
    : 0;
  
  const showFromPrefix = isV2 ? activeCategories.length > 1 : (Number(tour.priceMember || 0) > 0 || Number(tour.priceChild || 0) > 0);

  // Стейты для Листа ожидания
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistName,     setWaitlistName]     = useState('');
  const [waitlistPhone,    setWaitlistPhone]    = useState('+373 ');
  const [waitlistLoading,  setWaitlistLoading]  = useState(false);
  const [waitlistDone,     setWaitlistDone]     = useState(false);
  const [waitlistError,    setWaitlistError]    = useState<string | null>(null);
  const [isProfileLoaded,  setIsProfileLoaded]  = useState(false);

  useEffect(() => {
    getMyProfileAction().then(p => {
      if (p) {
        setIsProfileLoaded(true);
        if (p.name) setWaitlistName(p.name);
        if (p.phone) setWaitlistPhone(p.phone);
      }
    }).catch(err => console.error("Ошибка загрузки профиля в сайдбаре:", err));
  }, []);

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
        
        {/* МАРКЕТИНГОВЫЙ БЕЙДЖ */}
        {dynamicPricing.type === 'EARLY_BIRD' && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-lg">
            <Flame size={12} /> Раннее бронирование
          </div>
        )}
        {dynamicPricing.type === 'LAST_MINUTE' && (
          <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-lg">
            <Zap size={12} /> Горящий тур
          </div>
        )}

        {/* БЛОК 1: Цена и Места */}
        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6 mt-2">
          <div>
            <p className="text-slate-300 text-[14px] font-bold uppercase tracking-wider mb-1">Цена</p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {showFromPrefix && <span className="text-sm font-bold text-slate-400 uppercase">от</span>}
              <span className="text-3xl xl:text-4xl font-black text-white tracking-tight">
                {Math.round(minPrice).toLocaleString('ru-RU')}
              </span>
              <span className="text-sm font-bold text-teal-500">
                {currency} {showPerPerson && <span className="text-slate-400 ml-1 lowercase tracking-normal">/ чел.</span>}
              </span>
            </div>
            
            {hasDiscount && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-300 line-through text-xs font-medium decoration-rose-500/50">
                  {Math.round(headerOldPrice).toLocaleString('ru-RU')}
                </span>
                <span className="bg-rose-500/10 text-rose-500 text-[14px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
                  Выгода {discountPercent}%
                </span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
              <p className="text-slate-300 text-[14px] font-bold uppercase tracking-wider mb-1"> Места</p>
              <div className={clsx(
                "text-lg font-black uppercase leading-tight", 
                isGlobalSoldOut ? "text-rose-500" : (isLowSpots ? "text-amber-500" : "text-teal-400")
              )}>
                {isGlobalSoldOut ? "Мест нет" : (isLowSpots ? "Мест мало" : "В наличии")}
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1.5 leading-tight max-w-[140px] ml-auto">
                Наличие мест на даты смотрите в расписании.
              </p>
          </div>
        </div>

        {/* БЛОК 2: Доступные тарифы (Умный рендер V1/V2) */}
        <div className="space-y-3 mb-6">
          <p className="text-slate-300 text-[14px] font-bold uppercase mb-2">Доступные тарифы</p>
          
          {isV2 ? (
            /* В списке выводим полные цены за лодки, чтобы клиент понимал, за что платит */
            activeCategories.map((cat: any) => (
              <div key={cat.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Ticket size={14} className="shrink-0" />
                  <span>{cat.label}</span>
                </div>
                <div className="flex flex-col items-end">
                  {hasDiscount && (
                    <span className="text-[10px] text-slate-500 line-through leading-none mb-0.5">
                      {cat.originalPrice.toLocaleString('ru-RU')} {currency}
                    </span>
                  )}
                  <span className="font-bold text-white leading-none">
                    {cat.currentPrice.toLocaleString('ru-RU')} {currency}
                  </span>
                </div>
              </div>
            ))
          ) : (
            /* --- РЕЖИМ V1 --- */
            <>
              <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2 text-slate-300">
                   <Ticket size={14} />
                   <span>Стандарт</span>
                 </div>
                 <span className="font-bold text-white">{currentV1Price.toLocaleString('ru-RU')} {currency}</span>
              </div>
              
              {(priceMember ?? 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Crown size={14} />
                    <span className="font-bold">Клубная карта</span>
                  </div>
                  <span className="font-bold text-amber-400">{priceMember?.toLocaleString('ru-RU')} {currency}</span>
                </div>
              )}
              
              {(priceChild ?? 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-pink-400">
                    <Baby size={14} />
                    <span>Детский (до 15)</span>
                  </div>
                  <span className="font-bold text-white">{priceChild?.toLocaleString('ru-RU')} {currency}</span>
                </div>
              )}
              
              {(priceFamily ?? 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Users size={14} />
                    <span>Семья (2+1)</span>
                  </div>
                  <span className="font-bold text-white">{priceFamily?.toLocaleString('ru-RU')} {currency}</span>
                </div>
              )}
            </>
          )}
        </div>

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