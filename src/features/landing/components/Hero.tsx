// src/features/landing/components/Hero.tsx
import React from 'react';
import Image from 'next/image';
import { preload } from 'react-dom'; // ✅ ДОБАВЛЕНО: Нативный preload
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
  // ✅ ИСПРАВЛЕНИЕ: Убрали /f_auto,q_auto/ чтобы не конфликтовать с cloudinary-loader
  bg_image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771673823/hero-bg_cz1j25.webp'
};

export default function HeroSection({ content = DEFAULT_HERO }: { content?: HeroContent }) {
  // ✅ ИСПРАВЛЕНИЕ (Fix 2): Принудительный preload изображения прямо в потоке рендеринга.
  // Это заставляет браузер начать загрузку сразу, не дожидаясь обработки всего CSS/JS.
  preload(content.bg_image, { as: 'image', fetchPriority: 'high' });

  return (
    <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-slate-950">

      {/* БГ статичный для Server Component (Максимальная оптимизация LCP) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={content.bg_image}
            alt="Турклуб Эва"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            quality={75}
            sizes="100vw"
          />
          {/* СЛОИ ЗАТЕМНЕНИЯ — сохранены полностью */}
          <div className="absolute inset-0 bg-slate-950/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.5)_100%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>
      </div>
      
      {/* ТЕКСТОВЫЙ КОНТЕНТ — сохранен полностью */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center mt-[-10vh]">
        
        {/* Надзаголовок */}
        <div className="flex items-center gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
          <span className="text-base md:text-lg font-bold tracking-[0.2em] text-teal-300 uppercase drop-shadow-md">
            {content.tagline}
          </span>
          <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
        </div>

        {/* Главный заголовок (LCP элемент) */}
        <h1 className="relative flex flex-col items-center leading-none text-center">
          <span className="text-6xl sm:text-7xl md:text-8xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-xl block animate-hero-subtitle">
            Турклуб
          </span>
          <span className="text-[35vw] sm:text-[12rem] md:text-[16rem] font-black text-white uppercase tracking-tighter select-none drop-shadow-2xl leading-[0.85] block animate-hero-title">
            {content.title}
          </span>
        </h1>

        {/* Подзаголовок — не LCP, animate-in допустим */}
        <p className="text-xl md:text-3xl text-slate-100 font-medium tracking-wide mt-8 md:mt-10 max-w-2xl leading-relaxed drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:200ms] [animation-fill-mode:both]">
          {content.subtitle}
        </p>
      </div>

      {/* КНОПКА СКРОЛЛА — сохранена полностью */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <a
          href="#tours"
          aria-label="Прокрутить вниз к турам"
          className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer pointer-events-auto animate-in fade-in duration-1000 [animation-delay:500ms] [animation-fill-mode:both]"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-teal-500 group-hover:border-teal-500 transition-[background-color,border-color] duration-300 shadow-lg">
            <ArrowDown className="text-white group-hover:text-slate-900 animate-bounce w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
          </div>
        </a>
      </div>
    </section>
  );
}