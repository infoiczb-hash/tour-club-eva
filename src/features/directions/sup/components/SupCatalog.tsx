'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Navigation, Map, X, Compass, ChevronRight, Waves, Trees, Tent } from 'lucide-react';
import Image from 'next/image';

const ROUTES_DATA = {
    'rivers': [
        {
            id: 'turunchuk',
            title: "Река Турунчук",
            level: "Средний",
            time: "3-4 часа",
            desc: "Извилистая река с течением. Отличный вариант для тех, кто уже стоял на сапе и хочет насладиться пейзажами.",
            img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_19-35-10_qhfxnb.jpg",
            gallery: ["https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_19-35-10_qhfxnb.jpg", "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_15-27-17_afgjtz.jpg"],
            points: ["Инструктаж", "Сплав 10 км", "Привал на косе", "Финиш"]
        },
        {
            id: 'dniester',
            title: "Река Днестр",
            level: "Новичок",
            time: "2-3 часа",
            desc: "Широкая река со спокойным течением. Идеально для первых шагов, семейного отдыха и неспешных прогулок.",
            img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg",
            gallery: ["https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg", "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_19-35-45_ldctdt.jpg"],
            points: ["Инструктаж", "Сплав 6 км", "Фотосессия", "Финиш"]
        }
    ],
    'lakes': [
        {
            id: 'goiany',
            title: "Гоянский Залив",
            level: "Любой",
            time: "2 часа",
            desc: "Стоячая вода, отсутствие течения и потрясающие виды на заповедник Ягорлык. Полный релакс и безопасность.",
            img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_15-39-18_wwdqoo.jpg",
            gallery: ["https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_15-39-18_wwdqoo.jpg", "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609706/photo_2026-02-20_15-27-17_2_uzrahg.jpg"],
            points: ["Инструктаж", "Прогулка по заливу", "Купание", "Возвращение"]
        }
    ],
    'rental': [
         {
            id: 'rent-day',
            title: "Прокат на день",
            level: "Самостоятельно",
            time: "24 часа",
            desc: "Возьмите премиальный сапборд с собой на озеро или реку. В комплекте: доска, весло, насос, лиш, жилет и рюкзак.",
            img: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609412/sup_fl75zk.webp",
            gallery: ["https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609412/sup_fl75zk.webp"],
            points: ["Инструктаж по накачиванию", "Выдача снаряжения", "Самостоятельный отдых", "Возврат"]
        }
    ]
};

type TabType = 'rivers' | 'lakes' | 'rental';

export default function SupCatalog() {
    const [activeTab, setActiveTab] = useState<TabType>('rivers');
    const [selectedRoute, setSelectedRoute] = useState<any | null>(null);

    const tabs = [
        { id: 'rivers', label: 'Реки', icon: Waves },
        { id: 'lakes', label: 'Озера и заливы', icon: Trees },
        { id: 'rental', label: 'Прокат', icon: Tent }
    ];

    return (
        <section className="py-12 md:py-20 bg-slate-950 text-slate-200 border-t border-white/5 relative overflow-hidden">
            
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* 1. ЗАГОЛОВОК И ТАБЫ */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4 md:mb-6 backdrop-blur-md">
                            <Compass className="w-4 h-4 text-teal-400" />
                            <span className="text-[10px] font-bold tracking-widest text-teal-300 uppercase">Локации</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 md:mb-0">
                            Выбери <span className="text-teal-500">маршрут</span>
                        </h2>
                    </div>

                    {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
                    <div className="inline-flex max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shrink-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`relative shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl text-[12px] md:text-[13px] font-bold uppercase tracking-widest transition-all ${
                                        activeTab === tab.id ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="sup-tab-indicator"
                                            className="absolute inset-0 bg-teal-500 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.4)]"
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon size={16} />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. СЕТКА КАРТОЧЕК */}
                {/* Анимация смены контента табов */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                    >
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {ROUTES_DATA[activeTab].map((route, idx) => (
                                <div
                                    key={route.id}
                                    onClick={() => setSelectedRoute(route)}
                                    className="shrink-0 snap-center w-[85vw] md:w-auto bg-slate-900/50 backdrop-blur-sm rounded-[2rem] overflow-hidden border border-white/5 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] transition-all duration-300 cursor-pointer group flex flex-col animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    {/* Картинка маршрута */}
                                    <div className="relative h-56 md:h-64 w-full overflow-hidden shrink-0">
                                        <Image
                                            src={route.img}
                                            alt={route.title}
                                            fill
                                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                        
                                        {/* Бейджи поверх картинки */}
                                        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                                            <span className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                                                <Navigation size={12} className="text-teal-400" />
                                                {route.level}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                                                <Clock size={12} className="text-teal-400" />
                                                {route.time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Описание */}
                                    <div className="p-6 md:p-8 flex flex-col flex-1 bg-slate-900/20">
                                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-3 group-hover:text-teal-400 transition-colors">
                                            {route.title}
                                        </h3>
                                        <p className="text-[14px] text-slate-400 font-medium leading-relaxed mb-6 flex-1 line-clamp-3">
                                            {route.desc}
                                        </p>
                                        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-teal-500 group-hover:text-teal-400 transition-colors">
                                            <span>Подробнее</span>
                                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                            <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                            <ChevronRight size={14} />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* 3. МОДАЛКА (С Framer Motion для красивого зума) */}
                <AnimatePresence>
                    {selectedRoute && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-slate-950/90 backdrop-blur-xl">
                            <motion.div
                                layoutId={selectedRoute.id} // Связка для зума
                                className="relative w-full h-full md:max-w-4xl md:h-auto md:max-h-[90vh] bg-slate-900 md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                            >
                                {/* Кнопка закрытия */}
                                <button
                                    onClick={() => setSelectedRoute(null)}
                                    className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-3 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-all border border-white/10 shadow-lg"
                                >
                                    <X size={20} />
                                </button>

                                {/* Обложка в модалке */}
                                <div className="w-full h-[35vh] md:h-[40vh] relative shrink-0">
                                    <Image
                                        src={selectedRoute.img}
                                        alt={selectedRoute.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 1024px"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                </div>

                                {/* Контент модалки */}
                                <div className="flex flex-col p-6 md:p-10 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest text-teal-400 border border-white/10">
                                            <Navigation size={14} /> {selectedRoute.level}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest text-teal-400 border border-white/10">
                                            <Clock size={14} /> {selectedRoute.time}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase mb-4 leading-tight tracking-tight">
                                        {selectedRoute.title}
                                    </h3>
                                    <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium mb-8">
                                        {selectedRoute.desc}
                                    </p>

                                    {/* План маршрута (Таймлайн) */}
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Map size={14} /> План маршрута
                                        </h4>
                                        <div className="space-y-4">
                                            {selectedRoute.points.map((point: string, idx: number) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-6 h-6 rounded-full bg-teal-500/10 border border-teal-500/50 flex items-center justify-center shrink-0">
                                                            <div className="w-2 h-2 bg-teal-400 rounded-full" />
                                                        </div>
                                                        {idx !== selectedRoute.points.length - 1 && (
                                                            <div className="w-px h-full bg-white/10 mt-2" />
                                                        )}
                                                    </div>
                                                    <div className="pb-4">
                                                        <span className="text-sm md:text-base font-bold text-white">{point}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </section>
    );
}