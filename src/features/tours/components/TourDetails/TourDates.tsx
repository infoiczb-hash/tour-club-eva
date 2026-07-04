"use client";

import React, { useState, useTransition } from 'react';
import { Calendar, User, ChevronRight, Bell, BellOff, Loader2, Zap, Flame } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Tour } from '@/features/tours/types';
import { useModalStore } from '@/shared/store/useModalStore';
import { toggleTourWishlistAction } from '@/features/account/actions/tourWishlist';
import { calculateDynamicPrice } from '@/features/tours/lib/pricing'; 

interface TourDatesProps {
  tour: Tour & { tourPriceCategories?: any[]; priceCategories?: any[] };
  isWished?: boolean;
}

export default function TourDates({ tour, isWished = false }: TourDatesProps) {
  const openBookingModal = useModalStore((state) => state.openBookingModal);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [wished, setWished] = useState(isWished);

 const datesToRender = React.useMemo(() => {
    if (!tour.dates) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return tour.dates
      .filter((d: any) => {
        const dateVal = d.startDate || d.start || d.date;
        return dateVal ? new Date(dateVal) >= now : true; 
      })
      .sort((a: any, b: any) => {
         const dateA = a.startDate || a.start || a.date;
         const dateB = b.startDate || b.start || b.date;
         return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  }, [tour.dates]);

  if (datesToRender.length === 0) {
    function handleWishlistToggle() {
      startTransition(async () => {
        const res = await toggleTourWishlistAction(tour.id);
        if (res.needsAuth) {
          router.push(`/login?next=/tour/${tour.slug}`);
          return;
        }
        if (res.success) {
          setWished(res.isWished ?? !wished);
        }
      });
    }

    return (
      <section className="scroll-mt-24 mb-12 md:mb-16" id="dates">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 min-w-[40px] min-h-[40px] bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
            <Calendar size={20} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Расписание
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
          <div className="flex-1">
            <p className="text-white font-black text-lg uppercase tracking-tight mb-1">
              Даты пока не объявлены
            </p>
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              Сохраните тур — мы уведомим вас, как только появятся новые даты.
            </p>
          </div>

          <button
            onClick={handleWishlistToggle}
            disabled={isPending}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 shrink-0 disabled:opacity-60 ${
              wished
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                : 'bg-teal-500 text-slate-900 hover:bg-teal-400 shadow-lg hover:shadow-teal-500/25'
            }`}
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : wished ? (
              <BellOff size={16} />
            ) : (
              <Bell size={16} />
            )}
            {wished ? 'Слежу за туром' : 'Уведомить меня'}
          </button>
        </div>
      </section>
    );
  }

  // Общая подготовка гибких тарифов (V2)
  const priceCategories = tour.tourPriceCategories || tour.priceCategories || [];
  const activeCategories = priceCategories.filter((c: any) => c.isActive !== false);
  const isV2 = activeCategories.length > 0;
  const showFromPrefix = isV2 ? activeCategories.length > 1 : (Number(tour.priceMember || 0) > 0 || Number(tour.priceChild || 0) > 0);

  return (
    <section className="scroll-mt-24 mb-12 md:mb-16" id="dates">
      {/* ЗАГОЛОВОК */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 min-w-[40px] min-h-[40px] bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
           <Calendar size={20} strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
           Расписание
        </h2>
      </div>

      {/* СПИСОК ДАТ */}
      <div className="flex flex-col gap-3">
        {datesToRender.map((item, idx) => {
           if (!item.start) return null;

           const startDateObj = new Date(item.start); 
           const startStr = startDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           const endDateObj = item.end ? new Date(item.end) : startDateObj;
           const endStr = endDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           const dateString = startStr === endStr ? startStr : `${startStr} — ${endStr}`;
           const fullDateStringForBooking = `${dateString}${item.time ? ` в ${item.time}` : ''}`;
           const isSoldOut = (item.spotsLeft ?? 0) <= 0;
           
           const guideName = tour.guide?.name || 'Гид клуба';
           const guideImage = tour.guide?.image || null;

           // 🚀 SENIOR FIX: Считаем динамическую цену И дельту конкретно для ЭТОЙ даты
           const basePriceVal = Number(tour.price || 0);
           const dynamicPricing = calculateDynamicPrice(basePriceVal, item);
           const priceDelta = dynamicPricing.price - basePriceVal;
           const hasDiscount = priceDelta < 0;

           // Умный поиск минимальной цены для этой конкретной даты
           let minPriceForDate;
           let oldPriceForDate;
           
           if (isV2) {
             const minOriginal = Math.min(...activeCategories.map((c: any) => Number(c.price)));
             minPriceForDate = Math.max(0, minOriginal + priceDelta);
             oldPriceForDate = minOriginal;
           } else {
             const p = [dynamicPricing.price];
             if (tour.priceMember) p.push(Number(tour.priceMember));
             if (tour.priceChild) p.push(Number(tour.priceChild));
             minPriceForDate = Math.min(...p);
             oldPriceForDate = dynamicPricing.oldPrice || Number(tour.priceOld || 0);
           }

           return (
            <div 
               key={item.id || idx} 
               onClick={() => !isSoldOut && openBookingModal(tour, fullDateStringForBooking, item.id)}
               className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 md:py-4 rounded-2xl border transition-all duration-300 ${
                 isSoldOut 
                  ? 'bg-slate-900/30 border-white/5 opacity-60 cursor-not-allowed'
                  : 'bg-slate-900/60 backdrop-blur-md border-white/10 hover:border-teal-500/40 hover:bg-slate-800/80 cursor-pointer shadow-lg'
               }`}
            >
                {/* ЛЕВАЯ ЧАСТЬ: ДАТЫ */}
                <div className="flex justify-between items-center md:w-1/3 mb-3 md:mb-0">
                   <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                         <span className={`text-lg md:text-xl font-black uppercase tracking-tight transition-colors ${
                             isSoldOut ? 'text-slate-300' : 'text-white group-hover:text-teal-400'
                         }`}>
                           {dateString}
                         </span>
                         
                         {/* Маркетинговые бейджи */}
                         {!isSoldOut && dynamicPricing.type === 'EARLY_BIRD' && (
                            <div className="bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 border border-teal-500/30">
                              <Flame size={10} /> Раннее
                            </div>
                         )}
                         {!isSoldOut && dynamicPricing.type === 'LAST_MINUTE' && (
                            <div className="bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 border border-rose-500/30">
                              <Zap size={10} /> Горящий
                            </div>
                         )}
                       </div>

                       {item.time && (
                          <span className="text-xs text-slate-300 mt-0.5 font-bold uppercase tracking-wider">
                              Старт в {item.time}
                          </span>
                       )}
                   </div>
                   
                   <div className="md:hidden shrink-0">
                        {!isSoldOut && (
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-300 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors">
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </div>
                        )}
                   </div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: ГИД И СТАТУС */}
                <div className="flex items-center justify-between md:w-2/3 md:justify-end md:gap-8">
                    
                   {/* 🚀 SENIOR FIX: Вывод цены с приставкой "от" и зачеркиванием старой */}
                   <div className="hidden lg:flex flex-col items-end mr-2">
                     <span className={`text-lg font-black tracking-tight flex items-baseline gap-1 ${isSoldOut ? 'text-slate-500' : 'text-white'}`}>
                       {showFromPrefix && <span className="text-xs text-slate-400 uppercase font-bold">от</span>}
                       {minPriceForDate.toLocaleString('ru-RU')} <span className="text-sm font-bold text-teal-500">{tour.currency || 'RUB'}</span>
                     </span>
                     {hasDiscount && !isSoldOut && oldPriceForDate > 0 && (
                        <span className="text-xs text-slate-400 line-through decoration-rose-500/50">
                          {oldPriceForDate.toLocaleString('ru-RU')} {tour.currency || 'RUB'}
                        </span>
                     )}
                   </div>

                   <div className="flex gap-3 items-center mr-auto md:mr-0">
                      <div className={`relative w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full overflow-hidden shrink-0 flex items-center justify-center ${
                           isSoldOut ? 'bg-slate-800 text-slate-600' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                      }`}>
                         {guideImage ? (
                            <Image 
                              src={guideImage} 
                              alt={guideName} 
                              fill 
                              className={`object-cover object-top ${isSoldOut ? 'grayscale opacity-50' : ''}`} 
                              sizes="40px" 
                            />
                         ) : (
                           <User size={20} />
                         )}
                      </div>
                      <div>
                         <h3 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-0.5 leading-none">
                           Ведет группу
                         </h3>
                         <p className={`text-sm font-bold leading-none ${isSoldOut ? 'text-slate-300' : 'text-white'}`}>
                           {guideName}
                         </p>
                      </div>
                  </div>

                    <div className="flex items-center gap-4">
                        {isSoldOut ? (
                            <div className="flex items-center gap-1.5 text-rose-500/80 font-bold text-xs uppercase tracking-widest bg-rose-500/10 px-2.5 py-1.5 rounded-md">
                                Мест нет
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-slate-950/50 border border-white/5 px-2.5 py-1.5 rounded-md">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-emerald-400">Осталось {item.spotsLeft ?? tour.spotsLeft}</span>
                            </div>
                        )}

                        {!isSoldOut && (
                            <div className="hidden md:flex w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/5 items-center justify-center text-slate-300 group-hover:bg-teal-500 group-hover:text-slate-900 group-hover:translate-x-1 transition-all duration-300">
                                <ChevronRight size={20} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                </div>
             </div>
           )
        })}
      </div>
    </section>
  );
}