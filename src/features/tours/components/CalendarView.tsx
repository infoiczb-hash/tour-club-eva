"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { TourPreview } from '@/features/tours/types';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge"; 

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ✅ СЛОВАРЬ ДИЗАЙН-СИСТЕМЫ (Привязан к цвету из БД, а не к типу тура)
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

// ✅ ИСПРАВЛЕНО: Добавлен currentPrice для динамического ценообразования дат
type CalendarTour = Omit<TourPreview, 'date'> & { // ✅ ИЗМЕНЕНО: Omit из TourPreview
  uniqueId: string; 
  originalId: string;
  date: string | null; 
  endDate: string | null; 
  guideId: string | null;
  currentPrice?: number | null; 
};

interface CalendarViewProps { events: TourPreview[]; }
export default function CalendarView({ events }: CalendarViewProps) {
  const { groupedTours, tbaTours } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const explodedEvents: CalendarTour[] = events.flatMap((tour): CalendarTour[] => {
      
      // ✅ ИСПРАВЛЕНО: Убрали костыль с JSON.parse. api.ts уже отдаёт чистый массив.
      const datesArray = Array.isArray(tour.dates) ? tour.dates : [];

      if (datesArray.length > 0) {
        const futureDates = datesArray.filter(dateObj => {
            if (!dateObj.start) return false;
            const eventDate = new Date(dateObj.start);
            eventDate.setHours(0, 0, 0, 0); 
            return eventDate.getTime() >= today.getTime();
        });

        if (futureDates.length === 0) return [];

        return futureDates.map((dateObj, idx) => ({
          ...tour, 
          date: dateObj.start || null, 
          endDate: dateObj.end || null,
          guideId: dateObj.guide_id || null, 
          originalId: tour.id,
          // ✅ ИСПРАВЛЕНО: Берем UUID из TourDate, если он есть, иначе фолбэк
          uniqueId: dateObj.id || `${tour.id}-${dateObj.start}-${idx}`,
          // ✅ ИСПРАВЛЕНО: Динамическая цена конкретной даты (если задана) перекрывает базовую
          currentPrice: dateObj.basePrice || tour.price 
        }));
      }

      return [{ ...tour, uniqueId: tour.id, originalId: tour.id, date: null, endDate: null, guideId: null, currentPrice: tour.price } as CalendarTour];
    });

    const sorted = explodedEvents.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Infinity;
      const dateB = b.date ? new Date(b.date).getTime() : Infinity;
      return dateA - dateB;
    });

    const groups: Record<string, CalendarTour[]> = {};
    const tba: CalendarTour[] = [];
    
    sorted.forEach(tour => {
      if (!tour.date) { tba.push(tour); return; }
      const date = new Date(tour.date);
      const monthKey = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
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
  const weekDay = dateObj ? dateObj.toLocaleDateString('ru-RU', { weekday: 'short' }) : null;
  const endDateObj = tour.endDate ? new Date(tour.endDate) : null;
  const isMultiDay = endDateObj && dateObj && endDateObj.getTime() !== dateObj.getTime();

  const themeColor = tour.category?.color || 'slate';
  const badgeStyle = COLOR_THEMES[themeColor] || COLOR_THEMES.slate;

  const badgeLabel = tour.category?.title || 'Тур';
  const displayPrice = tour.currentPrice ?? tour.price; // Выводим переопределенную цену

  return (
    <Link href={`/tour/${tour.slug}`} className="group block outline-none">
      <div className={cn(
        "relative flex items-stretch gap-3 sm:gap-5 p-3 sm:p-4 rounded-[1.5rem] transition-all duration-300",
        "bg-[#0d131a] border-2 border-white/5 hover:border-teal-500/30 hover:bg-slate-900/80 hover:shadow-2xl hover:scale-[0.995]",
        isTba && "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
      )}>
        <div className="w-16 sm:w-24 shrink-0 rounded-xl bg-slate-950/50 border border-white/5 flex flex-col items-center justify-center py-3 shadow-inner group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition-colors">
          {isTba ? (
            <Clock size={24} className="text-slate-300 group-hover:text-teal-400 transition-colors" />
          ) : (
            <>
              <span className="text-2xl sm:text-4xl font-black leading-none text-white group-hover:text-teal-400 transition-colors">{dayNumber}</span>
              <span className="text-[12px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 mt-1">{weekDay}</span>
            </>
          )}
        </div>

        <div className="hidden md:block relative w-28 sm:w-36 h-full min-h-[90px] rounded-xl overflow-hidden shrink-0 border border-white/5">
          <Image src={tour.image || '/placeholder-tour.jpg'} alt={tour.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="150px" />
        </div>

        <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            {badgeLabel && (
              <span className={cn("px-2 py-0.5 rounded-md border backdrop-blur-sm text-[12px]", badgeStyle)}>
                {badgeLabel}
              </span>
            )}
            {tour.duration && <span className="flex items-center text-slate-300">{tour.duration}</span>}
            {isMultiDay && endDateObj && (
              <span className="flex items-center text-slate-300 before:content-['•'] before:mx-1.5 before:text-slate-700">до {endDateObj.getDate()} числа</span>
            )}
          </div>
          
          <h4 className="text-base sm:text-xl font-black text-white leading-tight pr-2 group-hover:text-teal-300 transition-colors mb-2">
            {tour.title}
          </h4>
          
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 font-medium">
            <MapPin size={14} className="shrink-0 text-teal-500/60" strokeWidth={2.5} />
            <span className="truncate">{tour.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 sm:gap-6 shrink-0 pl-1 sm:pl-4">
          <div className="hidden sm:flex flex-col items-end justify-center pr-5 border-r border-white/10 h-full">
            <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest mb-0.5">Билет от</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white leading-none tracking-tight">{Number(displayPrice).toLocaleString()}</span>
              <span className="text-xs font-bold text-teal-500">{tour.currency || 'MDL'}</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-300 group-hover:bg-teal-500 group-hover:border-teal-400 group-hover:text-slate-900 transition-all duration-300 shadow-sm">
            <ChevronRight size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}