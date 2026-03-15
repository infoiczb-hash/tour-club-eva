"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Waves, Map } from "lucide-react";

export default function SupHero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const [contentOpacity, setContentOpacity] = useState(1);

  // Оставляем клиентский JS только ради легкого параллакса (не вредит SEO)
  useEffect(() => {
    let rafId: number;
    let lastScrollY = 0;

    const onScroll = () => {
      lastScrollY = window.scrollY;
    };

    const update = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${lastScrollY * 0.3}px)`;
      }
      // Плавно растворяем текст при скролле вниз
      const op = Math.max(0, 1 - lastScrollY / 400);
      setContentOpacity(op);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center">

      {/* ФОН С ПАРАЛЛАКСОМ */}
      <div ref={bgRef} className="absolute inset-0 z-0" style={{ willChange: 'transform' }}>
        <Image
          // Подставь свою самую красивую фотку сапборда
          src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg"
          alt="Прогулки на SUP бордах"
          fill
          className="object-cover opacity-60"
          priority
          fetchPriority="high"
          quality={75}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/40" />
      </div>

      {/* КОНТЕНТ (Появляется через CSS, чтобы Googlebot видел текст сразу) */}
      <div
        className="relative z-10 container mx-auto px-4 text-center mt-12 md:mt-0 flex flex-col items-center"
        style={{ opacity: contentOpacity, transition: 'opacity 0.1s linear' }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-950/50 backdrop-blur-md mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
          <Waves size={14} className="text-teal-400 animate-pulse" />
          <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">
            SUP-прогулки
          </span>
        </div>

        {/* Заголовок - МГНОВЕННЫЙ РЕНДЕР БЕЗ DELAY */}
        <h1 className="text-5xl md:text-8xl lg:text-[7rem] font-black text-white uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl animate-in fade-in zoom-in-95 duration-700">
         СКОЛЬЗИ <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">ПО ВОДЕ</span>
        </h1>

        <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          Ваше идеальное мини-путешествие. Никакого шума и спешки — только вы, доска и природа. Открываем знакомые места с совершенно нового ракурса.
        </p>
        
        {/* КНОПКИ ДЕЙСТВИЯ */}
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <Link
            href="#catalog" // Замени на нужный якорь или ссылку
            className="px-8 py-4 rounded-xl bg-teal-500 text-slate-950 font-black uppercase tracking-widest text-sm hover:bg-teal-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2"
          >
            <Map size={18} /> Выбрать программу
          </Link>
         </div>
      </div>

      {/* АНИМАЦИЯ ПОДСКАЗКИ СКРОЛЛА */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-in fade-in duration-1000 delay-500 fill-mode-both">
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">Вниз</span>
        <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-teal-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}