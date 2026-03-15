"use client";

import React from 'react';
import { Bus, Tent, Utensils, SignalHigh, ArrowRight } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const logisticsData = [
    {
        icon: Bus,
        title: "Транспорт",
        desc: "Едем транспорте 8-20 человек прямо из ПМР/Молдовы до точки старта маршрута."
    },
    {
        icon: Tent,
        title: "Ночевки",
        desc: "Спим в гостевых домах, горных приютах, отелях или в палатках в зависимости от маршрута и формата тура. Детали всегда указаны в программе."
    },
    {
        icon: Utensils,
        title: "Питание",
        desc: "Готовим вкусную походную еду на газовых горелках или костре. Учитываем пожелания: если вы вегетарианец — просто предупредите нас заранее."
    },
    {
        icon: SignalHigh,
        title: "Связь",
        desc: "В горах связь часто нестабильна или отсутствует. Это отличный повод для цифрового детокса. Предупредите близких, что можете быть вне зоны."
    }
];

export default function HikesLogistics() {
    const cardsView = useInView({ threshold: 0.1, rootMargin: '-30px' });

    return (
        <section className="py-12 md:py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* --- 1. БЛОК С ЦИТАТОЙ --- */}
                <div className="w-full bg-slate-900 border border-white/5 rounded-[2rem] p-6 md:p-12 mb-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-16 items-start lg:items-center">
                        <div className="flex-1 min-w-0"> 
                            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[1.1] mb-6">
                                В горах нет <br className="hidden md:block"/>
                                <span className="text-teal-500">случайных людей</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium mb-8">
                                «Тур в горы — это ваш личный отдых, а не испытание на прочность. Моя задача как гида — взять на себя всю логистику, чтобы вы могли просто идти, дышать и впитывать красоту вокруг. Мы всегда идем в среднем темпе комфортном для медленных и быстрых участников. Никто никого не бросает».
                            </p>
                            
                            <div className="flex items-center gap-4 pt-6 border-t border-white/10 w-full md:w-max">
                                <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                                    <span className="text-lg font-black text-slate-400">Р</span>
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm md:text-base">Роман Санду</div>
                                    <div className="text-teal-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Туристический гид</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 2. КАРТОЧКИ ЛОГИСТИКИ --- */}
                <div ref={cardsView.ref}>
                    <div className="flex md:hidden items-center gap-2 mb-4 text-slate-400 pl-1">
                        <ArrowRight size={16} className="text-teal-500 animate-pulse" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Листайте карточки вбок</span>
                    </div>

                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        
                        {logisticsData.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div 
                                    key={idx}
                                    style={{ opacity: cardsView.inView ? 1 : 0, transform: cardsView.inView ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.6s ease ${idx * 0.1}s, transform 0.6s ease ${idx * 0.1}s` }}
                                    className="w-[85vw] sm:w-[300px] md:w-auto shrink-0 snap-start bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 hover:bg-slate-900 hover:border-teal-500/30 transition-all group flex flex-col"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                                        <Icon className="text-teal-500" size={24} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-4">{item.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {item.desc}
                                    </p>
                                </div>
                            );
                        })}

                    </div>
                </div>

            </div>
        </section>
    );
}