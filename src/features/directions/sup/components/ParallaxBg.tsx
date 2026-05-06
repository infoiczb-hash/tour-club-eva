"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function ParallaxBg() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false; // Флаг-блокиратор лишних кадров

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (ref.current) {
            // Смещаем фон на 30% от величины прокрутки (эффект глубины)
            ref.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
          }
          ticking = false; // Освобождаем блокировку после отрисовки кадра
        });
        ticking = true; // Блокируем новые вызовы до завершения текущего кадра
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 z-0" style={{ willChange: 'transform' }}>
      <Image 
        src="https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_75/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg" 
        alt="SUP Hero Background" 
        fill 
        priority 
        fetchPriority="high" 
        quality={75} 
        sizes="100vw" 
        className="object-cover opacity-60" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/40" />
    </div>
  );
}