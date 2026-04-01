import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Calendar, ArrowLeft, Tent } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import TourWishlistButton from './TourWishlistButton'; 

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLOR_THEMES: Record<string, string> = {
  slate:   "bg-slate-500 text-white",
  teal:    "bg-teal-500 text-slate-900",
  emerald: "bg-emerald-500 text-slate-900",
  sky:     "bg-sky-500 text-slate-900",
  blue:    "bg-blue-500 text-white",
  violet:  "bg-violet-500 text-white",
  pink:    "bg-pink-500 text-white",
  rose:    "bg-rose-500 text-white",
  orange:  "bg-orange-500 text-slate-900",
  amber:   "bg-amber-500 text-slate-900",
};

interface TourHeroProps {
  tour: Tour;
  isWished: boolean; // ✅ Добавили пропс
}

export default function TourHero({ tour, isWished }: TourHeroProps) {
  
  // ✅ ИСПРАВЛЕНА ЛОГИКА ДАТ: Теперь проверяются и дни, чтобы не было "26 - 26 апреля"
  const renderDateRange = () => {
    if (!tour.date) return 'Дата уточняется';
    
    const startDate = new Date(tour.date);
    const ruDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
    const dayOnly = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });

    if (!tour.endDate) return ruDate.format(startDate);

    const endDate = new Date(tour.endDate);

    // 1. Если даты абсолютно одинаковые (тот же день, месяц и год) — выводим одну дату
    if (
      startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
    ) {
      return ruDate.format(startDate);
    }

    // 2. Если дни разные, но месяц один — выводим "26 — 28 апреля"
    if (startDate.getMonth() === endDate.getMonth()) {
       return `${dayOnly.format(startDate)} — ${ruDate.format(endDate)}`;
    }
    
    // 3. Если месяцы разные — выводим "28 апреля — 2 мая"
    return `${ruDate.format(startDate)} — ${ruDate.format(endDate)}`;
  };

  const getDuration = () => {
    if (tour.duration) return tour.duration;
    if (tour.date && tour.endDate) {
      const start = new Date(tour.date).getTime();
      const end = new Date(tour.endDate).getTime();
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return `${days} дней`;
    }
    return '1 день';
  };

  const themeColor = tour.category?.color || 'teal';
  const badgeStyle = COLOR_THEMES[themeColor] || COLOR_THEMES.teal;
  const typeLabel = tour.category?.title || 'Тур';

  return (
    <section className="relative h-[80vh] min-h-[550px] w-full flex items-end overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <Image
          src={tour.image || '/placeholder-tour.jpg'}
          alt={tour.title || "Тур"}
          fill
          className="object-cover opacity-60"
          priority
          fetchPriority="high"
          quality={65} 
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/60 to-transparent" />
      </div>

   <div className="absolute top-24 left-4 md:left-8 z-20">
        <Link
          href="/tour"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full text-slate-200 hover:text-white transition-all text-[11px] md:text-xs font-bold uppercase tracking-widest shadow-lg group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          В каталог
        </Link>
      </div>

      {/* ✅ ДОБАВЛЕНО: Кнопка добавления в избранное (выровнена симметрично кнопке "В каталог") */}
      <div className="absolute top-24 right-4 md:right-8 z-20">
        <TourWishlistButton tourId={tour.id} initialIsWished={isWished} />
      </div>

      <div className="container mx-auto px-4 relative z-10 pb-4 md:pb-8 pt-32 flex flex-col justify-end h-full">
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4 md:space-y-6 max-w-5xl mt-10">
            <div className="flex flex-wrap gap-2 md:gap-3">
              
              <span className={cn(
                "px-3 py-1 rounded-md text-[14px] md:text-xs font-black uppercase tracking-widest backdrop-blur-md",
                badgeStyle
              )}>
                  {typeLabel}
              </span>

              {tour.label && (
                <span className="px-3 py-1 rounded-md bg-white/20 text-white border border-white/20 text-[14px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    {tour.label}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-[1.1] tracking-tight drop-shadow-xl break-words">
              {tour.title}
            </h1>
            
            {tour.subtitle && (
              <p className="text-sm md:text-lg text-slate-200 font-normal max-w-2xl leading-relaxed opacity-90 break-words">
                {tour.subtitle}
              </p>
            )}

            <div className="pt-6 md:pt-8 mt-4 border-t border-white/10">
                {/* ✅ ИСПРАВЛЕНА СЕТКА: Теперь это grid-cols-2 на мобилке без разрывов */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-y-6 gap-x-8 md:gap-10 text-white">
                    
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] uppercase text-slate-300 font-bold tracking-widest mb-0.5 truncate" title="Локация">Локация</p>
                            <p className="font-bold text-sm md:text-base leading-none truncate" title={tour.location}>{tour.location}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] uppercase text-slate-300 font-bold tracking-widest mb-0.5 truncate" title="Даты">Даты</p>
                            <p className="font-bold text-sm md:text-base leading-none capitalize truncate" title={renderDateRange()}>{renderDateRange()}</p>
                        </div>
                    </div>

                    {/* ✅ ИСПРАВЛЕНО: Убран col-span-2, чтобы вставало в идеальный квадрат 2x2 на мобилках */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <Clock size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] uppercase text-slate-300 font-bold tracking-widest mb-0.5 truncate" title="Длительность">Длительность</p>
                            <p className="font-bold text-sm md:text-base leading-none truncate" title={getDuration()}>{getDuration()}</p>
                        </div>
                    </div>

                    {/* ✅ ДОБАВЛЕНО: Четвертая метрика "Проживание" */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <Tent size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] uppercase text-slate-300 font-bold tracking-widest mb-0.5 truncate" title="Проживание">Проживание</p>
                            <p className="font-bold text-sm md:text-base leading-none truncate" title={tour.accommodation || 'Без проживания'}>
                              {tour.accommodation || 'Без проживания'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </section>
  );
}