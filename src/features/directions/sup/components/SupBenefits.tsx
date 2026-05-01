"use client";

import React from "react";
import { 
  Leaf, Briefcase, ShieldCheck, Camera, ArrowRight
} from 'lucide-react';
// ✅ ДОБАВЛЕНО: Глобальный оптимизированный хук
import { useInView } from '@/hooks/useInView';
import SwipeHint from '@/shared/ui/SwipeHint'; 

const BENEFITS = [
  { 
    icon: Leaf, 
    title: "Эмоциональная перезагрузка", 
    text: "Формат digital detox. Снижение стресса, красивые локации и тишина воды. Восстановите энергию вдали от городской суеты." 
  },
  { 
    icon: Briefcase, 
    title: "Баланс", 
    text: "Развивает координацию, контроль тела и глубокое дыхание. У воды на 3-5 градусов прохладнее. Идеально в жару + можно искупаться." 
  },
  { 
    icon: ShieldCheck, 
    title: "Безопасно для семьи", 
    text: "Доступно детям с 10 лет самостоятельно и с 3-х совместно со взрослыми. Детские жилеты предоставляем. Прекрасная возможность для времени с семьей." 
  },
  { 
    icon: Camera, 
    title: "Драйв или Эстетика", 
    text: "Выбирайте сами: расслабление плюс потрясающие фотографии для соцсетей с ракурсов, недоступных с берега или быстрое передвижение на воде." 
  }
];

export default function SupBenefits() {
  // ✅ ИСПРАВЛЕНО: Используем внешний хук
  const headerView = useInView({ threshold: 0.1, rootMargin: '-30px' });
  const cardsView = useInView({ threshold: 0.1, rootMargin: '-30px' });

  return (
    <section className="py-8 md:py-16 bg-slate-950 relative overflow-hidden">
      
      {/* Легкое свечение на фоне */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-900/10 md:blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* HEADER */}
        <div 
            ref={headerView.ref}
            style={{ 
              opacity: headerView.inView ? 1 : 0, 
              transform: headerView.inView ? 'translateX(0)' : 'translateX(-20px)', 
              transition: 'opacity 0.6s ease, transform 0.6s ease' 
            }}
            className="text-left mb-8 md:mb-10 max-w-3xl"
        >
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                Почему стоит выбрать <span className="text-teal-500">SUP</span>
            </h2>
            <p className="text-slate-300 text-[14px] md:text-base font-medium leading-relaxed">
                Продуманный до мелочей сервис, где ваша единственная задача — наслаждаться моментом.
            </p>
        </div>

        {/* CARDS SCROLL */}
        <div className="relative" ref={cardsView.ref}>
            <div className="mb-3">
                  <SwipeHint /> </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-2 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {BENEFITS.map((b, i) => (
                <div 
                  key={i}
                  style={{ 
                    opacity: cardsView.inView ? 1 : 0, 
                    transform: cardsView.inView ? 'translateY(0)' : 'translateY(20px)', 
                    transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` 
                  }}
                  className="group shrink-0 snap-center w-[85vw] md:w-auto p-6 md:p-8 bg-slate-900/50 border border-white/5 rounded-[2rem] hover:border-teal-500/30 hover:bg-slate-900 transition-all duration-300 flex flex-row gap-4 md:gap-6 items-start"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors duration-300">
                      <b.icon className="text-teal-400 group-hover:text-slate-900 transition-colors" size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                      <h3 className="text-lg md:text-xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-teal-400 transition-colors leading-tight">
                        {b.title}
                      </h3>
                      <p className="text-[14px] text-slate-300 leading-relaxed font-medium">
                        {b.text}
                      </p>
                  </div>
                </div>
              ))}
            </div>
        </div>

      </div>
    </section>
  );
}