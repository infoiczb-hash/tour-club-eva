"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { DirectionData, THEMES } from '@/data/directionsData';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface DirectionHeroProps {
  data: DirectionData;
}

export default function DirectionHero({ data }: DirectionHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Достаем цвета текущей темы (например, неоновый синий для SUP)
  const theme = THEMES[data.theme];

  // 1. Плавный параллакс при скролле
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacityBg = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight - 80,
      behavior: 'smooth'
    });
  };

  return (
    <section 
        ref={containerRef} 
        className="relative h-[100svh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-slate-950"
    >
      
      {/* ==========================================
          1. МЕДИАСЛОЙ (Фон + Параллакс)
      ========================================== */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ y: yBg, opacity: opacityBg }}
      >
        {/* Будущий задел под видео: если есть videoUrl, рендерим <video>, иначе <Image> */}
        {data.hero.videoUrl ? (
             <video 
                autoPlay loop muted playsInline 
                className="absolute inset-0 w-full h-full object-cover"
             >
                 <source src={data.hero.videoUrl} type="video/mp4" />
             </video>
        ) : (
            <Image
                src={data.hero.imageUrl}
                alt={data.hero.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
            />
        )}
        
        {/* Сложная оптика (Senior UI) */}
        <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply" /> {/* Базовое затемнение */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10" /> {/* Плавный низ */}
        
        {/* Динамическое цветное свечение из темы */}
        <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
            style={{ 
                background: `radial-gradient(circle at center, transparent 0%, ${theme.glow} 100%)` 
            }}
        />
                </motion.div>

      {/* ==========================================
          2. КОНТЕНТ (Типографика)
          ========================================== */}
      {/* ВАЖНО: Внешний контейнер оставляем motion.div ради эффекта при скролле */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center mt-20"
        style={{ y: yText, opacity: opacityText }}
      >
        
        {/* Динамический бейдж: появляется первым (без задержки) */}
        <div 
            className="animate-fade-in-up opacity-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md mb-6 sm:mb-8 shadow-2xl"
            style={{ 
                backgroundColor: `${theme.glow.replace('0.4', '0.1')}`, 
                borderColor: `${theme.glow.replace('0.4', '0.3')}` 
            }}
        >
            <span 
                className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]"
                style={{ color: theme.hex }}
            >
                {data.hero.badge}
            </span>
        </div>

        {/* Гигантский заголовок (LCP): появляется через 100мс */}
        <h1 
            className="animate-fade-in-up opacity-0 [animation-delay:100ms] text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl max-w-5xl"
        >
            {data.hero.title}
        </h1>

        {/* Подзаголовок: появляется через 200мс */}
        <p 
            className="animate-fade-in-up opacity-0 [animation-delay:200ms] text-sm sm:text-lg md:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed drop-shadow-md"
        >
            {data.hero.subtitle}
        </p>
        
      </motion.div>

      {/* ==========================================
          3. КНОПКА СКРОЛЛА
      ========================================== */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            onClick={handleScrollDown}
            className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer pointer-events-auto"
          >
              <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition-all duration-500 shadow-lg backdrop-blur-sm"
                  style={{ 
                      borderColor: `${theme.glow.replace('0.4', '0.3')}`,
                      backgroundColor: 'rgba(255,255,255,0.05)'
                  }}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.hex;
                      e.currentTarget.style.borderColor = theme.hex;
                      e.currentTarget.style.boxShadow = `0 0 20px ${theme.glow}`;
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = `${theme.glow.replace('0.4', '0.3')}`;
                      e.currentTarget.style.boxShadow = 'none';
                  }}
              >
                  <ArrowDown className="text-white group-hover:text-slate-900 animate-bounce w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              </div>
          </motion.button>
      </div>

    </section>
  );
}