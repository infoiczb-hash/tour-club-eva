"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, ChevronRight } from "lucide-react";

function useInView(options = { threshold: 0.1, rootMargin: '-30px' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

const fleet = [
  { title: "Таймень-2", desc: "Быстрая и маневренная классика. Идеальна для двоих.", tag: "2 места", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771580265/taimen-2_qgiitc.webp" },
  { title: "Таймень-3", desc: "Устойчивая и вместительная. Отличный выбор для семьи с ребенком.", tag: "3 места +1 реб.", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771580025/taimen-3_lqhcoc.webp" },
  { title: "Виктория", desc: "Максимум комфорта, открытый борт и огромная грузоподъемность.", tag: "3 места +1 реб.", image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771580108/victoria-3_kdsob5.webp" },
];

export default function Fleet() {
  const cardsView = useInView();

 return (
    <section className="pt-12 md:pt-20 pb-10 bg-[#020617] relative overflow-hidden text-slate-200 border-t border-white/5">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">

        {/* HEADER — статичный, не нужна анимация */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
              <ShieldCheck size={14} className="text-teal-400" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Инвентарь</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Наш <span className="text-teal-500">Флот</span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm md:text-base max-w-sm font-medium">
            Проверенные временем и сотнями километров байдарки. Каждая лодка проходит регулярное ТО.
          </p>
        </div>

        {/* CARDS */}
        <div ref={cardsView.ref} className="relative mt-6 md:mt-8">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-6 pt-4 md:pt-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-8 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {fleet.map((boat, i) => (
              <div
                key={i}
                style={{ 
                  opacity: cardsView.inView ? 1 : 0, 
                  transform: cardsView.inView ? 'translateY(0)' : 'translateY(30px)', 
                  transition: `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s` 
                }}
                className="group relative flex-shrink-0 snap-center w-[85vw] md:w-auto bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-500 hover:border-teal-500/30 hover:bg-slate-900/60 shadow-xl hover:shadow-2xl h-full"
              >
                {/* Неоновый блюр на фоне карточки */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-teal-500/0 blur-[80px] rounded-full transition-all duration-500 group-hover:bg-teal-500/20 pointer-events-none" />

                {/* 1. Аквариум для лодки: картинка больше не выпрыгивает за пределы карточки */}
                <div className="relative w-full h-32 md:h-40 mb-6 flex items-center justify-center z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                  <Image
                    src={boat.image}
                    alt={boat.title}
                    fill
                    className="object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    priority
                  />
                </div>

                {/* 2. Бейдж вместимости: в общем потоке под лодкой */}
                <span className="inline-block mb-4 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] md:text-xs font-black uppercase text-teal-400 tracking-widest relative z-10">
                  {boat.tag}
                </span>

                {/* 3. Заголовок */}
                <h3 className="font-black text-2xl md:text-3xl text-white uppercase tracking-tight mb-3 relative z-10 transition-colors">
                  {boat.title}
                </h3>

                {/* 4. Описание: с отступами, чтобы не липло к краям */}
                <p className="text-[13px] md:text-sm text-slate-400 font-medium leading-relaxed relative z-10 px-2 mt-auto">
                  {boat.desc}
                </p>
              </div>
            ))}
          </div>
          
          {/* Подсказка для скролла на мобильных */}
          <div className="md:hidden flex items-center justify-end gap-1.5 mt-2 pr-4 text-slate-500 pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-widest">Мотай</span>
            <ChevronRight size={14} className="text-teal-500 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
  }