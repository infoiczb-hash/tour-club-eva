"use client";

import React, { useRef, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';

interface HeroParallaxWrapperProps {
  background: React.ReactNode;
  content: React.ReactNode;
  theme: any;
}

export default function HeroParallaxWrapper({ background, content, theme }: HeroParallaxWrapperProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    let ticking = false; // Флаг блокировки лишних вызовов

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          const viewportH = window.innerHeight || 800;

          if (bgRef.current) {
            bgRef.current.style.transform = `translateY(${y * 0.4}px)`;
            const bgOp = Math.max(0.3, 1 - (y / (viewportH * 0.8)) * 0.7);
            bgRef.current.style.opacity = String(bgOp);
          }

          if (txtRef.current) {
            txtRef.current.style.transform = `translateY(${y * 0.5}px)`;
            const txtOp = Math.max(0, 1 - y / (viewportH * 0.5));
            txtRef.current.style.opacity = String(txtOp);
          }

          ticking = false; // Снимаем блокировку после отрисовки кадра
        });

        ticking = true; // Блокируем новые вызовы до завершения кадра
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollDown = () => {
    window.scrollTo({ top: window.innerHeight - 80, behavior: 'smooth' });
  };

  return (
    <section className="relative h-[100svh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-slate-950">
      
      {/* СЛОЙ 1: Фон (получает готовый HTML с сервера) */}
      <div ref={bgRef} className="absolute inset-0 z-0 pointer-events-none will-change-transform">
        {background}
      </div>

      {/* СЛОЙ 2: Текст (получает готовый HTML с сервера) */}
      <div ref={txtRef} className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center mt-20 will-change-transform" style={{ transition: 'none' }}>
        {content}
      </div>

      {/* СЛОЙ 3: Интерактивная кнопка */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <button
          onClick={handleScrollDown}
          className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer pointer-events-auto animate-in fade-in duration-1000 delay-500 fill-mode-both"
        >
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition-all duration-500 shadow-lg backdrop-blur-sm"
            style={{
              borderColor: `${theme.glow.replace('0.4', '0.3')}`,
              backgroundColor: 'rgba(255,255,255,0.05)',
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