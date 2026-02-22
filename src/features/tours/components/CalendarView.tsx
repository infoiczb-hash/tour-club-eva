"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MapPin, Clock, ArrowRight, Calendar as CalendarIcon, Sparkles
} from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 1. Строгий тип для "Развернутого" тура (решает конфликт с type Tour)
type CalendarTour = Omit<Tour, 'date'> & {
  uniqueId: string;
  originalId: string;
  date: string | null;      
  endDate: string | null;   
  guideId: string | null;   
};

interface CalendarViewProps {
  events: Tour[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  
  // --- ЛОГИКА РАЗВЕРТЫВАНИЯ ДАТ (Event Explosion) ---
  const { groupedTours, tbaTours } = useMemo(() => {
    
    // Явно указываем TS, что на выходе будет массив CalendarTour
    const explodedEvents: CalendarTour[] = events.flatMap((tour): CalendarTour[] => {
        let datesArray: any[] = [];
        
        try {
            if (typeof tour.dates === 'string') {
                datesArray = JSON.parse(tour.dates);
            } else if (Array.isArray(tour.dates)) {
                datesArray = tour.dates;
            }
        } catch (e) {
            console.error("Ошибка парсинга дат для тура", tour.id);
        }

        if (datesArray && datesArray.length > 0) {
            return datesArray.map((dateObj, idx) => ({
                ...tour,
                date: dateObj.start || null,
                endDate: dateObj.end || null,
                guideId: dateObj.guide_id || null,
                originalId: tour.id,
                uniqueId: `${tour.id}-${dateObj.start}-${idx}`
            }));
        }
        
        return [{ 
            ...tour, 
            uniqueId: tour.id, 
            originalId: tour.id,
            date: null, 
            endDate: null, 
            guideId: null 
        } as CalendarTour];
    });

    // Сортируем хронологически
    const sorted = explodedEvents.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : Infinity;
        const dateB = b.date ? new Date(b.date).getTime() : Infinity;
        return dateA - dateB;
    });

    const groups: Record<string, CalendarTour[]> = {};
    const tba: CalendarTour[] = [];

    sorted.forEach(tour => {
        if (!tour.date) {
            tba.push(tour);
            return;
        }

        const date = new Date(tour.date);
        const monthKey = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        const formattedKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

        if (!groups[formattedKey]) {
            groups[formattedKey] = [];
        }
        groups[formattedKey].push(tour);
    });

    return { groupedTours: groups, tbaTours: tba };
  }, [events]);

  const monthKeys = Object.keys(groupedTours);

  // --- EMPTY STATE ---
  if (events.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-white/10 rounded-[2rem]">
            <CalendarIcon size={48} className="mb-4 opacity-20" />
            <p>На выбранные фильтры туров не найдено</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      
      {/* 1. ОСНОВНОЙ КАЛЕНДАРЬ */}
      {monthKeys.map((month) => (
        <div key={month} className="mb-12 relative">
            <div className="sticky top-20 z-30 py-4 bg-slate-950/95 backdrop-blur-md border-b border-white/10 mb-2">
                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                    {month}
                </h3>
            </div>
            <div className="flex flex-col">
                {groupedTours[month].map((tour) => (
                    <CalendarRow 
                        key={tour.uniqueId} 
                        tour={tour} 
                    />
                ))}
            </div>
        </div>
      ))}

      {/* 2. АНОНСЫ (БЕЗ ДАТ) */}
      {tbaTours.length > 0 && (
        <div className="mb-12">
            <div className="sticky top-20 z-30 py-4 bg-slate-950/95 backdrop-blur-md border-b border-white/10 mb-2">
                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <Sparkles size={16} />
                    Анонсы (Скоро)
                </h3>
            </div>
            <div className="flex flex-col">
                {tbaTours.map((tour) => (
                    <CalendarRow key={tour.uniqueId} tour={tour} isTba />
                ))}
            </div>
        </div>
      )}

    </div>
  );
}

// 2. UX 2026 ROW COMPONENT
function CalendarRow({ tour, isTba = false }: { tour: CalendarTour, isTba?: boolean }) {
    
    const dateObj = tour.date ? new Date(tour.date) : null;
    const dayNumber = dateObj ? dateObj.getDate() : null;
    const weekDay = dateObj ? dateObj.toLocaleDateString('ru-RU', { weekday: 'short' }) : null;
    
    const endDateObj = tour.endDate ? new Date(tour.endDate) : null;
    const isMultiDay = endDateObj && dateObj && endDateObj.getTime() !== dateObj.getTime();
    
    return (
        <Link href={`/tour/${tour.slug}`} className="group relative block">
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                className="
                    relative flex items-center gap-3 md:gap-6 
                    py-4 md:py-5 px-2 md:px-6
                    border-b border-white/5 
                    hover:bg-white/[0.03] transition-colors duration-200
                "
            >
                {/* 1. КОЛОНКА ДАТЫ (Компактная для моб.) */}
                <div className={cn(
                    "flex flex-col items-center justify-center min-w-[55px] md:min-w-[80px] shrink-0 border-r border-white/10 pr-3 md:pr-6 h-full",
                    isTba ? "opacity-40" : "text-white"
                )}>
                    {isTba ? (
                        <Clock size={20} className="text-slate-400 md:w-6 md:h-6 mb-1" />
                    ) : (
                        <>
                            <span className="text-xl md:text-3xl font-black leading-none text-white group-hover:text-teal-400 transition-colors">
                                {dayNumber}
                            </span>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                {weekDay}
                            </span>
                        </>
                    )}
                </div>

                {/* 2. КОЛОНКА ИНФО (Фокус на контент) */}
                <div className="flex flex-col gap-1 md:gap-1.5 min-w-0 flex-1 py-0.5">
                    
                    {/* Мета-инфо (Flex-wrap для узких экранов) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {tour.type && (
                            <span className={cn(
                                "text-teal-500",
                                tour.type === 'weekend' && "text-violet-400",
                                tour.type === 'hiking' && "text-emerald-400"
                            )}>
                                {tour.type === 'hiking' ? 'Поход' : tour.type}
                            </span>
                        )}
                        {tour.duration && (
                            <span className="flex items-center gap-1 before:content-['•'] before:mr-1 before:text-slate-700">
                                {tour.duration}
                            </span>
                        )}
                        {isMultiDay && endDateObj && (
                            <span className="flex items-center gap-1 before:content-['•'] before:mr-1 before:text-slate-700 text-slate-400">
                                до {endDateObj.getDate()} числа
                            </span>
                        )}
                    </div>

                    {/* Заголовок (Wrap на моб, Truncate на десктопе) */}
                    <h4 className="text-sm md:text-lg font-bold text-white leading-snug md:leading-tight line-clamp-2 md:truncate pr-2 md:pr-4 group-hover:text-teal-200 transition-colors">
                        {tour.title}
                    </h4>
                    
                    {/* Локация */}
                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400 font-medium mt-0.5">
                        <MapPin size={12} className="shrink-0" /> 
                        <span className="truncate">{tour.location}</span>
                    </div>
                </div>

                {/* 3. КОЛОНКА ДЕЙСТВИЯ (Только десктоп) */}
                <div className="hidden md:flex items-center justify-end pl-2 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:border-teal-500 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all duration-300">
                        <ArrowRight size={18} />
                    </div>
                </div>

            </motion.div>
        </Link>
    );
}