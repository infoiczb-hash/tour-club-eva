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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 md:mb-10">
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
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-10 pt-8 md:pt-10 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-8 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {fleet.map((boat, i) => (
              <div
                key={i}
                style={{ opacity: cardsView.inView ? 1 : 0, transform: cardsView.inView ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s` }}
                className="group relative flex-shrink-0 snap-center w-[82vw] md:w-auto mt-8 md:mt-0"
              >
                {/* Лодка выходит за края карточки */}
                <div className="absolute -top-20 md:-top-28 left-1/2 -translate-x-1/2 w-[110%] md:w-[125%] aspect-[2/1] z-20 pointer-events-none transition-transform duration-700 ease-out group-hover:-translate-y-6 group-hover:scale-110">
                  <Image
                    src={boat.image}
                    alt={boat.title}
                    fill
                    className="object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.85)]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    priority
                  />
                </div>
                <div className="relative bg-slate-900/40 border border-white/5 rounded-3xl p-4 pt-12 md:pt-16 pb-6 flex flex-col items-center text-center overflow-hidden transition-all duration-500 group-hover:border-teal-500/30 group-hover:bg-slate-900/60 shadow-xl group-hover:shadow-2xl h-full">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-teal-500/0 blur-[80px] rounded-full transition-all duration-500 group-hover:bg-teal-500/20 pointer-events-none" />
                  <span className="inline-block mb-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[14px] font-black uppercase text-teal-500 tracking-widest relative z-10">
                    {boat.tag}
                  </span>
                  <h4 className="font-black text-2xl text-white uppercase tracking-tight mb-3 relative z-10 group-hover:text-teal-300 transition-colors">
                    {boat.title}
                  </h4>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed relative z-10">{boat.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="md:hidden absolute bottom-0 right-4 flex items-center gap-1 animate-pulse pointer-events-none">
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
            <ChevronRight size={14} className="text-teal-400" />
          </div>
        </div>
      </div>
    </section>
  );
}