"use client";

import React from "react";
import { Compass, MessageCircle, BookOpen, ChevronRight, Map, Sparkles } from "lucide-react";
import Link from "next/link";
import { useModalStore } from '@/shared/store/useModalStore';

export default function PromoBlock() {
  // Достаем функции открытия из глобального стора
  const openQuizModal = useModalStore((state) => state.openQuizModal);
  const openContactModal = useModalStore((state) => state.openContactModal);

  // Локальная функция для удобства вызова Центра Связи
  const openHub = (tab: 'TOUR' | 'HR' | 'BLOG' | 'B2B' | 'REVIEW' | 'HELP') => {
      // Вызываем глобальную модалку, передавая нужный таб
      openContactModal(undefined, tab);
  };

  return (
    <section className="relative py-8 md:py-24 bg-[#0B1120] border-t border-white/5 overflow-hidden">
      
      {/* ФОН */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] md:w-[600px] md:h-[600px] bg-teal-900/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none opacity-40" />
      <div className="absolute bottom-0 left-0 w-[150px] h-[150px] md:w-[500px] md:h-[500px] bg-purple-900/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none opacity-30" />

      <div className="container relative z-10 mx-auto px-4 max-w-7xl">
        
        {/* ЗАГОЛОВОК */}
        <div className="flex flex-col items-start mb-6 md:mb-12 max-w-4xl">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-3 md:mb-6">
               <Map size={10} className="text-teal-400 md:w-4 md:h-4" />
               <span className="text-[16px] md:text-xs font-bold uppercase tracking-widest text-teal-300">Спроси совета</span>
           </div>
          
         <h2 className="text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
            <span className="font-light text-slate-300 block md:inline">Не знаете с чего </span>
            <span className="font-black text-white">начать</span>
            <span className="text-teal-500">?</span>
        </h2>
          
          <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed max-w-xs md:max-w-xl">
            Три простых шага, чтоб найти своё идеальное приключение. Понять/Вдохновиться/Спросить.
          </p>
        </div>

       {/* СЕТКА */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 auto-rows-[180px] sm:auto-rows-[200px] md:auto-rows-[280px]">
          
          {/* 1. QUIZ */}
          <div 
            onClick={() => openQuizModal()}
            className="order-2 md:order-1 col-span-1 group cursor-pointer relative overflow-hidden rounded-[2rem] bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-teal-500/50 hover:bg-slate-900/60 transition-all duration-500 flex flex-col p-4 md:p-8"
          >
            <Compass strokeWidth={1} className="absolute -right-4 -top-4 w-32 h-32 md:-right-8 md:-top-8 md:w-48 md:h-48 text-teal-500/5 group-hover:text-teal-500/10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none" />
            
            {/* Иконка */}
            <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-auto border border-teal-500/20 group-hover:scale-110 transition-transform">
                <Sparkles size={16} className="md:w-7 md:h-7" />
            </div>

            {/* Текст */}
            <div className="mt-4 md:mt-8 mb-4">
                <h3 className="text-sm md:text-2xl font-black uppercase text-white leading-tight mb-1 md:mb-3">Подобрать тур</h3>
                <p className="text-[12px] md:text-sm text-slate-400 leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                    Пройди тест и получи нашу рекомендацию для первого тура.
                </p>
            </div>
               
            {/* Кнопка */}
            <div className="flex items-center gap-3 text-teal-400 mt-auto">
                <span className="hidden md:block text-xs font-bold uppercase tracking-widest group-hover:text-teal-300 transition-colors">Начать тест</span>
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                    <ChevronRight size={14} strokeWidth={3} className="md:w-5 md:h-5" />
                </div>
            </div>
          </div>

          {/* 2. BLOG */}
          <Link 
            href="/blog" 
            className="order-3 md:order-2 col-span-1 group relative overflow-hidden rounded-[2rem] bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-amber-500/50 hover:bg-slate-900/60 transition-all duration-500 flex flex-col p-4 md:p-8"
          >
             <BookOpen strokeWidth={1} className="absolute -right-4 -top-4 w-32 h-32 md:-right-8 md:-top-8 md:w-48 md:h-48 text-amber-500/5 group-hover:text-amber-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 pointer-events-none" />

            {/* Иконка */}
            <div className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-auto border border-amber-500/20 group-hover:scale-110 transition-transform">
                <BookOpen size={16} className="md:w-7 md:h-7" />
            </div>

            {/* Текст */}
            <div className="mt-4 md:mt-8 mb-4">
                <h3 className="text-sm md:text-2xl font-black uppercase text-white leading-tight mb-1 md:mb-3">Полевой дневник</h3>
                <p className="text-[12px] md:text-sm text-slate-400 leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                    Размышления, лайфхаки и походные истории из первых уст.
                </p>
            </div>

            {/* Кнопка */}
            <div className="flex items-center gap-3 mt-auto">
                <span className="hidden md:block text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-widest transition-colors">Читать статьи</span>
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-white/10 text-slate-400 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-900 group-hover:translate-x-2 transition-all">
                    <ChevronRight size={14} className="md:w-5 md:h-5" />
                </div>
            </div>
          </Link>

          {/* 3. CENTER OF CONNECTION */}
          <div 
            onClick={() => openHub('TOUR')}
            className="order-1 md:order-3 col-span-2 md:col-span-1 group cursor-pointer relative overflow-hidden rounded-[2rem] bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-sky-500/50 hover:bg-slate-900/80 transition-all duration-500 flex flex-col p-5 md:p-6"
          >
            <MessageCircle strokeWidth={1} className="absolute -right-4 -bottom-4 w-40 h-40 md:-right-8 md:-top-8 md:w-48 md:h-48 text-sky-500/5 group-hover:text-sky-500/10 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 pointer-events-none" />
            
            {/* Иконка */}
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform">
                <MessageCircle size={20} className="md:w-7 md:h-7" />
            </div>

            {/* Текст */}
            <div className="mt-4 md:mt-5 mb-4 max-w-[85%] md:max-w-full relative z-10">
                <h3 className="text-xl md:text-2xl font-black uppercase text-white leading-tight mb-1 md:mb-2">Центр связи</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    Напиши нам в мессенджер, и мы найдем для тебя идеальное решение или маршрут.
                </p>
            </div>
                
            {/* Кнопка */}
            <button 
              type="button" 
              className="flex items-center gap-3 mt-auto justify-end md:justify-start group outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-full transition-all relative z-10"
              onClick={(e) => { 
                e.stopPropagation(); 
                openHub('TOUR');
              }}
            >
              <span className="text-xs font-bold text-sky-500 uppercase tracking-widest group-hover:text-white transition-colors">
                Связаться
              </span>
              
              <div aria-hidden="true" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white group-hover:translate-x-2 transition-all">
                <ChevronRight size={16} className="md:w-5 md:h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}