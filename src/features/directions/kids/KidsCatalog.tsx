'use client';

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, Calendar as CalendarIcon, 
  Flame, Sparkles, ArrowRight, Bell, Map 
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 👇 ВАЖНО: Проверьте пути импорта ваших компонентов TourCard и CalendarView!
// Скорее всего они лежат в папке туров. Замените пути на свои, если они отличаются.
import TourCard from '@/features/tours/components/TourCard'; 
import CalendarView from '@/features/tours/components/CalendarView'; 
import { useModalStore } from '@/shared/store/useModalStore'; 
import { Tour } from '@/features/tours/types'; 

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KidsCatalogProps {
  tours?: Tour[];
}

export default function KidsCatalog({ tours = [] }: KidsCatalogProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const openContactModal = useModalStore((state) => state.openContactModal);

  // --- SMART FEED LOGIC (Как в вашем ToursBrowser) ---
  const { hotTours, comingSoonTours, allFilteredTours } = useMemo(() => {
    // Если в компонент не передали туры, используем пустой массив
    const safeTours = tours || [];
    
    // Сортировка по дате
    const sorted = safeTours.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : Infinity;
        const dateB = b.date ? new Date(b.date).getTime() : Infinity;
        return dateA - dateB;
    });

    // Разделение на группы (Горящие и Анонсы)
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
  }, [tours]);

  return (
    <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
      
      {/* Фоновое свечение (Янтарное для детей) */}
      <div className="absolute top-0 left-0 w-[600px] h-[500px] bg-amber-900/5 md:blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* --- HEADER --- */}
        <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-both">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 mb-4">
               <CalendarIcon size={14} className="text-amber-400" />
               <span className="text-[12px] font-bold uppercase tracking-widest text-amber-400">Ближайшие даты</span>
            </div>
            <h2 className="text-3xl md:text-5xl uppercase tracking-tighter leading-[0.9] text-white font-black">
                Детские <span className="text-amber-500">Приключения</span>
            </h2>
        </div>

        {/* =======================================================
            ПАНЕЛЬ УПРАВЛЕНИЯ (Сетка / Календарь)
           ======================================================= */}
        <div className="sticky top-4 z-40 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both [animation-delay:150ms]">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-row items-center justify-between gap-4 max-w-fit mx-auto lg:mx-0">
                
                {/* View Switcher */}
                <div className="flex items-center">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all",
                            viewMode === 'grid' ? "bg-amber-500 text-slate-900 shadow-lg" : "text-slate-300 hover:text-white"
                        )}
                    >
                        <LayoutGrid size={16}/> <span>Сетка</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={cn(
                            "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all",
                            viewMode === 'calendar' ? "bg-amber-500 text-slate-900 shadow-lg" : "text-slate-300 hover:text-white"
                        )}
                    >
                        <CalendarIcon size={16}/> <span>Календарь</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-white/10 hidden md:block" />

                {/* Ссылка на общий каталог */}
                <Link 
                    href="/tour?category=kids" 
                    className="hidden md:flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest transition-all group"
                >
                    <Map size={14} className="text-amber-500" />
                    <span>Все туры</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-300"/>
                </Link>
            </div>
        </div>

        {/* =======================================================
            ОТРИСОВКА КОНТЕНТА
           ======================================================= */}
        
        {/* 1. РЕЖИМ КАЛЕНДАРЯ */}
        {viewMode === 'calendar' ? (
             <div className="animate-in fade-in zoom-in duration-300">
                <CalendarView events={allFilteredTours} />
             </div>
        ) : (
            /* 2. РЕЖИМ СЕТКИ (УМНАЯ ЛЕНТА) */
            <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* ГОРЯЩИЕ ТУРЫ */}
                {hotTours.length > 0 && (
                    <section aria-labelledby="hot-tours-main-heading"> {/* 👈 Связали секцию с ID */}
                        <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-white/5 pb-4">
                            <Flame size={18} className="text-amber-500 animate-pulse" />
                            <h3 id="hot-tours-main-heading" className="text-sm md:text-base font-bold uppercase tracking-[0.15em] text-amber-500"> {/* 👈 Добавили ID */}
                                Ближайшие группы (Мест мало)
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotTours.map((tour) => (
                                <TourCard key={tour.id} tour={tour} isHot />
                            ))}
                        </div>
                    </section>
                )}

                {/* АНОНСЫ */}
                {comingSoonTours.length > 0 && (
                    <section aria-labelledby="announcements-main-heading"> {/* 👈 Связали секцию с ID */}
                        <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-white/5 pb-4">
                            <Sparkles size={18} className="text-emerald-500" />
                            <h3 id="announcements-main-heading" className="text-sm md:text-base font-bold uppercase tracking-[0.15em] text-emerald-500"> {/* 👈 Добавили ID */}
                                Планируйте заранее
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-90 hover:opacity-100 transition-opacity">
                            {comingSoonTours.map((tour) => (
                                <TourCard key={tour.id} tour={tour} />
                            ))}
                        </div>
                    </section>
                )}
                {/* ====================================================
                    ПУСТОЕ СОСТОЯНИЕ (ЛИДОГЕНЕРАЦИЯ)
                    ==================================================== */}
                {hotTours.length === 0 && comingSoonTours.length === 0 && (
                    <div className="text-center py-12 md:py-24 px-4 border border-dashed border-white/10 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-amber-500/5 md:blur-[100px] rounded-full" />
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <Sparkles size={28} className="text-amber-500" />
                            </div>
                            
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
                                Расписание формируется
                            </h3>
                            <p className="text-sm md:text-base text-slate-300 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                                Мы готовим новые даты детских туров. Хотите узнать о них первыми или заказать тур для целого класса?
                            </p>
                            
                            <button 
                                onClick={() => openContactModal('Заявка: Junior Академия', 'TOUR')}	
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-slate-950 font-black uppercase tracking-wider rounded-xl hover:bg-amber-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 w-full sm:w-auto"
                            >
                                <Bell size={18} />
                                <span>Уведомить о турах</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="mt-8 text-center md:hidden">
            <Link 
                href="/tour?category=kids" 
                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-white/5 rounded-xl text-white font-bold"
            >
                <Map size={18} className="text-amber-500" />
                <span>Все детские туры в каталоге</span>
            </Link>
        </div>

      </div>
      
      </section>
  );
}