"use client";

import React from "react";
import { Coffee, Heart, Users, Briefcase, Dog, Baby, ArrowRight } from 'lucide-react';
// ✅ ДОБАВЛЕНО: Глобальный оптимизированный хук
import { useInView } from '@/hooks/useInView';
import SwipeHint from '@/shared/ui/SwipeHint'; 

const FORMATS = [
  { icon: Heart, label: "Романтики/Свиданий" },
  { icon: Users, label: "Для компании друзей" },
  { icon: Coffee, label: "Тимбилдинга" },
  { icon: Dog, label: "Прогулок собакой на воде" },
  { icon: Baby, label: "Для семьи" },
  { icon: Baby, label: "Для развития уверенности" }
];

export default function SupFormats() {
  // ✅ ИСПРАВЛЕНО: Используем внешний хук
  const headerView = useInView({ threshold: 0.1, rootMargin: '-30px' });
  const listView = useInView({ threshold: 0.1, rootMargin: '-30px' });

  return (
    <section className="py-10 md:py-12 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* МИКРО-ЗАГОЛОВОК */}
        <div 
            ref={headerView.ref}
            style={{ 
              opacity: headerView.inView ? 1 : 0, 
              transform: headerView.inView ? 'translateY(0)' : 'translateY(10px)', 
              transition: 'opacity 0.6s ease, transform 0.6s ease' 
            }}
            className="text-left mb-10 md:mb-14"
        >
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 md:mb-10 text-left">
                Идеально подходит <br className="md:hidden" />
                <span className="text-teal-500">для...</span>
            </h2>
        </div>

        {/* ИНТЕРАКТИВНАЯ ЛЕНТА */}
        <div ref={listView.ref} className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-5 md:overflow-visible md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {FORMATS.map((format, i) => {
              const Icon = format.icon;
              return (
                <div 
                  key={i}
                  style={{ 
                    opacity: listView.inView ? 1 : 0, 
                    transform: listView.inView ? 'translateY(0)' : 'translateY(20px)', 
                    transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` 
                  }}
                  className="group relative flex-shrink-0 snap-center w-[160px] sm:w-[180px] md:w-auto h-[140px] md:h-[160px] bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden transition-all duration-500 hover:border-teal-500/50 hover:bg-slate-900/80 hover:-translate-y-2 shadow-lg"
                >
                  <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/5 transition-colors duration-500 pointer-events-none" />
                  <div className="absolute -bottom-10 w-24 h-24 bg-teal-500/20 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal-500/20 group-hover:-translate-y-1 transition-all duration-300 border border-white/5 group-hover:border-teal-500/30">
                    <Icon className="text-slate-300 group-hover:text-teal-400 transition-colors duration-300" size={26} strokeWidth={1.5} />
                  </div>
                  
                  <span className="relative z-10 text-xs md:text-sm font-bold text-slate-300 group-hover:text-white uppercase tracking-widest transition-colors duration-300 text-center px-2">
                    {format.label}
                  </span>
                </div>
              );
            })}
          </div>
          <SwipeHint />
        </div>
      </div>
    </section>
  );
}