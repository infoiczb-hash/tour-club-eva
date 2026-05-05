import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Hammer, PawPrint } from 'lucide-react';

export const metadata: Metadata = {
  title: 'О клубе | Турклуб «Эва»',
  description: 'Узнайте больше о турклубе «Эва»: наша история, философия активного отдыха, безопасность на маршрутах и команда профессиональных гидов.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'О клубе | Турклуб «Эва»',
    description: 'Узнайте больше о турклубе «Эва»: история, философия и команда.',
    url: 'https://evatur.club/about',
    siteName: 'Турклуб «Эва»',
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'О турклубе Эва'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О клубе | Турклуб «Эва»',
    description: 'Узнайте больше о турклубе «Эва»: история, философия и команда.',
    images: ['/og-default.jpg'],
  }
};

export default function AboutPage() {
  return (
    // 🔥 ИСПРАВЛЕНИЕ: Добавлены pt-28 md:pt-32 (безопасная зона для хедера) 
    // и min-h-[100svh] для корректной работы на мобильных.
    <main className="min-h-[100svh] pt-28 pb-12 md:pt-32 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4">
      
      {/* Мягкое фоновое свечение */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900/10 md:blur-[120px] rounded-full pointer-events-none" />

      {/* 🔥 ИСПРАВЛЕНИЕ: Убран лишний mt-12, так как теперь есть padding у main */}
      <div className="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
        
       {/* Бейдж статуса */}
        <div className="animate-hero-subtitle inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-full mb-8 shadow-xl">
          <Hammer className="w-4 h-4 text-slate-300" />
          <span className="text-[12px] md:text-xs font-bold tracking-[0.15em] text-slate-300 uppercase">
            Страница в разработке
          </span>
        </div>

        {/* Главный заголовок - МГНОВЕННЫЙ РЕНДЕР (LCP) */}
        <h1 className="animate-hero-title text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-10 leading-none">
          О <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">клубе</span>
        </h1>

        {/* Текстовые блоки */}
        <div className="space-y-8 text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-xl mx-auto">
          
          <div className="animate-hero-subtitle relative">
             <PawPrint className="absolute -top-6 -left-4 w-12 h-12 text-teal-500/10 -rotate-12" />
             <p className="relative z-10 text-xl md:text-2xl text-white font-bold leading-snug">
                Скоро здесь появится история о том,<br className="hidden md:block"/>
                как всё начиналось,<br className="hidden md:block"/>
                чем мы живём сейчас,<br className="hidden md:block"/>
                и как в нашей команде появилась собака Эва.
             </p>
          </div>
          
         <div className="animate-fade-in-up">
              <div className="w-16 h-px bg-white/10 mx-auto my-8" />
              <p className="text-slate-300">
                Если вы уже с нами — <span className="text-teal-400">спасибо, что идёте рядом</span>.<br />
                Если только присматриваетесь — оставайтесь. Самое интересное впереди.
              </p>
          </div>

        </div>

        {/* Кнопка возврата */}
        <div className="mt-14 opacity-0 animate-fade-in-up [animation-delay:600ms]">
          <Link 
            href="/"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-teal-500 text-slate-950 font-black uppercase tracking-widest text-sm rounded-xl hover:bg-teal-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(20,184,166,0.2)]"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Вернуться на главную</span>
          </Link>
        </div>

      </div>
    </main>
  );
}