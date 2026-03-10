"use client";

import { useEffect, useRef, useState } from "react";
import { m as motion } from "framer-motion";
import Image from "next/image";
import { Waves, Compass, CheckCircle2 } from "lucide-react";
import { useKayakTab } from "./KayakingTabProvider";

export default function Hero() {
  const { activeTab, setActiveTab } = useKayakTab();
  const bgRef = useRef<HTMLDivElement>(null);
  const [contentOpacity, setContentOpacity] = useState(1);

  // Заменяет useScroll + useTransform:
  // - фон: parallax через RAF (как в главном Hero)
  // - контент: плавно скрывается при скролле через CSS
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
      // opacity контента: 1 → 0 при скролле 0 → 400px
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

      {/* PARALLAX БГ — через RAF, без Framer Motion */}
      <div ref={bgRef} className="absolute inset-0 z-0" style={{ willChange: 'transform' }}>
        <Image
          src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584228/изображение_viber_2025-06-21_11-50-14-080_a7uba5.jpg"
          alt="Сплав на байдарках"
          fill
          className="object-cover opacity-60"
          priority
          fetchPriority="high"
          quality={85}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/40" />
      </div>

      {/* КОНТЕНТ — opacity через CSS transition */}
      <div
        className="relative z-10 container mx-auto px-4 text-center mt-12 md:mt-0 flex flex-col items-center"
        style={{ opacity: contentOpacity, transition: 'opacity 0.1s linear' }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-950/50 backdrop-blur-md mb-6 opacity-0 animate-fade-in-up">
          <Waves size={14} className="text-teal-400 animate-pulse" />
          <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">
            Маршруты по Днестру
          </span>
        </div>

        <h1 className="opacity-0 animate-fade-in-up [animation-delay:150ms] text-5xl md:text-8xl lg:text-[7rem] font-black text-white uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl">
          Сплавы на <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">байдарках</span>
        </h1>

        <p className="opacity-0 animate-fade-in-up [animation-delay:300ms] text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md">
          Водные походы для новичков и тех, кто ищет природу и команду. Перезагрузка на воде. Только ты, весло и бесконечный горизонт.
        </p>

        {/* ПЕРЕКЛЮЧАТЕЛЬ — оставляем motion.div layoutId, это UI анимация а не scroll */}
        <div className="opacity-0 animate-fade-in-up [animation-delay:450ms] bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 inline-flex flex-col sm:flex-row gap-1 w-full sm:w-auto shadow-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab("newbie")}
            className={`relative px-8 py-4 md:py-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'newbie' ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            {activeTab === 'newbie' && (
              <motion.div layoutId="heroTab" className="absolute inset-0 bg-teal-500 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.4)]" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Compass size={18} /> Хочу на сплав
            </span>
          </button>

          <button
            onClick={() => setActiveTab("participant")}
            className={`relative px-8 py-4 md:py-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'participant' ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            {activeTab === 'participant' && (
              <motion.div layoutId="heroTab" className="absolute inset-0 bg-teal-500 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.4)]" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Я участник
            </span>
          </button>
        </div>
      </div>

      {/* SCROLL INDICATOR — анимация вниз-вверх оставляем, она лёгкая */}
      <div className="opacity-0 animate-fade-in-up [animation-delay:1000ms] absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">Вниз</span>
        <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center p-1">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-1 h-2 bg-teal-500 rounded-full"
          />
        </div>
      </div>
    </section>
  );
}