"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Waves, Compass, CheckCircle2 } from "lucide-react";
import { useKayakTab } from "./KayakingTabProvider";

export default function Hero() {
  const { activeTab, setActiveTab } = useKayakTab();
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;

          if (bgRef.current) {
            bgRef.current.style.transform = `translateY(${y * 0.3}px)`;
          }
          if (contentRef.current) {
            const op = Math.max(0, 1 - y / 400);
            contentRef.current.style.opacity = String(op);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center">

      {/* PARALLAX БГ */}
      <div ref={bgRef} className="absolute inset-0 z-0" style={{ willChange: "transform" }}>
        <Image
          src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771584228/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2025-06-21_11-50-14-080_a7uba5.jpg"
          alt="Сплав на байдарках"
          fill
          className="object-cover opacity-60"
          priority
          fetchPriority="high"
          quality={60}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/40" />
      </div>

      {/* КОНТЕНТ */}
      <div
        ref={contentRef}
        className="relative z-10 container mx-auto px-4 text-center mt-12 md:mt-0 flex flex-col items-center"
        style={{ transition: "opacity 0.1s linear" }}
      >
        <div className="animate-hero-subtitle inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-950/50 backdrop-blur-md mb-6">
          <Waves size={14} className="text-teal-400 animate-pulse" />
          <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">
            Маршруты по Днестру
          </span>
        </div>

        <h1 className="animate-hero-title text-5xl md:text-8xl lg:text-[7rem] font-black text-white uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl">
          Сплавы на <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">байдарках</span>
        </h1>

        <p className="animate-hero-subtitle text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md">
          Водные походы для новичков и тех, кто ищет природу и команду. Перезагрузка на воде. Только ты, весло и бесконечный горизонт.
        </p>

        <div className="animate-hero-subtitle bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 inline-flex flex-col sm:flex-row gap-1 w-full sm:w-auto shadow-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab("newbie")}
            className={`relative px-8 py-4 md:py-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "newbie" ? "bg-teal-500 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.4)]" : "bg-transparent text-slate-300 hover:text-white"}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Compass size={18} /> Хочу на сплав
            </span>
          </button>

          <button
            onClick={() => setActiveTab("participant")}
            className={`relative px-8 py-4 md:py-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "participant" ? "bg-teal-500 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.4)]" : "bg-transparent text-slate-300 hover:text-white"}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Я участник
            </span>
          </button>
        </div>
      </div>

      {/* SCROLL INDICATOR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-in fade-in duration-1000 delay-500 fill-mode-both">
        <span className="text-[12px] font-bold text-slate-300 uppercase tracking-[0.2em]">Вниз</span>
        <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-teal-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}