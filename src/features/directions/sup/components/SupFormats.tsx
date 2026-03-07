'use client';

import { motion } from 'framer-motion';
import { Coffee, Heart, Users, Briefcase, Dog, Baby,ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Наши форматы
const FORMATS = [
  { icon: Heart, label: "Романтики/Свиданий" },
  { icon: Briefcase, label: "Бизнес-встреч" },
  { icon: Users, label: "Для компании друзей" },
  { icon: Coffee, label: "Тимбилдинга" },
  { icon: Dog, label: "Прогулок собакой на воде" },
  { icon: Baby, label: "Для семьи" },
  { icon: Baby, label: "Для развития уверенности" }
];

export default function SupFormats() {
  return (
    <section className="py-10 md:py-12 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* МИКРО-ЗАГОЛОВОК */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14"
        >
           {/* Выровняли по левому краю (text-left) */}
<h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 md:mb-10 text-left">
    Идеально подходит <br className="md:hidden" />
    <span className="text-teal-500">для...</span>
</h2>
        </motion.div>

        {/* ИНТЕРАКТИВНАЯ ЛЕНТА (Glassmorphism) */}
        {/* На мобилке: горизонтальный свайп. На десктопе: сетка в 1 ряд (6 колонок) */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-5 md:overflow-visible md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {FORMATS.map((format, i) => {
            const Icon = format.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="group relative flex-shrink-0 snap-center w-[160px] sm:w-[180px] md:w-auto h-[140px] md:h-[160px] bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden transition-all duration-500 hover:border-teal-500/50 hover:bg-slate-900/80 shadow-lg"
              >
                {/* Неоновое свечение внутри карточки при наведении (эффект погружения) */}
                <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/5 transition-colors duration-500 pointer-events-none" />
                <div className="absolute -bottom-10 w-24 h-24 bg-teal-500/20 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Иконка с анимацией */}
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal-500/20 group-hover:-translate-y-1 transition-all duration-300 border border-white/5 group-hover:border-teal-500/30">
                  <Icon className="text-slate-400 group-hover:text-teal-400 transition-colors duration-300" size={26} strokeWidth={1.5} />
                </div>
                
                {/* Текст */}
                <span className="relative z-10 text-xs md:text-sm font-bold text-slate-400 group-hover:text-white uppercase tracking-widest transition-colors duration-300 text-center px-2">
                  {format.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      {/* 🔥 ПОДСКАЗКА СНИЗУ (только для мобильных) */}
        <div className="md:hidden flex items-center justify-end gap-1.5 mt-4 pr-4 text-slate-500 pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-widest">Мотай</span>
            <ArrowRight size={14} className="text-teal-500 animate-pulse" />
        </div>
      </div>
    </section>
  );
}