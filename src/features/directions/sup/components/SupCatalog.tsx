'use client';

import { useState } from 'react';
import { type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Users, Star, Compass, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 1. Описываем, как выглядит маршрут
type RouteType = { name: string; dist: string; time: string };

// 2. Описываем общую структуру карточки
type CatalogItemType = {
  id: string;
  title: string;
  badge: string;
  icon: ElementType;
  description: string;
  duration: string;
  format: string;
  features: string[];
  locations?: string[]; 
  routes?: RouteType[]; 
};

// 3. Данные каталога
const CATALOG_DATA: Record<'lessons' | 'tours', CatalogItemType> = {
  lessons: {
    id: 'lessons',
    title: "SUP-Занятие",
    badge: "Для новичков",
    icon: Star,
    description: "Идеальный старт. Сфокусируемся на технике, балансе и уверенности, чтобы вы могли наслаждаться прогулками без страха.",
    duration: "1.5 - 2 часа",
    format: "Обучение на суше + практика в акватории. Доступно с 8 лет.",
    features: ["Снаряжение включено", "Инструктаж и сопровождение", "Фото на телефон гида"],
    locations: ["г. Тирасполь", "г. Бендеры", "с. Суклея"],
  },
  tours: {
    id: 'tours',
    title: "SUP-Прогулка",
    badge: "Мини-путешествие",
    icon: Compass,
    description: "Полноценные сплавы по живописным маршрутам. Для тех, кто хочет ветра в волосах и новых горизонтов.",
    duration: "2 - 6 часов",
    format: "Сплав 10-17 км. Доступно с 10 лет (или с 3 лет на доске с родителем).",
    features: ["Снаряжение включено", "Инструктаж и сопровождение", "Красивые фото на воде"],
    routes: [
      { name: "Терновка – Тирасполь", dist: "8 км", time: "2 ч" },
      { name: "Бычок – Бендеры", dist: "10 км", time: "3 ч" },
      { name: "Суклея – Слободзея", dist: "15 км", time: "4 ч" },
      { name: "Тирасполь – Карагаш", dist: "17 км", time: "5 ч" }
    ],
  }
};

export default function SupCatalog() {
  const [activeTab, setActiveTab] = useState<'lessons' | 'tours'>('lessons');
  const data = CATALOG_DATA[activeTab];

  return (
    <section className="py-8 md:py-16 bg-slate-950 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        
        {/* 🔥 HEADER (Только заголовок, без кнопок) */}
        <div className="flex flex-col items-center text-center mb-6 md:mb-10">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
                Выберите свой <br className="hidden md:block" /><span className="text-teal-500">Формат</span>
            </h2>
        </div>

        {/* 🔥 STICKY SWITCHER (Прилипает к верху при скролле) */}
        <div className="sticky top-[70px] md:top-[90px] z-50 py-3 mb-6 md:mb-10 bg-slate-950/90 backdrop-blur-xl -mx-4 px-4 md:mx-0 md:px-0 border-b border-white/5 md:border-none flex justify-center">
            <div className="bg-slate-900 p-1.5 rounded-2xl border border-white/5 inline-flex gap-1 shadow-2xl w-full sm:w-auto">
                <button 
                    onClick={() => setActiveTab('lessons')}
                    className={cn(
                        "relative flex-1 sm:flex-none px-4 md:px-8 py-3 rounded-xl text-[12px] md:text-sm font-bold uppercase tracking-widest transition-all duration-300",
                        activeTab === 'lessons' ? "text-slate-950" : "text-slate-400 hover:text-white"
                    )}
                >
                    {activeTab === 'lessons' && (
                        <motion.div layoutId="catalogTab" className="absolute inset-0 bg-teal-500 rounded-xl shadow-md" />
                    )}
                    <span className="relative z-10">ПРОГУЛКИ</span>
                </button>
                <button 
                    onClick={() => setActiveTab('tours')}
                    className={cn(
                        "relative flex-1 sm:flex-none px-4 md:px-8 py-3 rounded-xl text-[12px] md:text-sm font-bold uppercase tracking-widest transition-all duration-300",
                        activeTab === 'tours' ? "text-slate-950" : "text-slate-400 hover:text-white"
                    )}
                >
                    {activeTab === 'tours' && (
                        <motion.div layoutId="catalogTab" className="absolute inset-0 bg-teal-500 rounded-xl shadow-md" />
                    )}
                    <span className="relative z-10">СПЛАВЫ</span>
                </button>
            </div>
        </div>

        {/* CONTENT CARD */}
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/40 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-12 backdrop-blur-md flex flex-col shadow-xl"
            >
                {/* 1. Бейдж и Заголовок */}
                <div className="mb-6 md:mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
                        {data.badge}
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-3 md:mb-4 leading-none">
                        {data.title}
                    </h3>
                    <p className="text-[14px] md:text-lg text-slate-400 leading-relaxed font-medium max-w-3xl">
                        {data.description}
                    </p>
                </div>

                {/* 🔥 2. СЕТКА ХАРАКТЕРИСТИК (2 колонки на мобилке, 3 на десктопе) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 mb-6 md:mb-10 pb-6 md:pb-10 border-b border-white/5">
                    
                    {/* Время */}
                    <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 text-teal-500 border border-white/5 shadow-inner">
                            <Clock size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Время</p>
                            <p className="text-[14px] md:text-lg text-white font-black">{data.duration}</p>
                        </div>
                    </div>
                    
                    {/* Особенности */}
                    <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 text-teal-500 border border-white/5 shadow-inner">
                            <Users size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Особенности</p>
                            <p className="text-[13px] md:text-sm text-white font-bold leading-snug">{data.format}</p>
                        </div>
                    </div>

                    {/* Что включено (На мобилке занимает обе колонки снизу) */}
                    <div className="col-span-2 md:col-span-1 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 pl-0 md:pl-6 mt-1 md:mt-0">
                        {data.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[13px] md:text-sm text-slate-300 font-medium">
                                <span className="text-teal-400 font-black shrink-0">✓</span> 
                                <span className="leading-snug">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🔥 3. МАРШРУТЫ И ЛОКАЦИИ (Свайп на мобилке) */}
                <div className="bg-slate-950/50 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border border-white/5 relative">
                    <p className="text-[12px] md:text-sm font-bold text-teal-500 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                        <MapPin size={16} /> 
                        {activeTab === 'lessons' ? "Доступные акватории:" : "Популярные маршруты:"}
                    </p>
                    
                    {/* Контейнер со скроллом */}
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 md:pb-0 -mx-5 px-5 md:mx-0 md:px-0 md:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {activeTab === 'lessons' 
                            ? data.locations?.map(loc => (
                                <span key={loc} className="shrink-0 snap-center px-4 md:px-5 py-2.5 md:py-3 bg-slate-900 rounded-xl text-[13px] md:text-sm font-bold text-white border border-white/5 hover:border-teal-500/30 transition-colors shadow-sm">
                                    {loc}
                                </span>
                              ))
                            : data.routes?.map(route => (
                                <div key={route.name} className="shrink-0 snap-center w-[75vw] md:w-auto flex flex-col p-4 bg-slate-900 rounded-xl border border-white/5 hover:border-teal-500/30 transition-colors md:min-w-[180px] shadow-sm">
                                    <span className="text-[14px] md:text-sm font-black text-white mb-1.5">{route.name}</span>
                                    <span className="text-[11px] md:text-xs text-slate-400 uppercase tracking-widest font-bold">
                                        {route.dist} <span className="text-teal-500 mx-1.5">•</span> {route.time}
                                    </span>
                                </div>
                              ))
                        }
                    </div>

                    {/* Подсказка "Мотай" для длинных маршрутов */}
                    {activeTab === 'tours' && (
                        <div className="md:hidden absolute top-5 right-5 flex items-center gap-1 text-teal-500/80 animate-pulse pointer-events-none">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Мотай</span>
                            <ChevronRight size={12} />
                        </div>
                    )}
                </div>

            </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}