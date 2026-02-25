"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Waves, Compass, CheckCircle2 } from "lucide-react";
import { FlowTab } from "./KayakingLanding";

interface HeroProps {
  activeTab: FlowTab;
  setActiveTab: (tab: FlowTab) => void;
}

export default function Hero({ activeTab, setActiveTab }: HeroProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
      
      {/* Фон с параллаксом */}
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584228/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2025-06-21_11-50-14-080_a7uba5.jpg" 
          alt="Сплав на байдарках"
          fill
          className="object-cover opacity-60"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/40" />
      </motion.div>

      {/* Главный Контент */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 container mx-auto px-4 text-center mt-12 md:mt-0 flex flex-col items-center"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-950/50 backdrop-blur-md mb-6"
        >
          <Waves size={14} className="text-teal-400 animate-pulse" />
          <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">
            Маршруты по Днестру
          </span>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-8xl lg:text-[7rem] font-black text-white uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl"
        >
          Сплавы на <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">байдарках</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md"
        >
          Водные походы для новичков и тех, кто ищет природу и команду. Перезагрузка на воде. Только ты, весло и бесконечный горизонт.
        </motion.p>

        {/* ПЕРЕКЛЮЧАТЕЛЬ ПОТОКОВ (Toggle) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 inline-flex flex-col sm:flex-row gap-1 w-full sm:w-auto shadow-2xl backdrop-blur-md"
        >
          <button 
            onClick={() => setActiveTab("newbie")}
            className={`relative px-8 py-4 md:py-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'newbie' ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            {activeTab === 'newbie' && (
              <motion.div layoutId="heroTab" className="absolute inset-0 bg-teal-500 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.4)]" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Compass size={18}/> Хочу на сплав
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab("participant")}
            className={`relative px-8 py-4 md:py-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'participant' ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            {activeTab === 'participant' && (
              <motion.div layoutId="heroTab" className="absolute inset-0 bg-teal-500 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.4)]" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <CheckCircle2 size={18}/> Я участник
            </span>
          </button>
        </motion.div>
        
      </motion.div>

      {/* Индикатор скролла вниз */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 pointer-events-none"
      >
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">Вниз</span>
        <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center p-1">
            <motion.div 
              animate={{ y: [0, 12, 0] }} 
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-1 h-2 bg-teal-500 rounded-full"
            />
        </div>
      </motion.div>

    </section>
  );
}