"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Tour } from '@/features/tours/types';
import { clsx } from 'clsx';
import { X, Crown, Baby, Users, Ticket, ChevronUp, Loader2, Flame, Zap } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';
import { joinWaitlistAction } from '@/features/account/actions/waitlist';
import { getMyProfileAction } from '@/features/account/actions/getProfile';
import { calculateDynamicPrice } from '@/features/tours/lib/pricing';

interface TourBottomActionsProps {
  tour: Tour & { tourPriceCategories?: any[]; priceCategories?: any[] };
}

type UnifiedTourDate = NonNullable<Tour["tourDates"]>[number] | NonNullable<Tour["dates"]>[number];

export default function TourBottomActions({ tour }: TourBottomActionsProps) {
  const [isVisible, setIsVisible]   = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const openBookingModal = useModalStore((state) => state.openBookingModal);

  // Стейты для Листа Ожидания
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
    }).catch(err => console.error("Ошибка загрузки профиля в BottomActions:", err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsExpanded(false);
      setShowWaitlistForm(false); 
    }
  }, [isVisible]);

  const { targetDate, isGlobalSoldOut, isLowSpots } = useMemo(() => {
    const allDates = (tour?.dates || tour?.tourDates || []) as UnifiedTourDate[];
    
    if (!allDates || allDates.length === 0) {
      const fallbackLeft = Number(tour?.spotsLeft || 0);
      return { targetDate: null, isGlobalSoldOut: fallbackLeft <= 0, isLowSpots: fallbackLeft > 0 && fallbackLeft <= 5 };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const futureDates = allDates.filter((d: UnifiedTourDate) => {
      const dateVal = d.startDate || d.start || d.date;
      return dateVal ? new Date(dateVal as string | Date) >= now : true;
    }).sort((a: UnifiedTourDate, b: UnifiedTourDate) => {
       const dateA = a.startDate || a.start || a.date;
       const dateB = b.startDate || b.start || b.date;
       const timeA = dateA ? new Date(dateA as string | Date).getTime() : 0;
       const timeB = dateB ? new Date(dateB as string | Date).getTime() : 0;
       return timeA - timeB;
    });

    const firstFree = futureDates.find((d: UnifiedTourDate) => {
      const left = d.spotsLeft ?? (d.capacity ? (d.capacity - (d._count?.bookings || 0)) : Number(tour?.spotsLeft || 0));
      return left > 0;
    });

    const totalLeft = futureDates.reduce((acc: number, d: UnifiedTourDate) => {
      const left = d.spotsLeft ?? (d.capacity ? (d.capacity - (d._count?.bookings || 0)) : Number(tour?.spotsLeft || 0));
      return acc + Math.max(0, left);
    }, 0);

    return {
      targetDate: firstFree || futureDates[0] || null,
      isGlobalSoldOut: futureDates.length > 0 ? totalLeft <= 0 : true,
      isLowSpots: totalLeft > 0 && totalLeft <= 5
    };
  }, [tour]);

  const isSoldOut = isGlobalSoldOut;

  // --- ЛОГИКА ДИНАМИЧЕСКИХ ЦЕН И АБСОЛЮТНЫХ СКИДОК ---
  const basePriceVal = Number(tour.price || 0);
  const dynamicPricing = calculateDynamicPrice(basePriceVal, targetDate);
  const currentV1Price = dynamicPricing.price;
  
  const priceDelta = currentV1Price - basePriceVal;
  
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

  const hasDiscount = priceDelta < 0; 
  const headerOldPrice = isV2 
    ? Math.min(...activeCategories.map((c: any) => c.originalPrice / Math.max(1, c.spotsPerUnit || 1))) 
    : (dynamicPricing.oldPrice || Number(tour.priceOld || 0));
    
  const discountPercent = hasDiscount && headerOldPrice > 0
    ? Math.round(((headerOldPrice - minPrice) / headerOldPrice) * 100)
    : 0;
  
  const showFromPrefix = isV2 ? activeCategories.length > 1 : (Number(tour.priceMember || 0) > 0 || Number(tour.priceChild || 0) > 0);

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
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => { setIsExpanded(false); setShowWaitlistForm(false); }}
          aria-hidden="true"
        />
      )}

      <div
        className={clsx(
          "fixed bottom-0 left-0 right-0 z-[60] lg:hidden transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        aria-label="Панель бронирования тура"
      >
        <div className={clsx(
          "bg-slate-900/98 backdrop-blur-xl border-t border-white/10 transition-all duration-400 ease-in-out",
          "rounded-t-3xl shadow-2xl shadow-black/60",
        )}>

          <div
            className="flex items-center justify-center pt-3 pb-1 cursor-pointer relative"
            onClick={() => {
              if (isExpanded) setShowWaitlistForm(false);
              setIsExpanded(!isExpanded);
            }}
            role="button"
            aria-label={isExpanded ? 'Свернуть панель' : 'Развернуть детали тура'}
            aria-expanded={isExpanded}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />

            {isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setShowWaitlistForm(false); }}
                aria-label="Закрыть панель"
                className="absolute right-4 top-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={14} className="text-slate-300" />
              </button>
            )}
          </div>

          <div className={clsx(
            "overflow-hidden transition-all duration-400 ease-in-out",
            isExpanded ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="px-5 pt-2 pb-4 space-y-4 overflow-y-auto max-h-[65vh]">
              
              {showWaitlistForm ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="text-lg font-black text-white">Список ожидания</h3>
                    <p className="text-xs text-slate-400 mt-1">Оставьте контакты, и мы сообщим, если кто-то откажется от поездки или мы добавим новые места.</p>
                  </div>

                  {!isProfileLoaded && (
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 text-xs text-slate-300">
                      💡 <a href="/login" className="text-teal-400 hover:underline font-bold">Войдите в кабинет</a> для авто-уведомлений о датах!
                    </div>
                  )}

                  {waitlistDone ? (
                    <div className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider text-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      Вы добавлены в список!
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlistSubmit} className="space-y-3 pb-4">
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
                        placeholder="Телефон"
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
                        className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {waitlistLoading ? <Loader2 size={16} className="animate-spin" /> : 'Встать в очередь'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs uppercase font-bold text-slate-300 tracking-wider">Стоимость участия</p>
                        {dynamicPricing.type === 'EARLY_BIRD' && (
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 border border-teal-500/20">
                            <Flame size={10} /> Раннее
                          </span>
                        )}
                        {dynamicPricing.type === 'LAST_MINUTE' && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 border border-rose-500/20">
                            <Zap size={10} /> Горящий
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        {showFromPrefix && <span className="text-sm font-bold text-slate-400 uppercase">от</span>}
                        <span className="text-3xl font-black text-white">{Math.round(minPrice).toLocaleString('ru-RU')}</span>
                        <span className="text-sm font-bold text-teal-500">
                          {tour.currency || 'RUB'} {showPerPerson && <span className="text-slate-400 ml-1 lowercase tracking-normal font-medium">/ чел.</span>}
                        </span>
                      </div>
                      
                      {hasDiscount && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-300 line-through text-xs">{Math.round(headerOldPrice).toLocaleString('ru-RU')}</span>
                          <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
                            −{discountPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase font-bold text-slate-300 tracking-wider mb-1">Места</p>
                      <div className={clsx(
                        "text-sm font-black uppercase leading-tight",
                        isGlobalSoldOut ? "text-rose-500" : (isLowSpots ? "text-amber-400" : "text-teal-400")
                      )}>
                        {isGlobalSoldOut ? "Мест нет" : (isLowSpots ? "Мест мало" : "В наличии")}
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-1.5 leading-tight max-w-[120px] ml-auto">
                        Наличие мест на даты смотрите в расписании.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/5" />

                  {/* Рендер тарифов: в списке выводим ПОЛНУЮ цену за лодку */}
                  {((isV2 && activeCategories.length > 0) || (!isV2 && (tour.priceMember || tour.priceChild || tour.priceFamily))) && (
                    <div className="space-y-2.5">
                      <p className="text-xs uppercase font-bold text-slate-300 tracking-wider">Доступные тарифы</p>
                      
                      {isV2 ? (
                        activeCategories.map((cat: any) => (
                          <div key={cat.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Ticket size={14} className="shrink-0" />
                              <span>{cat.label}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              {hasDiscount && (
                                <span className="text-[10px] text-slate-500 line-through leading-none mb-0.5">
                                  {cat.originalPrice.toLocaleString('ru-RU')} {tour.currency}
                                </span>
                              )}
                              <span className="font-bold text-white text-sm leading-none">
                                {cat.currentPrice.toLocaleString('ru-RU')} {tour.currency}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Ticket size={14} />
                              <span>Стандарт</span>
                            </div>
                            <span className="font-bold text-white text-sm">
                              {currentV1Price.toLocaleString('ru-RU')} {tour.currency}
                            </span>
                          </div>
                          {tour.priceMember && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm text-amber-400">
                                <Crown size={14} />
                                <span className="font-bold">Клубная карта</span>
                              </div>
                              <span className="font-bold text-amber-400 text-sm">
                                {Number(tour.priceMember).toLocaleString('ru-RU')} {tour.currency}
                              </span>
                            </div>
                          )}
                          {tour.priceChild && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm text-pink-400">
                                <Baby size={14} />
                                <span>Детский (до 15)</span>
                              </div>
                              <span className="font-bold text-white text-sm">
                                {Number(tour.priceChild).toLocaleString('ru-RU')} {tour.currency}
                              </span>
                            </div>
                          )}
                          {tour.priceFamily && (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm text-blue-400">
                                <Users size={14} />
                                <span>Семья (2+1)</span>
                              </div>
                              <span className="font-bold text-white text-sm">
                                {Number(tour.priceFamily).toLocaleString('ru-RU')} {tour.currency}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-4 pb-6 pt-3 flex items-center gap-3">

            <button
              onClick={() => {
                if (isExpanded) setShowWaitlistForm(false);
                setIsExpanded(!isExpanded);
              }}
              className="flex-1 flex items-center gap-2 min-w-0 group"
              aria-label={isExpanded ? 'Свернуть детали' : 'Показать детали'}
            >
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs text-slate-300 uppercase font-bold tracking-wider">Стоимость</p>
                  {!isExpanded && dynamicPricing.type === 'EARLY_BIRD' && <Flame size={12} className="text-teal-400" />}
                  {!isExpanded && dynamicPricing.type === 'LAST_MINUTE' && <Zap size={12} className="text-rose-400" />}
                </div>
                
                <div className="flex items-baseline gap-1">
                  {showFromPrefix && <span className="text-xs text-slate-300 font-medium">от</span>}
                  <span className="text-xl font-black text-white">{Math.round(minPrice).toLocaleString('ru-RU')}</span>
                  <span className="text-xs font-bold text-teal-500">
                    {tour.currency || 'RUB'} {showPerPerson && <span className="text-slate-400 ml-1 lowercase tracking-normal font-medium">/ чел.</span>}
                  </span>
                </div>
              </div>

              <div className={clsx(
                "w-7 h-7 rounded-full border border-white/15 flex items-center justify-center shrink-0 transition-all duration-300",
                isExpanded
                  ? "bg-white/15 rotate-180 border-white/30"
                  : "bg-white/5 group-hover:bg-white/10"
              )}>
                <ChevronUp size={14} className="text-slate-300" />
              </div>
            </button>

            <button
              onClick={() => {
                if (isSoldOut) {
                  setShowWaitlistForm(true);
                  setIsExpanded(true);
                } else {
                  setIsExpanded(false);
                  openBookingModal(tour);
                }
              }}
              aria-label={isSoldOut ? 'Встать в очередь' : `Записаться в тур ${tour.title}`}
              className={clsx(
                "shrink-0 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95 whitespace-nowrap",
                isSoldOut
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/25"
                  : "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-lg shadow-teal-500/25"
              )}
            >
              {isSoldOut ? 'В очередь' : 'Записаться'}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}