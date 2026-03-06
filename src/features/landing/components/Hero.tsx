"use client";

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
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
  bg_image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_auto/v1771673823/hero-bg_cz1j25.webp'
};

export default function HeroSection({ content = DEFAULT_HERO }: { content?: HeroContent }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // RAF параллакс — заменяет useScroll + useSpring + useTransform
  useEffect(() => {
    let rafId: number;
    let lastScrollY = 0;

    const onScroll = () => { lastScrollY = window.scrollY; };

    const update = () => {
      if (bgRef.current)
        bgRef.current.style.transform = `translateY(${lastScrollY * 0.25}px)`;
      if (textRef.current)
        textRef.current.style.transform = `translateY(${lastScrollY * 0.35}px)`;
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
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden bg-slate-950">

      {/* БГ с параллаксом через ref */}
      <div ref={bgRef} className="absolute inset-0 z-0 overflow-hidden will-change-transform">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={content.bg_image}
            alt="Турклуб Эва"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            quality={85}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-slate-950/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.5)_100%)]" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>
      </div>

      {/* ТЕКСТ с параллаксом через ref */}
      <div
        ref={textRef}
        className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center mt-[-10vh] will-change-transform"
      >
        {/* Девиз */}
        <div className="flex items-center gap-4 mb-6 opacity-0 animate-fade-in-up [animation-delay:200ms]">
          <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
          <span className="text-base md:text-lg font-bold tracking-[0.2em] text-teal-300 uppercase drop-shadow-md">
            {content.tagline}
          </span>
          <div className="h-[1px] w-8 md:w-16 bg-teal-400/50" />
        </div>

        {/* Заголовок — CSS анимации для LCP */}
        <h1 className="relative flex flex-col items-center leading-none text-center">
          <span className="text-6xl sm:text-7xl md:text-8xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-xl block animate-in fade-in slide-in-from-bottom-8 duration-700">
            Турклуб
          </span>
          <span className="text-[35vw] sm:text-[12rem] md:text-[16rem] font-black text-white uppercase tracking-tighter select-none drop-shadow-2xl leading-[0.85] block animate-in fade-in zoom-in-95 duration-1000 delay-150">
            {content.title}
          </span>
        </h1>

        {/* Подзаголовок */}
        <p className="text-xl md:text-3xl text-slate-100 font-medium tracking-wide mt-8 md:mt-10 max-w-2xl leading-relaxed drop-shadow-lg opacity-0 animate-fade-in-up [animation-delay:600ms]">
          {content.subtitle}
        </p>
      </div>

      {/* КНОПКА */}
      <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <button
          aria-label="Прокрутить вниз к турам"
          onClick={handleScrollDown}
          className="flex flex-col items-center gap-3 sm:gap-4 group cursor-pointer pointer-events-auto opacity-0 animate-fade-in-up [animation-delay:1200ms]"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-teal-500 group-hover:border-teal-500 transition-all duration-300 shadow-lg">
            <ArrowDown className="text-white group-hover:text-slate-900 animate-bounce w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
          </div>
        </button>
      </div>
    </section>
  );
}