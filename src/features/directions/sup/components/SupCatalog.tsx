'use client';

import { useState } from 'react';
import { type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Users, Star, Compass } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 1. Описываем, как выглядит маршрут
type RouteType = { name: string; dist: string; time: string };

// 2. Описываем общую структуру карточки (без цены, но с новыми фичами)
type CatalogItemType = {
  id: string;
  title: string;
  badge: string;
  icon: ElementType;
  description: string;
  duration: string;
  format: string;
  features: string[]; // Добавили массив для галочек "Что включено"
  locations?: string[]; 
  routes?: RouteType[]; 
};

// 3. Данные каталога со строгой типизацией
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
    <section className="py-12 md:py-18 bg-slate-950 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8">
                Выберите свой <span className="text-teal-500">Формат</span>
            </h2>

            {/* SWITCHER */}
            <div className="bg-slate-900 p-1.5 rounded-2xl border border-white/5 inline-flex gap-1 shadow-2xl">
                <button 
                    onClick={() => setActiveTab('lessons')}
                    className={cn(
                        "relative px-8 py-3 rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-300",
                        activeTab === 'lessons' ? "text-slate-950" : "text-slate-400 hover:text-white"
                    )}
                >
                    {activeTab === 'lessons' && (
                        <motion.div layoutId="catalogTab" className="absolute inset-0 bg-teal-500 rounded-xl" />
                    )}
                    <span className="relative z-10">Занятия</span>
                </button>
                <button 
                    onClick={() => setActiveTab('tours')}
                    className={cn(
                        "relative px-8 py-3 rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-300",
                        activeTab === 'tours' ? "text-slate-950" : "text-slate-400 hover:text-white"
                    )}
                >
                    {activeTab === 'tours' && (
                        <motion.div layoutId="catalogTab" className="absolute inset-0 bg-teal-500 rounded-xl" />
                    )}
                    <span className="relative z-10">Прогулки</span>
                </button>
            </div>
        </div>

        {/* CONTENT CARD (Тот самый полноширинный блок) */}
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 md:p-12 backdrop-blur-md flex flex-col"
            >
                {/* 1. Бейдж и Заголовок */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        {data.badge}
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
                        {data.title}
                    </h3>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium max-w-3xl">
                        {data.description}
                    </p>
                </div>

                {/* 2. Характеристики и Включено (Сетка на 3 колонки) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-white/5">
                    {/* Время */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 text-teal-500 border border-white/5">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Время</p>
                            <p className="text-white font-black text-lg">{data.duration}</p>
                        </div>
                    </div>
                    
                    {/* Особенности */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 text-teal-500 border border-white/5">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Особенности</p>
                            <p className="text-white font-bold text-sm leading-snug">{data.format}</p>
                        </div>
                    </div>

                    {/* Что включено (Список) */}
                    <div className="flex flex-col justify-center gap-2 border-l border-white/5 pl-0 md:pl-6 pt-4 md:pt-0">
                        {data.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                <span className="text-teal-400 font-black">✓</span> 
                                <span>{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Маршруты или Локации */}
                <div className="bg-slate-950/50 rounded-[2rem] p-6 md:p-8 border border-white/5">
                    <p className="text-sm font-bold text-teal-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MapPin size={18} /> 
                        {activeTab === 'lessons' ? "Доступные акватории:" : "Популярные маршруты:"}
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                        {activeTab === 'lessons' 
                            ? data.locations?.map(loc => (
                                <span key={loc} className="px-5 py-3 bg-white/5 rounded-xl text-sm font-bold text-white border border-white/5 hover:border-teal-500/30 transition-colors">
                                    {loc}
                                </span>
                              ))
                            : data.routes?.map(route => (
                                <div key={route.name} className="flex flex-col p-4 bg-white/5 rounded-xl border border-white/5 hover:border-teal-500/30 transition-colors min-w-[160px]">
                                    <span className="text-sm font-black text-white mb-1">{route.name}</span>
                                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                                        {route.dist} <span className="text-teal-500 mx-1">•</span> {route.time}
                                    </span>
                                </div>
                              ))
                        }
                    </div>
                </div>

            </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}