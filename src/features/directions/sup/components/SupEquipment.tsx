"use client";

import { useRef, useEffect, useState } from "react";
import Image from 'next/image';
import { 
    Gauge, MoveHorizontal, Timer, ShieldCheck, 
    Waves, Link, LifeBuoy, Smartphone, Backpack,
    ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Легкий нативный хук
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

// 1. Технические характеристики доски
const STATS = [
  { label: "Давление", value: "12-15PSI", desc: "Жесткая как пол", icon: Gauge },
  { label: "Ширина", value: "78 + см", desc: "Макс. устойчивость", icon: MoveHorizontal },
  { label: "Обучение", value: "15 мин", desc: "И вы в деле", icon: Timer },
  { label: "Риск падения", value: "< 10%", desc: "Слушая гида", icon: ShieldCheck }
];

// 2. Базовый комплект экипировки
const GEAR = [
    {
        title: "Весло для SUP",
        desc: "Легкое и прочное. Регулируется под ваш рост одним щелчком, чтобы руки не уставали грести.",
        icon: Waves,
    },
    {
        title: "Страховочный лиш",
        desc: "Специальный трос на ногу. Даже если вы упадете, доска никуда не уплывет — это гарантия безопасности.",
        icon: Link,
    },
    {
        title: "Спасжилет (XS - 5XL)",
        desc: "Обязательный атрибут. У нас есть удобные размеры абсолютно для всех: от малышей до богатырей.",
        icon: LifeBuoy,
    },
    {
        title: "Чехол для телефона",
        desc: "Водонепроницаемый бейдж на шею. Делайте крутые фото на воде, не боясь утопить смартфон.",
        icon: Smartphone,
    },
    {
        title: "Гермомешок (10+ л)",
        desc: "Выдаем на маршруты от 5 часов. Поместятся ваши сухие вещи, ключи от машины и перекус.",
        icon: Backpack,
    }
];

export default function SupEquipment() {
    const headerView = useInView();
    const boardView = useInView();
    const statsView = useInView();
    const gearHeaderView = useInView();
    const gearListView = useInView();

    return (
        <section className="py-8 md:py-16 bg-slate-950 relative overflow-hidden border-t border-white/5">
            
            {/* CSS для плавной парящей доски (замена Framer Motion animate={{y: ...}}) */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float-sup {
                    0%, 100% { transform: translateY(-10px); }
                    50% { transform: translateY(10px); }
                }
                .animate-float-sup {
                    animation: float-sup 6s ease-in-out infinite;
                }
            `}} />

            {/* Фоновые свечения для кинематографичности */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 md:blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                {/* ЗАГОЛОВОК */}
                <div className="text-left mb-6 md:mb-10 max-w-3xl">
                    <div 
                        ref={headerView.ref}
                        style={{ opacity: headerView.inView ? 1 : 0, transform: headerView.inView ? 'translateX(0)' : 'translateX(-20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
                            <ShieldCheck className="text-teal-400" size={14} strokeWidth={2} />
                            <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">
                                Премиальное снаряжение
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                            Наш <span className="text-teal-500">Арсенал</span>
                        </h2>
                        <p className="text-[14px] md:text-base text-slate-400 font-medium leading-relaxed">
                            Мы продумали каждую деталь, чтобы на воде вы чувствовали себя так же уверенно, как на суше.
                        </p>
                    </div>
                </div>

                {/* ЧАСТЬ 1: ДОСКА И ХАРАКТЕРИСТИКИ */}
                <div className="relative flex flex-col items-center mb-12 md:mb-16">
                    
                    {/* ДОСКА */}
                    <div 
                        ref={boardView.ref}
                        style={{ opacity: boardView.inView ? 1 : 0, transform: boardView.inView ? 'scale(1)' : 'scale(0.95)', transition: 'opacity 0.8s ease-out, transform 0.8s ease-out' }}
                        className="relative w-full max-w-5xl h-[160px] sm:h-[200px] md:h-[240px] lg:h-[280px] z-0 mb-4 md:mb-8 flex justify-center"
                    >
                        <div className="animate-float-sup w-[120%] md:w-full h-full relative md:scale-[1.2] lg:scale-[1.3]">
                            <Image 
                                src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771609412/sup_fl75zk.webp" 
                                alt="SUP Board Touring" 
                                fill 
                                sizes="(max-width: 768px) 120vw, 1200px"
                                className="object-contain drop-shadow-[0_20px_40px_rgba(20,184,166,0.15)]"
                                priority
                            />
                        </div>
                    </div>

                    {/* Плашка с характеристиками */}
                    <div 
                        ref={statsView.ref}
                        style={{ opacity: statsView.inView ? 1 : 0, transform: statsView.inView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s' }}
                        className="w-full bg-white/10 border border-white/10 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
                            {STATS.map((stat, i) => (
                                <div key={i} className="bg-slate-900/90 backdrop-blur-md p-5 flex flex-col items-center text-center group hover:bg-slate-800/90 transition-colors duration-300">
                                    <stat.icon className="text-teal-500/50 group-hover:text-teal-400 transition-colors mb-2" size={24} strokeWidth={1.5} />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xl md:text-2xl font-black text-white tracking-tighter">
                                            {stat.value}
                                        </span>
                                        <span className="text-[10px] md:text-[12px] uppercase font-bold text-teal-500 tracking-[0.1em]">
                                            {stat.label}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[12px] md:text-[14px] text-slate-400 font-medium leading-snug">
                                        {stat.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ЗАГОЛОВОК "ДРУГОЕ ОБОРУДОВАНИЕ" */}
                <div 
                    ref={gearHeaderView.ref}
                    style={{ opacity: gearHeaderView.inView ? 1 : 0, transform: gearHeaderView.inView ? 'translateX(0)' : 'translateX(-20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
                    className="text-left mb-6 md:mb-8"
                >
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                        Другое <span className="text-teal-500">Оборудование</span>
                    </h3>
                </div>
{/* СКРОЛЛ ЭКИПИРОВКИ */}
<div className="relative" ref={gearListView.ref}>
    <div className="grid grid-rows-2 md:grid-rows-none grid-flow-col md:grid-flow-row auto-cols-[85vw] md:auto-cols-auto md:grid-cols-3 gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-10 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {GEAR.map((item, idx) => {
            const Icon = item.icon;
            return (
                <div 
                    key={idx} 
                    style={{ opacity: gearListView.inView ? 1 : 0, transform: gearListView.inView ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.5s ease ${idx * 0.1}s, transform 0.5s ease ${idx * 0.1}s` }}
                    className="snap-center bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-[1.5rem] p-5 hover:border-teal-500/30 hover:bg-slate-900/80 transition-all duration-300 group flex flex-row items-center gap-4 h-full"
                >
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:bg-teal-500 group-hover:border-teal-400 transition-colors duration-300">
                        <Icon className="text-teal-400 group-hover:text-slate-950 transition-colors" size={22} strokeWidth={1.5} />
                    </div>
                    
                    <div>
                        <h4 className="text-[15px] sm:text-base font-black text-white mb-1 tracking-tight group-hover:text-teal-300 transition-colors leading-tight">
                            {item.title}
                        </h4>
                        {/* 👇 ИСПРАВЛЕНИЕ: удален класс line-clamp-2 */}
                        <p className="text-[14px] text-slate-400 leading-snug font-medium">
                            {item.desc}
                        </p>
                    </div>
                </div>
            );
        })}
    </div>
                         <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-400 animate-pulse pointer-events-none">
                        <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                        <ChevronRight size={14} />
                    </div>
                </div>

            </div>
        </section>
    );
}