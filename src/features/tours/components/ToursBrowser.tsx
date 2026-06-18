"use client";

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  LayoutGrid, Calendar as CalendarIcon, 
  Flame, Sparkles, Layers, Filter, X, Bell, ArrowRight,
  Compass, Map as MapIcon, Sun, Snowflake, TreePine, Bike, Footprints, MapPin, Anchor, Star, Waves,
  TrendingUp, ArrowDownCircle, Mountain, Tent, Droplets, Baby //   ВСЕ ИКОНКИ НА МЕСТЕ
} from 'lucide-react';
import Link from 'next/link';
import { TourPreview, TourDateItem } from '@/features/tours/types';
import dynamic from 'next/dynamic';
import TourCard from './TourCard';
import { useModalStore } from '@/shared/store/useModalStore'; 
import { cn } from '@/lib/utils';
import SwipeHint from '@/shared/ui/SwipeHint'; 

const CalendarView = dynamic(() => import('./CalendarView'), {
  ssr: true,
  loading: () => (
    <div className="h-[300px] w-full bg-slate-800/30 animate-pulse rounded-[1.5rem] border border-white/5 mt-4" />
  ),
});

// Выносим маппинг за пределы рендера компонента. 
// Сборщик Next.js сам вырежет те иконки, которые не встречаются в БД.
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Compass, Tent, Mountain, Waves, Map: MapIcon, Sun, Snowflake,
  TreePine, Bike, Footprints, MapPin, Anchor, Flame, Star, Droplets, Baby
};

const getIconComponent = (iconName: string, size = 14) => {
  const IconComponent = CATEGORY_ICONS[iconName] || Layers; 
  return <IconComponent size={size} />;
};

interface ToursBrowserProps {
  tours: TourPreview[];
  categories?: any[]; 
  title?: string;
  subtitle?: string;
  limit?: number;
  }

