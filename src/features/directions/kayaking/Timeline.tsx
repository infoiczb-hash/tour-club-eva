"use client";

import { motion } from "framer-motion";
import { Clock, Coffee, Waves, Tent, Flag, Sparkles, ChevronRight } from "lucide-react"; // 🔥 Добавили ChevronRight
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- ДАННЫЕ ---
const timeline = [
  { 
    time: "08:00-09:00", 
    title: "Сбор и встреча", 
    desc: "Знакомство с гидом. Детальный инструктаж, распределение байдарок и инвентаря.",
    icon: Coffee
  },
  { 
    time: "9:00-10:00", 
    title: "Спуск на воду", 
    desc: "Первые неуверенные гребки быстро сменяются синхронной работой. Входим в ритм реки.",
    icon: Waves
  },
  { 
    time: "13:30", 
    title: "Большой привал", 
    desc: "Швартуемся на пляже. Купаемся, загораем и наслаждаемся Днестром в тени деревьев.",
    icon: Tent
  },
  { 
    time: "17:00-19:00", 
    title: "Финиш", 
    desc: "Выходим на берег, сдаем инвентарь. Трансфер забирает нас обратно. Обмениваемся фото.",
    icon: Flag
  },
];

export default function Timeline() {
  return (
    <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden font-sans border-t border-white/5">
      
      {/* Background Decor */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* 🔥 1. ЗАГОЛОВОК: Выровняли строго по левому краю (text-left) */}
        <div className="mb-10 md:mb-16 text-left max-w-3xl">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                    <Clock size={14} className="text-teal-400" />
                    <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Тайминг сплава на 1 день</span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                    Один день <br className="hidden md:block"/>
                    <span className="text-teal-500">из жизни сплава</span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base font-medium">
                    Идеальный баланс между активной греблей и расслабленным отдыхом на природе.
                </p>
            </motion.div>
        </div>
        
        {/* =========================================
            ГОРИЗОНТАЛЬНЫЙ ТАЙМЛАЙН
            ========================================= */}
        <div className="relative">
            
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-12 pt-2 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {timeline.map((item, idx) => {
              const Icon = item.icon;
              const isLast = idx === timeline.length - 1;

              return (
                <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="relative shrink-0 md:shrink snap-center w-[85vw] sm:w-[320px] md:w-auto md:flex-1 group"
                >
                  
                  {/* 🔥 2. КОМПАКТНАЯ КАРТОЧКА: Иконка и время теперь на одном уровне */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 hover:bg-slate-900/60 hover:border-teal-500/30 transition-all duration-300 h-full flex flex-col justify-start relative z-10">
                    
                    {/* Шапка карточки: Квадратная иконка + Неоновое время */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors">
                            <Icon size={24} strokeWidth={1.5} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 font-mono tracking-tighter drop-shadow-md">
                                {item.time}
                            </span>
                            {idx === 0 && <Sparkles size={14} className="text-amber-400 animate-pulse" />}
                        </div>
                    </div>
                    
                    {/* Заголовок и текст */}
                    <h3 className="text-lg md:text-xl font-black text-white mb-2 uppercase tracking-tight leading-tight group-hover:text-teal-300 transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
                        {item.desc}
                    </p>
                  </div>

                  {/* 🔥 3. СТРЕЛОЧКИ-МОСТЫ МЕЖДУ СЕКЦИЯМИ (На десктопе) */}
                  {!isLast && (
                      <div className="absolute top-1/2 -right-3 md:-right-5 -translate-y-1/2 translate-x-1/2 z-20 w-8 h-8 rounded-full bg-[#020617] border border-white/10 flex items-center justify-center text-teal-500/50 group-hover:text-teal-400 group-hover:border-teal-500/30 transition-all shadow-lg hidden md:flex">
                          <ChevronRight size={16} />
                      </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 🔥 ТРАДИЦИОННАЯ ПОДСКАЗКА "МОТАЙ" (На мобилке) */}
          <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
              <ChevronRight size={14} />
          </div>

        </div>
      </div>
    </section>
  );
}