// src/features/landing/components/Hero.tsx
import React from 'react';
import Image from 'next/image';
import { preload } from 'react-dom';
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
  tagline: 'ОПЫТ, КОТОРЫЙ ВДОХНОВЛЯЕТ',
  bg_image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771673823/hero-bg_cz1j25.webp'
};

export default function HeroSection({ content = DEFAULT_HERO }: { content?: HeroContent }) {
  preload(content.bg_image, { as: 'image', fetchPriority: 'high' });

  return (
    <section className="relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden bg-slate-950">

      {/* Фон */}
      <div className="absolute inset-0 z-0">
        <Image
          src={content.bg_image}
          alt="Турклуб Эва — походы и путешествия"
          fill
          className="object-cover object-center"
          unoptimized 
          priority
          fetchPriority="high"
          quality={75}
          sizes="100vw"
        />
        {/* Затемнение */}
        <div className="absolute inset-0 bg-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_40%,rgba(2,6,23,0.6)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[35vh] bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      {/* Основной контент — левый столбец */}
     <div className="relative z-10 flex flex-col justify-center flex-1 container mx-auto px-5 sm:px-8 md:px-10 pt-28 md:pt-32 lg:pt-40 pb-4">

      {/* Надзаголовок */}
        <div className="flex items-center gap-3 md:gap-4 mb-5 sm:mb-6 animate-hero-subtitle">
          <span className="text-sm sm:text-base md:text-lg font-black tracking-[0.25em] text-teal-400 uppercase drop-shadow-md">
            {content.tagline}
          </span>
          <div className="h-px w-10 sm:w-16 md:w-24 bg-teal-400/60" />
        </div>

        {/* Заголовок */}
        <h1 className="flex flex-col leading-[0.85] mb-6 sm:mb-8 animate-hero-title">
          <span className="text-[15vw] sm:text-[13vw] md:text-[10vw] lg:text-[9rem] font-black text-white uppercase tracking-tight drop-shadow-2xl">
            ТУРКЛУБ
          </span>
          {/* Делаем слово ЭВА гигантским и добавляем легкий металлический/белый градиент для объема */}
          <span className="text-[28vw] sm:text-[22vw] md:text-[18vw] lg:text-[16rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 uppercase tracking-tighter leading-[0.8] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] pb-2">
            {content.title}
          </span>
        </h1>

        {/* Подзаголовок */}
        {/* ✅ ИСПРАВЛЕНО: text-bsae заменено, размеры сильно увеличены */}
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-100 font-bold max-w-sm sm:max-w-xl md:max-w-2xl leading-snug md:leading-relaxed mb-8 sm:mb-10 animate-hero-subtitle drop-shadow-lg">
          {content.subtitle}
        </p>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3 sm:gap-5 animate-hero-subtitle">
          <a
            href="#tours"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl transition-colors duration-200 shadow-lg shadow-teal-900/30"
          >
            ВЫБРАТЬ ПРИКЛЮЧЕНИЕ
            <span className="text-base">→</span>
          </a>
          <a
            href="/about"
            className="inline-flex items-center gap-2 border border-white/25 hover:border-white/50 text-white font-bold text-xs sm:text-sm uppercase tracking-widest px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl transition-colors duration-200 backdrop-blur-sm"
          >
            О КЛУБЕ
            <span className="text-base">→</span>
          </a>
        </div>
      </div>

      {/* Статистика + стрелка — прижаты к низу */}
      <div className="relative z-10 container mx-auto px-5 sm:px-8 md:px-10 pb-6 sm:pb-8">
        <div className="flex items-center justify-between">

    {/* Статы */}
          <div className="flex items-center gap-6 sm:gap-8 md:gap-12 w-full justify-between sm:justify-start">
            
            {/* 1. Участники (СКРЫВАЕМ НА МОБИЛКАХ: hidden sm:flex) */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <div>
                <p className="text-white font-black text-base sm:text-xl leading-none">500+</p>
                <p className="text-slate-400 text-xs sm:text-xs uppercase tracking-wider mt-0.5">участников</p>
              </div>
            </div>

            {/* Разделитель 1 (СКРЫВАЕМ НА МОБИЛКАХ: hidden sm:block) */}
            <div className="hidden sm:block w-px h-8 bg-white/10" />

            {/* 2. Маршруты (ОСТАВЛЯЕМ ВЕЗДЕ) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
              <div>
                <p className="text-white font-black text-base sm:text-xl leading-none">30+</p>
                <p className="text-slate-400 text-xs sm:text-xs uppercase tracking-wider mt-0.5">маршрутов</p>
              </div>
            </div>

            {/* Разделитель 2 (ОСТАВЛЯЕМ ВЕЗДЕ) */}
            <div className="w-px h-8 bg-white/10" />

            {/* 3. Опыт (ОСТАВЛЯЕМ ВЕЗДЕ) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <div>
                <p className="text-white font-black text-base sm:text-xl leading-none">5 лет</p>
                <p className="text-slate-400 text-xs sm:text-xs uppercase tracking-wider mt-0.5">приключений</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}