"use client";

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  LayoutGrid, Calendar as CalendarIcon, 
  Flame, Mountain, Tent, Droplets, Baby, ArrowRight,
  Sparkles, Layers, Filter, X, Bell,
  Compass, Map as MapIcon, Sun, Snowflake, TreePine, Bike, Footprints, MapPin, Anchor, Star, Waves
} from 'lucide-react';
import Link from 'next/link';
import { Tour } from '@/features/tours/types'; 
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dynamic from 'next/dynamic';
import TourCard from './TourCard';
import { useModalStore } from '@/shared/store/useModalStore'; 

const CalendarView = dynamic(() => import('./CalendarView'), {
  ssr: true,
  loading: () => (
    <div className="h-[300px] w-full bg-slate-800/30 animate-pulse rounded-[1.5rem] border border-white/5 mt-4" />
  ),
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getIconComponent = (iconName: string, size = 14) => {
  const icons: Record<string, any> = {
    Compass, Tent, Mountain, Waves, Map: MapIcon, Sun, Snowflake,
    TreePine, Bike, Footprints, MapPin, Anchor, Flame, Star, Droplets, Baby
  };
  const IconComponent = icons[iconName] || Layers; 
  return <IconComponent size={size} />;
};

interface ToursBrowserProps {
  tours: Tour[];
  categories?: any[]; 
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function ToursBrowser({ 
    tours = [], 
    categories = [], 
    title = "Афиша Приключений", 
    subtitle = "ТУРЫ КЛУБА",
    limit = 16 
}: ToursBrowserProps) {
  
  const openContactModal = useModalStore((state) => state.openContactModal);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const activeCategory = searchParams.get('category') || 'all';
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const displayCategories = useMemo(() => {
    const allBtn = { id: 'all', slug: 'all', label: 'Все', icon: <Layers size={14}/> };
    const dbCats = categories.filter(c => c.isActive !== false).map(c => ({
       id: c.id,
       slug: c.slug,
       label: c.title,
       icon: getIconComponent(c.icon)
    }));
    return [allBtn, ...dbCats];
  }, [categories]);
  
  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category'); 
    } else {
      params.set('category', slug); 
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // --- SMART FEED LOGIC ---
  const { hotTours, comingSoonTours, allFilteredTours } = useMemo(() => {
    const safeTours = tours || [];
    
    // Получаем начало сегодняшнего дня для корректного сравнения
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ ИСПРАВЛЕНИЕ 1: ФИЛЬТРАЦИЯ КАТЕГОРИЙ И ПРОШЕДШИХ ТУРОВ
    const filtered = safeTours.filter(tour => {
      // 1. Фильтр по категории
      if (activeCategory !== 'all') {
        const tourCategorySlug = tour.category?.slug;
        if (tourCategorySlug !== activeCategory.toLowerCase()) return false;
      }

      // 2. Фильтр по времени (отсекаем полностью прошедшие туры)
      if (tour.dates && tour.dates.length > 0) {
        // Оставляем тур, если есть хотя бы одна дата в будущем (или сегодня)
        const hasFutureDate = tour.dates.some((d: any) => {
           const dateToCompare = d.end ? new Date(d.end) : new Date(d.start);
           dateToCompare.setHours(0, 0, 0, 0);
           return dateToCompare >= today;
        });
        if (!hasFutureDate) return false; // Исключаем тур из выдачи
      } else if (tour.date) {
        // Фолбэк на одиночную дату
        const singleDate = new Date(tour.date);
        singleDate.setHours(0, 0, 0, 0);
        if (singleDate < today) return false;
      }
      
      // Туры без дат (анонсы) и туры с будущими датами проходят дальше
      return true;
    });

    const sorted = filtered.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : Infinity;
        const dateB = b.date ? new Date(b.date).getTime() : Infinity;
        return dateA - dateB;
    });

    const now = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(now.getDate() + 14);

    const hot: Tour[] = [];
    const soon: Tour[] = [];

    sorted.forEach(t => {
        if (!t.date) {
            soon.push(t);
            return;
        }
        const tDate = new Date(t.date);
        if (tDate <= twoWeeksLater && tDate >= now) {
            hot.push(t);
        } else {
            soon.push(t);
        }
    });

    if (hot.length < 3 && soon.length > 0) {
        const needed = 3 - hot.length;
        const toMove = soon.splice(0, needed);
        hot.push(...toMove);
    }

    return { hotTours: hot, comingSoonTours: soon, allFilteredTours: sorted };
  }, [tours, activeCategory]);

  const displayHot = limit ? hotTours.slice(0, limit) : hotTours;
  const displaySoon = limit ? comingSoonTours.slice(0, limit) : comingSoonTours;

  return (
    <section className="py-8 md:py-24 bg-slate-950 min-h-screen relative overflow-hidden" id="tours">
      
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-teal-900/5 md:blur-[120px] rounded-full pointer-events-none opacity-60" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* --- HEADER --- */}
        <div className="mb-8 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
               <CalendarIcon size={14} className="text-teal-400" />
              <span className="text-[16px] font-bold uppercase tracking-widest text-teal-400">{subtitle}</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl uppercase tracking-tighter leading-[0.9] text-white font-black">
                {title}
            </h1>
        </div>

        {/* =======================================================
           MOBILE CONTROLS 
           ======================================================= */}
        <div className="lg:hidden mb-8 sticky top-4 z-40">
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                
                <button 
                    onClick={() => {
                        setViewMode('grid');
                        setIsMobileFiltersOpen(false);
                    }}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-full transition-all",
                        viewMode === 'grid' 
                            ? "bg-teal-500 text-slate-900 shadow-md" 
                            : "bg-transparent text-slate-400 active:bg-white/10"
                    )}
                >
                    <LayoutGrid size={15} strokeWidth={2.5} />
                    <span className="text-[12px] font-bold uppercase tracking-wider mt-0.5">Сетка</span>
                </button>

                <button 
                    onClick={() => {
                        setViewMode('calendar');
                        setIsMobileFiltersOpen(false);
                    }}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-full transition-all",
                        viewMode === 'calendar' 
                            ? "bg-teal-500 text-slate-900 shadow-md" 
                            : "bg-transparent text-slate-400 active:bg-white/10"
                    )}
                >
                    <CalendarIcon size={15} strokeWidth={2.5} />
                    <span className="text-[12px] font-bold uppercase tracking-wider mt-0.5">Календарь</span>
                </button>

                <button 
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-full transition-all border",
                        isMobileFiltersOpen 
                            ? "bg-slate-800 text-white border-teal-500/50" 
                            : "bg-transparent border-transparent text-slate-400 active:bg-white/10"
                    )}
                >
                    {isMobileFiltersOpen ? <X size={15} strokeWidth={2.5}/> : <Filter size={15} strokeWidth={2.5} />}
                    <span className="text-[12px] font-bold uppercase tracking-wider mt-0.5">Фильтры</span>
                </button>
            </div>

            {isMobileFiltersOpen && (
                <div 
                    className="overflow-hidden mt-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="p-4">
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                            Категории туров:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {displayCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.slug)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                                        activeCategory === cat.slug
                                            ? "text-teal-900 bg-teal-500 border-teal-500" 
                                            : "text-slate-300 bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* =======================================================
            DESKTOP CONTROLS
           ======================================================= */}
        <div className="hidden lg:block sticky top-4 z-40 mb-12">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-row items-center justify-between gap-4">
                
                <div className="bg-white/5 p-1 rounded-xl flex items-center shrink-0 h-full self-start">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all h-full",
                            viewMode === 'grid' ? "bg-teal-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <LayoutGrid size={16}/> <span>Сетка</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all h-full",
                            viewMode === 'calendar' ? "bg-teal-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <CalendarIcon size={16}/> <span>Календарь</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-white/10 shrink-0 self-center" />

                {/* ✅ ИСПРАВЛЕНИЕ 2: ВАРИАНТ Б (flex-wrap) */}
                <div className="flex-1 flex flex-wrap items-center justify-start gap-2 py-1">
                    {displayCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.slug)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-transparent",
                                activeCategory === cat.slug
                                    ? "text-teal-400 bg-teal-500/10 border-teal-500/20" 
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                <div className="w-px h-8 bg-white/10 shrink-0 self-center" />

                <Link 
                    href="/tour" 
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-teal-500 hover:text-slate-900 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all group shrink-0 h-full self-start"
                >
                    <span>Все туры</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
            </div>
        </div>

        {/* =======================================================
            CONTENT RENDERER
           ======================================================= */}
        
        {viewMode === 'calendar' ? (
             <div className="animate-in fade-in zoom-in duration-300">
                <CalendarView events={allFilteredTours} />
             </div>
        ) : (
            <div className="space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
            {displayHot.length > 0 && (
                <section aria-labelledby="hot-tours-heading">
                    <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-white/5 pb-4">
                        <Flame size={18} className="text-amber-500 animate-pulse" />
                        <h3 id="hot-tours-heading" className="text-sm md:text-base font-bold uppercase tracking-[0.15em] text-amber-500">
                            Ближайшие туры
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayHot.map((tour, index) => (
                            <TourCard key={tour.id} tour={tour} isHot priority={index === 0} />
                        ))}
                    </div>
                </section>
            )}

            {displaySoon.length > 0 && (
                <section aria-labelledby="soon-tours-heading">
                    <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-white/5 pb-4">
                        <Sparkles size={18} className="text-slate-400" />
                        <h3 id="soon-tours-heading" className="text-sm md:text-base font-bold uppercase tracking-[0.15em] text-slate-400">
                            Планируй заранее (Анонсы)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-90 hover:opacity-100 transition-opacity">
                        {displaySoon.map((tour, index) => (
                         <TourCard  
                            key={tour.id} 
                            tour={tour} 
                            priority={displayHot.length === 0 && index === 0} 
                         />
                        ))}
                    </div>
                </section>
             )}

                {displayHot.length === 0 && displaySoon.length === 0 && (
                    <div className="text-center py-12 md:py-24 px-4 border border-dashed border-white/10 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-teal-500/5 md:blur-[100px] rounded-full" />
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <Sparkles size={28} className="text-teal-500" />
                            </div>
                            
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
                                Расписание формируется
                            </h3>
                            <p className="text-sm md:text-base text-slate-400 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                                Мы готовим новые даты в эту категорию. Хотите узнать о них первыми или заказать индивидуальный корпоративный сплав?
                            </p>
                            
                            <button 
                               onClick={() => openContactModal('TOUR', `Запрос уведомления о новых турах (Категория: ${activeCategory})`)}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-950 font-black uppercase tracking-wider rounded-xl hover:bg-teal-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 w-full sm:w-auto"
                            >
                                <Bell size={18} />
                                <span>Уведомить о турах</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </section>
  );
}