// Слушатель для начальной инициализации фильтра из URL
function ParamsListener({ onChange }: { onChange: (val: string) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Устанавливаем категорию только при маунте, чтобы не было конфликтов
    const cat = searchParams.get('category');
    if (cat) onChange(cat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 
  
  return null;
}

export default function ToursBrowser({ 
    tours = [], 
    categories = [], 
    title = "Афиша Приключений", 
    subtitle = "ТУРЫ КЛУБА",
    limit = 8, // По умолчанию показываем 8, остальные по кнопке "Показать еще"
   }: ToursBrowserProps) {
  
  const openContactModal = useModalStore((state) => state.openContactModal);
  
  //   ИСПРАВЛЕНО: Мгновенный стейт вместо зависимости от роутера Next.js
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(limit); // Для пагинации

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
    // 1. Мгновенно обновляем стейт (нулевая задержка UI)
    setActiveCategory(slug);
    setVisibleCount(limit); // Сбрасываем пагинацию при смене категории
    setIsMobileFiltersOpen(false);

    // 2. Тихо обновляем URL без перезагрузки страницы и запросов на сервер
    const url = new URL(window.location.href);
    if (slug === 'all') {
      url.searchParams.delete('category'); 
    } else {
      url.searchParams.set('category', slug); 
    }
    window.history.replaceState(null, '', url.toString());
  };

  // --- SMART FEED LOGIC (Новая логика: Строгая хронология + Анонсы) ---
const { scheduledTours, tbaTours, allFilteredTours } = useMemo(() => {
  const safeTours = tours || [];
  
  // 1. Фильтрация только по категории (сервер уже отдаёт только актуальные туры)
  const filtered = safeTours.filter(tour => {
    if (activeCategory !== 'all') {
      const tourCategorySlug = tour.category?.slug;
      if (tourCategorySlug !== activeCategory.toLowerCase()) return false;
    }
    return true;
  });

  // 2. Хронологическая сортировка
  const sorted = filtered.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : Infinity;
    const dateB = b.date ? new Date(b.date).getTime() : Infinity;
    return dateA - dateB;
  });

  // 3. Разделение на "С датами" (scheduled) и "Без дат / Анонсы" (tba)
  const scheduled: TourPreview[] = [];
  const tba: TourPreview[] = [];

  sorted.forEach(t => {
    if (!t.date || (t.dates && t.dates.length === 0)) {
      tba.push(t);
    } else {
      scheduled.push(t);
    }
  });

  return { scheduledTours: scheduled, tbaTours: tba, allFilteredTours: sorted };
}, [tours, activeCategory]);;

  const displayScheduled = scheduledTours.slice(0, visibleCount);
  const hasMoreScheduled = visibleCount < scheduledTours.length;

  return (
    <section className="py-8 md:py-24 bg-slate-950 min-h-screen relative overflow-hidden" id="tours">
      
      <Suspense fallback={null}>
        <ParamsListener onChange={setActiveCategory} />
      </Suspense>

      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-teal-900/5 md:blur-[120px] rounded-full pointer-events-none opacity-60" />

      <div className="container relative z-10">
        
        {/* --- HEADER --- */}
        <div className="mb-8 md:mb-14">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md">
                   <CalendarIcon size={14} className="text-teal-400" />
                  <span className="text-[16px] font-bold uppercase tracking-widest text-teal-400">{subtitle}</span>
                </div>
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
                    onClick={() => { setViewMode('grid'); setIsMobileFiltersOpen(false); }}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-full transition-all",
                        viewMode === 'grid' ? "bg-teal-500 text-slate-900 shadow-md" : "bg-transparent text-slate-300 active:bg-white/10"
                    )}
                >
                    <LayoutGrid size={15} strokeWidth={2.5} />
                    <span className="text-[12px] font-bold uppercase tracking-wider mt-0.5">Сетка</span>
                </button>

                <button 
                    onClick={() => { setViewMode('calendar'); setIsMobileFiltersOpen(false); }}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-full transition-all",
                        viewMode === 'calendar' ? "bg-teal-500 text-slate-900 shadow-md" : "bg-transparent text-slate-300 active:bg-white/10"
                    )}
                >
                    <CalendarIcon size={15} strokeWidth={2.5} />
                    <span className="text-[12px] font-bold uppercase tracking-wider mt-0.5">Календарь</span>
                </button>

                <button 
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-full transition-all border",
                        isMobileFiltersOpen ? "bg-slate-800 text-white border-teal-500/50" : "bg-transparent border-transparent text-slate-300 active:bg-white/10"
                    )}
                >
                    {isMobileFiltersOpen ? <X size={15} strokeWidth={2.5}/> : <Filter size={15} strokeWidth={2.5} />}
                    <span className="text-[12px] font-bold uppercase tracking-wider mt-0.5">Фильтры</span>
                </button>
            </div>

            {isMobileFiltersOpen && (
                <div className="overflow-hidden mt-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4">
                        <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest mb-3 block">Категории туров:</span>
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
                            viewMode === 'grid' ? "bg-teal-500 text-slate-900 shadow-lg" : "text-slate-300 hover:text-white"
                        )}
                    >
                        <LayoutGrid size={16}/> <span>Сетка</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all h-full",
                            viewMode === 'calendar' ? "bg-teal-500 text-slate-900 shadow-lg" : "text-slate-300 hover:text-white"
                        )}
                    >
                        <CalendarIcon size={16}/> <span>Календарь</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-white/10 shrink-0 self-center" />

                <div className="flex-1 flex flex-wrap items-center justify-start gap-2 py-1">
                    {displayCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.slug)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-transparent",
                                activeCategory === cat.slug
                                    ? "text-teal-400 bg-teal-500/10 border-teal-500/20" 
                                    : "text-slate-300 hover:text-white hover:bg-white/5"
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
                
                {/* 1. БЛИЖАЙШИЕ ТУРЫ (Сетка + Свайп на мобилке) */}
                {scheduledTours.length > 0 && (
                    <section aria-labelledby="scheduled-tours-heading">
                        <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-white/5 pb-4">
                            <Flame size={18} className="text-amber-500 animate-pulse" />
                            <h2 id="scheduled-tours-heading" className="text-sm md:text-base font-bold uppercase tracking-[0.15em] text-amber-500">
                                Расписание
                            </h2>
                        </div>

                        {/*   УНИФИЦИРОВАННАЯ СЕТКА: Свайп на мобилках, 2-3-4 колонки на больших экранах */}
                        <div className="relative">
                              <div className="mb-3">
                                    <SwipeHint /> </div>
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                               {displayScheduled.map((tour, index) => (
    <div key={tour.id} className="snap-center shrink-0 w-[85vw] md:w-auto h-full">
        <TourCard tour={tour} isHot priority={index === 0} />
    </div>
                                ))}
                            </div>
                            </div>

                        {/* Кнопка "Показать еще" */}
                        {hasMoreScheduled && (
                            <div className="flex justify-center mt-10">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + limit)}
                                    className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-teal-500/10 hover:border-teal-500/30"
                                >
                                    <span className="uppercase tracking-wider text-sm">Показать еще туры</span>
                                    <ArrowDownCircle size={20} className="text-teal-400 group-hover:translate-y-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </section>
                )}

       {/* 2. АНОНСЫ (Туры без дат) */}
                {tbaTours.length > 0 && (
                    <section aria-labelledby="soon-tours-heading">
                        <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-white/5 pb-4">
                            <Sparkles size={18} className="text-slate-300" />
                            <h2 id="soon-tours-heading" className="text-sm md:text-base font-bold uppercase tracking-[0.15em] text-slate-300">
                                Планируй заранее (Анонсы)
                            </h2>
                        </div>

                        {/* УНИФИЦИРОВАННАЯ СЕТКА АНОНСОВ */}
                        <div className="relative">
                              <div className="mb-3">
                                    <SwipeHint /> </div>
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {tbaTours.map((tour, index) => {
                                    // Даем приоритет первой карточке анонса, только если нет запланированных туров
                                    const isFirstCardOnPage = scheduledTours.length === 0 && index === 0;

                                    return (
                                        <div key={tour.id} className="snap-center shrink-0 w-[85vw] md:w-auto h-full opacity-90 hover:opacity-100 transition-opacity">
                                            <TourCard tour={tour} priority={isFirstCardOnPage} />
                                        </div>
                                    );
                                })}
                            </div>
                            </div>
                    </section>
                )}

                {/* 3. ПУСТОЕ СОСТОЯНИЕ */}
                {scheduledTours.length === 0 && tbaTours.length === 0 && (
                    <div className="text-center py-12 md:py-24 px-4 border border-dashed border-white/10 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-teal-500/5 md:blur-[100px] rounded-full" />
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <Sparkles size={28} className="text-teal-500" />
                            </div>
                            
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
                                Расписание формируется
                            </h3>
                            <p className="text-sm md:text-base text-slate-300 font-medium mb-8 max-w-md mx-auto leading-relaxed">
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