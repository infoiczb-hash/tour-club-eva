"use client";

import { motion } from "framer-motion";
import { Clock, Coffee, Waves, Tent, Flag, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- ДАННЫЕ ---
const timeline = [
  { 
    time: "09:00", 
    title: "Сбор и подготовка", 
    desc: "Встречаемся на базе. Пьем утренний кофе, знакомимся с командой. Гид выдает гермомешки, жилеты и проводит детальный инструктаж.",
    icon: Coffee
  },
  { 
    time: "10:00", 
    title: "Спуск на воду", 
    desc: "Распределяемся по экипажам. Первые неуверенные гребки быстро сменяются синхронной работой. Входим в ритм реки.",
    icon: Waves
  },
  { 
    time: "13:30", 
    title: "Большой привал", 
    desc: "Швартуемся на диком песчаном пляже. Купаемся, загораем и наслаждаемся плотным походным обедом в тени деревьев.",
    icon: Tent
  },
  { 
    time: "17:00", 
    title: "Финиш и объятия", 
    desc: "Выходим на берег, сдаем инвентарь. Трансфер забирает нас обратно. Обмениваемся контактами и фото.",
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
        
        {/* Заголовок */}
        <div className="mb-16 md:mb-24 text-center md:text-left max-w-3xl">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                    <Clock size={14} className="text-teal-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Тайминг</span>
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
            
          {/* Контейнер со свайпом (Snap) для мобильных */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-12 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
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
                    // МАГИЯ АДАПТИВА: shrink-0 для мобайла, чтобы карточки не сжимались, 
                    // и md:shrink md:w-auto md:flex-1 для десктопа, чтобы делили экран поровну
                    className="relative shrink-0 md:shrink snap-center w-[85vw] sm:w-[320px] md:w-auto md:flex-1 group"
                >
                  
                  {/* ВЕРХНЯЯ ЧАСТЬ: Узел таймлайна и линия */}
                  <div className="flex items-center mb-6 relative">
                      {/* Сам круглый узел */}
                      <div className="relative z-10 w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-teal-500/40 group-hover:bg-slate-800 transition-all duration-300 shrink-0">
                          {/* Пульсирующий фон при наведении */}
                          <div className="absolute inset-0 bg-teal-500 rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          <Icon size={24} className="text-teal-500 group-hover:text-teal-400 relative z-10 transition-colors" strokeWidth={1.5} />
                      </div>

                      {/* Линия соединения (скрываем у последней карточки) */}
                      {!isLast && (
                          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent md:to-white/10 ml-4 group-hover:from-teal-500/30 transition-colors duration-500" />
                      )}
                  </div>

                  {/* НИЖНЯЯ ЧАСТЬ: Карточка с контентом */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 hover:bg-slate-900/60 hover:border-teal-500/30 transition-all duration-300 h-full min-h-[220px] flex flex-col justify-start">
                    
                    {/* Время (Стилизация под неоновые часы) */}
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 font-mono tracking-tighter drop-shadow-md">
                            {item.time}
                        </span>
                        {idx === 0 && <Sparkles size={14} className="text-amber-400 animate-pulse" />}
                    </div>
                    
                    {/* Заголовок и текст */}
                    <h3 className="text-lg md:text-xl font-black text-white mb-2 md:mb-3 uppercase tracking-tight leading-tight group-hover:text-teal-300 transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                        {item.desc}
                    </p>

                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}