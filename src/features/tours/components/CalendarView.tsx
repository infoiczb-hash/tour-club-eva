"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, ChevronRight, Calendar as CalendarIcon, Sparkles, Flame, Zap } from 'lucide-react';
import { TourPreview } from '@/features/tours/types';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge"; 
import { calculateDynamicPrice } from '@/features/tours/lib/pricing';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// СЛОВАРЬ ДИЗАЙН-СИСТЕМЫ
const COLOR_THEMES: Record<string, string> = {
  slate:   "bg-slate-500/10 border-slate-500/20 text-slate-300",
  teal:    "bg-teal-500/10 border-teal-500/20 text-teal-400",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  sky:     "bg-sky-500/10 border-sky-500/20 text-sky-400",
  blue:    "bg-blue-500/10 border-blue-500/20 text-blue-400",
  violet:  "bg-violet-500/10 border-violet-500/20 text-violet-400",
  pink:    "bg-pink-500/10 border-pink-500/20 text-pink-400",
  rose:    "bg-rose-500/10 border-rose-500/20 text-rose-400",
  orange:  "bg-orange-500/10 border-orange-500/20 text-orange-400",
  amber:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

// Расширяем тип TourPreview для поддержки тарифов V2
type ExtendedTourPreview = TourPreview & { 
  tourPriceCategories?: any[]; 
  priceCategories?: any[]; 
};

type CalendarTour = Omit<ExtendedTourPreview, 'date'> & { 
  uniqueId: string; 
  originalId: string;
  date: string | null; 
  endDate: string | null; 
  guideId: string | null;
  currentPrice?: number | null; 
  specificDateObj?: any; // Сохраняем оригинальный объект даты для точного расчета
};

interface CalendarViewProps { events: ExtendedTourPreview[]; }

export default function CalendarView({ events }: CalendarViewProps) {
const { groupedTours, tbaTours } = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const explodedEvents: CalendarTour[] = events.flatMap((tour): CalendarTour[] => {
    const datesArray = Array.isArray(tour.dates) ? tour.dates : [];

    if (datesArray.length > 0) {
      return datesArray.map((dateObj, idx) => ({
        ...tour,
        date: dateObj.start || null,
        endDate: dateObj.end || null,
        guideId: dateObj.guide_id || null,
        originalId: tour.id,
        uniqueId: dateObj.id || `${tour.id}-${dateObj.start}-${idx}`,
        currentPrice: dateObj.basePrice || tour.price,
        specificDateObj: dateObj
      }));
    }

    return [{ 
      ...tour, 
      uniqueId: tour.id, 
      originalId: tour.id, 
      date: null, 
      endDate: null, 
      guideId: null, 
      currentPrice: tour.price,
      specificDateObj: null
    } as CalendarTour];
  });

  const futureEvents = explodedEvents.filter(tour => {
    if (!tour.date) return true; 

    const referenceDateStr = tour.endDate || tour.date;
    const referenceDate = new Date(referenceDateStr);
    referenceDate.setHours(0, 0, 0, 0); 

    return referenceDate.getTime() >= today.getTime();
  });

  const sorted = futureEvents.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : Infinity;
    const dateB = b.date ? new Date(b.date).getTime() : Infinity;
    return dateA - dateB;
  });

  const groups: Record<string, CalendarTour[]> = {};
  const tba: CalendarTour[] = [];
  
  sorted.forEach(tour => {
    if (!tour.date) { tba.push(tour); return; }
    const date = new Date(tour.date);
    const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const monthKey = monthFormatter.format(date);
    const formattedKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
    if (!groups[formattedKey]) groups[formattedKey] = [];
    groups[formattedKey].push(tour);
  });

  return { groupedTours: groups, tbaTours: tba };
}, [events]);

  const monthKeys = Object.keys(groupedTours);

  if (events.length === 0 || (monthKeys.length === 0 && tbaTours.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
          <CalendarIcon size={32} className="text-teal-500/50" />
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Актуальных туров пока нет</h3>
        <p className="text-slate-300 font-medium max-w-sm mx-auto">Но мы уже готовим новое расписание. Следите за анонсами!</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto pb-20">
      {monthKeys.map((month) => (
        <div key={month} className="mb-10 relative">
          <div className="flex items-center gap-4 my-8 sticky top-20 z-30">
            <div className="h-px bg-gradient-to-r from-transparent to-white/10 flex-1" />
            <div className="px-5 py-2 rounded-full bg-slate-900/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)] animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.2em]">{month}</span>
            </div>
            <div className="h-px bg-gradient-to-l from-transparent to-white/10 flex-1" />
          </div>
          <div className="flex flex-col gap-3 sm:gap-4">
            {groupedTours[month].map((tour) => <CalendarRow key={tour.uniqueId} tour={tour} />)}
          </div>
        </div>
      ))}

      {tbaTours.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-4 my-8 sticky top-20 z-30">
            <div className="h-px bg-gradient-to-r from-transparent to-white/10 flex-1" />
            <div className="px-5 py-2 rounded-full bg-slate-900/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-2 opacity-80">
              <Sparkles size={14} className="text-slate-300" />
              <span className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Скоро (Анонсы)</span>
            </div>
            <div className="h-px bg-gradient-to-l from-transparent to-white/10 flex-1" />
          </div>
          <div className="flex flex-col gap-3 sm:gap-4">
            {tbaTours.map((tour) => <CalendarRow key={tour.uniqueId} tour={tour} isTba />)}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarRow({ tour, isTba = false }: { tour: CalendarTour, isTba?: boolean }) {
  const dateObj = tour.date ? new Date(tour.date) : null;
  const dayNumber = dateObj ? dateObj.getDate() : null;
  const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' });
  const weekDay = dateObj ? weekdayFormatter.format(dateObj) : null;
  const endDateObj = tour.endDate ? new Date(tour.endDate) : null;
  const isMultiDay = endDateObj && dateObj && endDateObj.getTime() !== dateObj.getTime();

  const themeColor = tour.category?.color || 'slate';
  const badgeStyle = COLOR_THEMES[themeColor] || COLOR_THEMES.slate;
  const badgeLabel = tour.category?.title || 'Тур';

  // --- УМНАЯ ЛОГИКА ЦЕН (Синхронизировано) ---
  const basePriceVal = Number(tour.price || 0);
  const dynamicPricing = calculateDynamicPrice(basePriceVal, tour.specificDateObj || null);
  const currentV1Price = dynamicPricing.price;
  const priceDelta = currentV1Price - basePriceVal;

  const priceCategories = tour.tourPriceCategories || tour.priceCategories || [];
  const activeCategories = priceCategories
    .filter((c: any) => c.isActive !== false)
    .map((c: any) => {
      const original = Number(c.price);
      const current = Math.max(0, original + priceDelta);
      return { ...c, originalPrice: original, currentPrice: current };
    });

  const isV2 = activeCategories.length > 0;
  const showPerPerson = isV2 && activeCategories.some((c: any) => (c.spotsPerUnit || 1) > 1);

  let minPriceForDate;
  let oldPriceForDate;
  
  if (isV2) {
    minPriceForDate = Math.min(...activeCategories.map((c: any) => c.currentPrice / Math.max(1, c.spotsPerUnit || 1)));
    oldPriceForDate = Math.min(...activeCategories.map((c: any) => c.originalPrice / Math.max(1, c.spotsPerUnit || 1)));
  } else {
    const p = [currentV1Price];
    if (tour.priceMember) p.push(Number(tour.priceMember));
    if (tour.priceChild) p.push(Number(tour.priceChild));
    minPriceForDate = Math.min(...p);
    oldPriceForDate = dynamicPricing.oldPrice || Number(tour.priceOld || 0);
  }

  const hasDiscount = priceDelta < 0;
  const showFromPrefix = isV2 ? activeCategories.length > 1 : ((Number(tour.priceMember) || 0) > 0 || (Number(tour.priceChild) || 0) > 0);

  return (
    <Link href={`/tour/${tour.slug}`} className="group block outline-none">
      <div className={cn(
        "relative flex items-stretch gap-2 sm:gap-5 p-2.5 sm:p-4 rounded-[1.5rem] transition-all duration-300",
        "bg-[#0d131a] border-2 border-white/5 hover:border-teal-500/30 hover:bg-slate-900/80 hover:shadow-2xl hover:scale-[0.995]",
        isTba && "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
      )}>
        <div className="w-16 sm:w-24 shrink-0 rounded-xl bg-slate-950/50 border border-white/5 flex flex-col items-center justify-center py-2 sm:py-3 shadow-inner group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition-colors">
          {isTba ? (
            <Clock size={24} className="text-slate-300 group-hover:text-teal-400 transition-colors" />
          ) : (
            <>
              <span className="text-2xl sm:text-4xl font-black leading-none text-white group-hover:text-teal-400 transition-colors">{dayNumber}</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 mt-1">{weekDay}</span>
            </>
          )}
        </div>

        <div className="hidden md:block relative w-28 sm:w-36 h-full min-h-[90px] rounded-xl overflow-hidden shrink-0 border border-white/5">
          <Image src={tour.image || '/placeholder-tour.jpg'} alt={tour.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="150px" />
        </div>

        <div className="flex flex-col justify-center flex-1 min-w-0 py-1 pl-1 sm:pl-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[12px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            {badgeLabel && (
              <span className={cn("px-2 py-0.5 rounded-md border backdrop-blur-sm text-[10px] sm:text-[12px] leading-tight", badgeStyle)}>
                {badgeLabel}
              </span>
            )}
            {tour.duration && <span className="flex items-center text-slate-300">{tour.duration}</span>}
            {isMultiDay && endDateObj && (
              <span className="flex items-center text-slate-300 before:content-['•'] before:mx-1.5 before:text-slate-700">до {endDateObj.getDate()} числа</span>
            )}
          </div>
          
          <h4 className="text-sm sm:text-xl font-black text-white leading-tight pr-1 sm:pr-2 group-hover:text-teal-300 transition-colors mb-1 sm:mb-2 line-clamp-2">
            {tour.title}
          </h4>
          
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm text-slate-300 font-medium">
            <MapPin size={12} className="shrink-0 text-teal-500/60 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
            <span className="truncate">{tour.location}</span>
          </div>
        </div>

        {/* ПРАВЫЙ БЛОК: ЦЕНА + КНОПКА (ТЕПЕРЬ ВИДНО НА МОБИЛЬНЫХ!) */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0 pl-1 sm:pl-3">
          <div className="flex flex-col items-end justify-center pr-2 sm:pr-4 border-r border-white/10 h-full">
            
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
               <span className="text-[9px] sm:text-[11px] uppercase font-bold text-slate-400 tracking-widest whitespace-nowrap">
                 {showFromPrefix ? 'Билет от' : 'Билет'}
               </span>
               {!isTba && dynamicPricing.type === 'EARLY_BIRD' && <Flame size={10} className="text-teal-400 shrink-0" />}
               {!isTba && dynamicPricing.type === 'LAST_MINUTE' && <Zap size={10} className="text-rose-400 shrink-0" />}
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-white leading-none tracking-tight">
                {Math.round(minPriceForDate).toLocaleString('ru-RU')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-teal-500 whitespace-nowrap">
                {tour.currency || 'RUB'} {showPerPerson && <span className="text-slate-400 ml-0.5 lowercase tracking-normal">/ чел.</span>}
              </span>
            </div>
            
            {hasDiscount && oldPriceForDate > 0 && (
               <span className="text-[9px] sm:text-[11px] text-slate-500 line-through decoration-rose-500/50 mt-0.5">
                 {Math.round(oldPriceForDate).toLocaleString('ru-RU')} {tour.currency || 'RUB'}
               </span>
            )}
          </div>
          
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-300 group-hover:bg-teal-500 group-hover:border-teal-400 group-hover:text-slate-900 transition-all duration-300 shadow-sm shrink-0">
            <ChevronRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}