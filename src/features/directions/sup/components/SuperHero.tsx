'use client';

import { motion } from 'framer-motion';
import { Waves, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Добавим пропс onScrollDown, чтобы по клику страница плавно ехала к каталогу
export default function SuperHero({ onScrollDown }: { onScrollDown?: () => void }) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden border-b border-white/5 min-h-[70vh]">
      
      {/* 1. ФОНОВОЕ ИЗОБРАЖЕНИЕ */}
      <div className="absolute inset-0 z-0">
        <Image 
           src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771613780/SUP-bg_hmisrk.webp" 
           alt="SUP Background"
           fill
           className="object-cover opacity-60"
           priority
        />
        {/* Градиент для читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950" />
      </div>

      <div className="relative z-10 container mx-auto px-4 w-full pt-20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            {/* 2. ЗАГОЛОВОК */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center"
            >
                {/* Бейдж */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 backdrop-blur-md rounded-full mb-6 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                    <Waves className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold tracking-[0.2em] text-teal-300 uppercase">SUP-прогулки</span>
                </div>
                
                <h1 className="text-5xl md:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tight">
                    СКОЛЬЗИ<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">ПО ВОДЕ</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-300 mb-10 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                   Ваше идеальное мини-путешествие. Никакого шума и спешки — только вы, доска и природа. Открываем знакомые места с совершенно нового ракурса.
                </p>
            </motion.div>

            {/* 3. ЕДИНАЯ КНОПКА CTA */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <button 
                    onClick={onScrollDown}
                    className="group relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-teal-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(20,184,166,0.3)]"
                >
                    {/* Блик на кнопке при наведении */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <span className="relative z-10">Выбрать программу</span>
                    <ArrowDown className="relative z-10 w-5 h-5 group-hover:translate-y-1 transition-transform" strokeWidth={2.5} />
                </button>
            </motion.div>

        </div>
      </div>
    </section>
  );
}