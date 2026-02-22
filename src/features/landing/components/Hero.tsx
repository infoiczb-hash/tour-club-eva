"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export interface HeroContent {
  title: string;
  subtitle: string;
  tagline: string;
  bg_image: string;
}

const DEFAULT_HERO: HeroContent = {
  title: 'ЭВА',
  subtitle: 'Приключения каждые выходные',
  tagline: 'ОПЫТ — КОТОРЫЙ ВДОХНОВЛЯЕТ', // ✅ Вернул девиз
  bg_image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771673823/hero-bg_cz1j25.webp'
};

export default function HeroSection({ content = DEFAULT_HERO }: { content?: HeroContent }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- PARALLAX EFFECT ---
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], [0, 400]); 
  const yText = useTransform(scrollY, [0, 500], [0, 250]); 

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <section ref={containerRef} className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-slate-950">
      
      {/* 1. BACKGROUND */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
         <div className="relative w-full h-[120%] -top-[10%]">
             <Image 
                src={content.bg_image} 
                alt="Турклуб Эва" 
                fill
                className="object-cover object-center"
                priority
                quality={75}
                sizes="100vw"
             />
             <div className="absolute inset-0 bg-slate-950/30" />
             <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
         </div>
      </motion.div>

      {/* 2. CONTENT */}
      <motion.div 
        style={{ y: yText }}
        className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center"
      >
         
         {/* A. ДЕВИЗ (TAGLINE) */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="flex items-center gap-4 mb-4"
         >
            <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
            <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-teal-300 uppercase shadow-black/50 drop-shadow-md">
                {content.tagline}
            </span>
            <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
         </motion.div>

         {/* B. ЗАГОЛОВОК ГРУППЫ */}
         <div className="relative flex flex-col items-center leading-none">
             {/* "ТУРКЛУБ" */}
             <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-2 md:mb-4 block"
             >
                Турклуб
             </motion.span>
             
             {/* "ЭВА" (Massive) */}
             <motion.h1 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
               className="text-[25vw] md:text-[16rem] font-black text-white uppercase tracking-tighter select-none mix-blend-overlay opacity-90 leading-[0.8]"
             >
                {content.title}
             </motion.h1>
         </div>

         {/* C. ПОДЗАГОЛОВОК */}
         <motion.p 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.6 }}
           className="text-lg md:text-2xl text-slate-200 font-medium tracking-wide mt-6 md:mt-8 max-w-xl leading-relaxed drop-shadow-lg"
         >
            {content.subtitle}
         </motion.p>

      </motion.div>

      {/* 3. SCROLL BUTTON */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        onClick={handleScrollDown}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 group cursor-pointer"
      >
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/70 group-hover:text-teal-400 transition-colors">
              Погнали
          </span>
          
          <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center group-hover:bg-teal-500 group-hover:border-teal-500 transition-all duration-300">
              <ArrowDown size={20} className="text-white group-hover:text-slate-900 animate-bounce" />
          </div>
      </motion.button>

    </section>
  );
}