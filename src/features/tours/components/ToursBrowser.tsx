"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // ✅ ДОБАВИЛИ ДЛЯ URL-ФИЛЬТРОВ
import { 
  LayoutGrid, Calendar as CalendarIcon, 
  Flame, Mountain, Tent, Droplets, Baby, ArrowRight,
  Sparkles, Layers, Filter, X, Bell,
  // ✅ ДОБАВИЛИ ИКОНКИ ДЛЯ МАППЕРА
  Compass, Map as MapIcon, Sun, Snowflake, TreePine, Bike, Footprints, MapPin, Anchor, Star, Waves
} from 'lucide-react';
import Link from 'next/link';
import { Tour } from '@/features/tours/types'; 
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dynamic from 'next/dynamic';
import TourCard from './TourCard';
import type { TourCardProps } from './TourCard';
import { useModalStore } from '@/shared/store/useModalStore'; 

// ❌ БЫЛО ТУТ: const openContactModal = useModalStore((state) => state.openContactModal);

const CalendarView = dynamic(() => import('./CalendarView'), {
  ssr: true,
  loading: () => (
    <div className="h-[300px] w-full bg-slate-800/30 animate-pulse rounded-[1.5rem] border border-white/5 mt-4" />
  ),
});


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ 1. ИНТЕЛЛЕКТУАЛЬНЫЙ МАППЕР ИКОНОК
const getIconComponent = (iconName: string, size = 14) => {
  const icons: Record<string, any> = {
    Compass, Tent, Mountain, Waves, Map: MapIcon, Sun, Snowflake,
    TreePine, Bike, Footprints, MapPin, Anchor, Flame, Star, Droplets, Baby
  };
  const IconComponent = icons[iconName] || Layers; // Дефолтная иконка, если не найдена
  return <IconComponent size={size} />;
};

interface ToursBrowserProps {
  tours: Tour[];
  categories?: any[]; // ✅ ДОБАВИЛИ ДИНАМИЧЕСКИЕ КАТЕГОРИИ
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function ToursBrowser({ 
    tours = [], 
    categories = [], // Принимаем категории с сервера
    title = "Афиша Приключений", 
    subtitle = "ТУРЫ КЛУБА",
    limit = 16 
}: ToursBrowserProps) {
  
  // ✅ ПЕРЕНЕСЛИ ВЫЗОВ ХУКА СЮДА, ВНУТРЬ КОМПОНЕНТА!
  const openContactModal = useModalStore((state) => state.openContactModal);

  // ✅ 2. URL-СИНХРОНИЗАЦИЯ (Вместо локального useState)
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const activeCategory = searchParams.get('category') || 'all';
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  
  // State для мобильных фильтров
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // ✅ 3. ФОРМИРУЕМ СПИСОК КАТЕГОРИЙ (Все + Из Базы)
  const displayCategories = useMemo(() => {
    const allBtn = { id: 'all', slug: 'all', label: 'Все', icon: <Layers size={14}/> };
    
    // Фильтруем только активные категории
    const dbCats = categories.filter(c => c.isActive !== false).map(c => ({
       id: c.id,
       slug: c.slug,
       label: c.title,
       icon: getIconComponent(c.icon)
    }));

    return [allBtn, ...dbCats];
  }, [categories]);
  
  // Хендлер изменения URL
  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category'); // Убираем параметр, если "Все"
    } else {
      params.set('category', slug); // Ставим slug категории
    }
    // Обновляем URL без перезагрузки страницы
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // --- SMART FEED LOGIC ---
  const { hotTours, comingSoonTours, allFilteredTours } = useMemo(() => {
    const safeTours = tours || [];
    
    // ✅ 4. ОБНОВЛЕННАЯ ФИЛЬТРАЦИЯ (поддерживает и новые категории из БД, и старые поля type)
    const filtered = safeTours.filter(tour => {
      if (activeCategory === 'all') return true;
      
      // Ищем либо по новому слагу категории (если связи подгружены), либо по старому текстовому type
      const tourCategorySlug = tour.category?.slug;
      return tourCategorySlug === activeCategory.toLowerCase();
    });

    // 2. Сортировка по дате
    const sorted = filtered.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : Infinity;
        const dateB = b.date ? new Date(b.date).getTime() : Infinity;
        return dateA - dateB;
    });

    // 3. Разделение на группы (для режима СЕТКИ)
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

    // Балансировка (если мало горящих)
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
      
      {/* Background Ambience */}
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
           MOBILE CONTROLS (КОМПАКТНАЯ ПАНЕЛЬ)
           ======================================================= */}
        <div className="lg:hidden mb-8 sticky top-4 z-40">
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                
                {/* 1. СЕТКА */}
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

                {/* 2. КАЛЕНДАРЬ */}
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

                {/* 3. ФИЛЬТРЫ */}
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

            {/* ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ С ЧИПСАМИ */}
            <AnimatePresence>
                {isMobileFiltersOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/10"
                    >
                        <div className="p-4">
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                                Категории туров:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {/* ✅ ИСПОЛЬЗУЕМ ДИНАМИЧЕСКИЕ КАТЕГОРИИ */}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

{/* =======================================================
            DESKTOP CONTROLS (Классическая панель)
           ======================================================= */}
        <div className="hidden lg:block sticky top-4 z-40 mb-12">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-row items-center justify-between gap-4">
                
                {/* View Switcher */}
                <div className="bg-white/5 p-1 rounded-xl flex items-center shrink-0">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all",
                            viewMode === 'grid' ? "bg-teal-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <LayoutGrid size={16}/> <span>Сетка</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all",
                            viewMode === 'calendar' ? "bg-teal-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <CalendarIcon size={16}/> <span>Календарь</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-white/10 shrink-0" />

                {/* Categories (✅ ИСПРАВЛЕНО: Убран flex-wrap, добавлен скролл и выравнивание влево) */}
                <div className="flex-1 flex overflow-x-auto hide-scrollbar items-center justify-start gap-1.5 px-2 mask-edges">
                    {displayCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.slug)}
                            className={cn(
                                "shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-transparent",
                                activeCategory === cat.slug
                                    ? "text-teal-400 bg-teal-500/10 border-teal-500/20" 
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                <div className="w-px h-8 bg-white/10 shrink-0" />

                {/* All Tours Link */}
                <Link 
                    href="/tour" 
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-teal-500 hover:text-slate-900 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all group shrink-0"
                >
                    <span>Все туры</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
            </div>
        </div>

        {/* =======================================================
            CONTENT RENDERER
           ======================================================= */}
        
        {/* 1. CALENDAR VIEW */}
        {viewMode === 'calendar' ? (
             <div className="animate-in fade-in zoom-in duration-300">
                <CalendarView events={allFilteredTours} />
             </div>
        ) : (
            /* 2. GRID VIEW (SMART FEED) */
            <div className="space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
              {/* HOT SECTION */}
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

            {/* COMING SOON SECTION */}
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

                {/* ====================================================
                    UX 2026: ИДЕАЛЬНОЕ ПУСТОЕ СОСТОЯНИЕ (ЛИДОГЕНЕРАЦИЯ)
                    ==================================================== */}
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