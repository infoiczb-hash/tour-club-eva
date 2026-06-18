import React from 'react';
import Image from 'next/image';
import { DirectionData, THEMES } from '@/data/directionsData';
import HeroParallaxWrapper from './HeroParallaxWrapper'; // Подключаем нашу обертку

interface DirectionHeroProps {
  data: DirectionData;
}

export default function DirectionHero({ data }: DirectionHeroProps) {
  const theme = THEMES[data.theme];

  // 1. Формируем серверную верстку медиа-слоя
  const backgroundMarkup = (
    <>
      {data.hero.videoUrl ? (
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={data.hero.videoUrl} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={data.hero.imageUrl}
          alt={data.hero.title}
          fill
          priority
          fetchPriority="high"
          quality={75}
          className="object-cover"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/10" />
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{ background: `radial-gradient(circle at center, transparent 0%, ${theme.glow} 100%)` }}
      />
    </>
  );

  // 2. Формируем серверную верстку текста (LCP)
  const contentMarkup = (
    <>
      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-700 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md mb-6 sm:mb-8 shadow-2xl"
        style={{
          backgroundColor: `${theme.glow.replace('0.4', '0.1')}`,
          borderColor: `${theme.glow.replace('0.4', '0.3')}`,
        }}
      >
        <span className="text-[12px] sm:text-xs font-black uppercase tracking-[0.2em]" style={{ color: theme.hex }}>
          {data.hero.badge}
        </span>
      </div>

      <h1 className="animate-hero-title text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl max-w-5xl">
        {data.hero.title}
      </h1>

      <p className="animate-hero-subtitle text-sm sm:text-lg md:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed drop-shadow-md">
        {data.hero.subtitle}
      </p>
    </>
  );

  // 3. Отдаем готовый HTML в клиентскую обертку для параллакса
  return (
    <HeroParallaxWrapper 
      background={backgroundMarkup} 
      content={contentMarkup} 
      theme={theme} 
    />
  );
}