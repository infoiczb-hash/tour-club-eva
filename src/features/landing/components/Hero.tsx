"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
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
  tagline: 'ОПЫТ — КОТОРЫЙ ВДОХНОВЛЯЕТ',
  bg_image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771673823/hero-bg_cz1j25.webp'
};

export default function HeroSection({ content = DEFAULT_HERO }: { content?: HeroContent }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- PREMIUM PARALLAX EFFECT ---
  const { scrollY } = useScroll();
  // Сглаживаем скролл для эффекта "дорогой" анимации
  const smoothY = useSpring(scrollY, { damping: 25, stiffness: 120 });
  const yBg = useTransform(smoothY, [0, 1000], [0, 250]); 
  const yText = useTransform(smoothY, [0, 800], [0, 350]); 

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <section ref={containerRef} className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-slate-950">
      
      {/* 1. BACKGROUND WITH PARALLAX */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
         <div className="relative w-full h-[120%] -top-[10%]">
             <Image 
                src={content.bg_image} 
                alt="Турклуб Эва" 
                fill
                className="object-cover object-center"
                priority
                quality={80}
                sizes="100vw"
             />
             
             {/* Base Darkening */}
             <div className="absolute inset-0 bg-slate-950/30" />
             
             {/* Vignette (Мягкое затемнение по краям для фокуса на тексте) */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.5)_100%)]" />
             
             {/* Film Grain Effect (Легкое зерно) */}
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E')] opacity-10 mix-blend-overlay pointer-events-none" />
             
             {/* Bottom Fade */}
             <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
         </div>
      </motion.div>

      {/* 2. CONTENT */}
      <motion.div 
        style={{ y: yText }}
        className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center mt-[-10vh]"
      >
         
         {/* A. ДЕВИЗ (TAGLINE) */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
           className="flex items-center gap-4 mb-6"
         >
            <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
            <span className="text-base md:text-lg font-bold tracking-[0.2em] text-teal-300 uppercase drop-shadow-md">
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
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="text-6xl sm:text-7xl md:text-8xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-xl block"
             >
                Турклуб
             </motion.span>
             
             {/* "ЭВА" (Massive Solid Text) */}
             <motion.h1 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
               className="text-[35vw] sm:text-[12rem] md:text-[16rem] font-black text-white uppercase tracking-tighter select-none drop-shadow-2xl leading-[0.85]"
             >
                {content.title}
             </motion.h1>
         </div>

         {/* C. ПОДЗАГОЛОВОК */}
         <motion.p 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
           className="text-xl md:text-3xl text-slate-100 font-medium tracking-wide mt-8 md:mt-10 max-w-2xl leading-relaxed drop-shadow-lg"
         >
            {content.subtitle}
         </motion.p>

      </motion.div>

      {/* 3. SCROLL BUTTON */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            onClick={handleScrollDown}
            className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer pointer-events-auto"
          >
              <span className="text-xs sm:text-base font-bold tracking-[0.2em] text-white/70 uppercase group-hover:text-white transition-colors drop-shadow-md">
                  Погнали
              </span>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-teal-500 group-hover:border-teal-500 transition-all duration-300 shadow-lg">
                  <ArrowDown className="text-white group-hover:text-slate-900 animate-bounce w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              </div>
          </motion.button>
      </div> </section> 
  );
  }
