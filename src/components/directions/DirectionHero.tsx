"use client";

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { DirectionData, THEMES } from '@/data/directionsData';
import { cn } from '@/lib/utils';

interface DirectionHeroProps {
  data: DirectionData;
}

export default function DirectionHero({ data }: DirectionHeroProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLDivElement>(null);
  
  const theme = THEMES[data.theme];

  useEffect(() => {
    let rafId: number;
    let lastY = 0;

    const onScroll = () => { lastY = window.scrollY; };
    
    const update = () => {
      // 1. Параллакс и прозрачность фона
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${lastY * 0.4}px)`;
        const viewportH = window.innerHeight || 800;
        const bgOp = Math.max(0.3, 1 - (lastY / (viewportH * 0.8)) * 0.7);
        bgRef.current.style.opacity = String(bgOp);
      }
      
      // 2. Параллакс и исчезновение текста
      if (txtRef.current) {
        txtRef.current.style.transform = `translateY(${lastY * 0.5}px)`; 
        const viewportH = window.innerHeight || 800;
        const txtOp = Math.max(0, 1 - lastY / (viewportH * 0.5));
        txtRef.current.style.opacity = String(txtOp);
      }
      
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight - 80,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative h-[100svh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-slate-950">
      
      {/* ==========================================
          1. МЕДИАСЛОЙ (Фон + Параллакс через RAF)
      ========================================== */}
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 pointer-events-none will-change-transform"
      >
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
        <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10" />
        
        {/* Динамическое цветное свечение из темы */}
        <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
            style={{ 
                background: `radial-gradient(circle at center, transparent 0%, ${theme.glow} 100%)` 
            }}
        />
      </div>

      {/* ==========================================
          2. КОНТЕНТ (Типографика)
      ========================================== */}
      <div 
        ref={txtRef}
        className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center mt-20 will-change-transform"
        style={{ transition: 'none' }}
      >
        
        {/* Динамический бейдж */}
        <div 
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md mb-6 sm:mb-8 shadow-2xl"
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

        {/* Гигантский заголовок (LCP) - МГНОВЕННЫЙ РЕНДЕР БЕЗ DELAY */}
        <h1 
            className="animate-in fade-in zoom-in-95 duration-700 text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl max-w-5xl"
        >
            {data.hero.title}
        </h1>

        {/* Подзаголовок */}
        <p 
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both text-sm sm:text-lg md:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed drop-shadow-md"
        >
            {data.hero.subtitle}
        </p>
        
      </div>

      {/* ==========================================
          3. КНОПКА СКРОЛЛА
      ========================================== */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <button
            onClick={handleScrollDown}
            className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer pointer-events-auto animate-in fade-in duration-1000 delay-500 fill-mode-both"
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
          </button>
      </div>

    </section>
  );
}