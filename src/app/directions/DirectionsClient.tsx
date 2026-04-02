"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Mountain, Waves, Tent, Briefcase, 
  ArrowUpRight, Compass, Anchor, ArrowLeft, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { useModalStore } from '@/shared/store/useModalStore';

// --- ДАННЫЕ НАПРАВЛЕНИЙ ---
const DIRECTIONS = [
  { 
    id: 'hiking', 
    title: "Горы и походы", 
    desc: "Туры в горы. Маршруты для новичков и опытных туристов.",
    image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/hiking_modikx.webp",
    icon: Mountain, 
    href: "/directions/hiking",
    isLarge: true,
    color: "text-emerald-400",
    bgAccent: "group-hover:bg-emerald-500"
  },
  { 
    id: 'kayaking', 
    title: "Сплавы на байдарках", 
    desc: "Атмосферные сплавы по Днестру. Идеально для перезагрузки.",
    image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674642/kayak_p2bkyz.webp", 
    icon: Waves, 
    href: "/directions/kayaking",
    isLarge: false,
    color: "text-blue-400",
    bgAccent: "group-hover:bg-blue-500"
  },
  { 
    id: 'sup', 
    title: "SUP прогулки", 
    desc: "Эстетика, релакс и красивый контент.",
    image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674650/sup_zwz9yw.webp",
    icon: Anchor, 
    href: "/directions/sup",
    isLarge: false,
    color: "text-cyan-400",
    bgAccent: "group-hover:bg-cyan-500"
  },
  { 
    id: 'local', 
    title: "Местная программа", 
    desc: "Туры выходного дня по родному краю. Ущелья, скалы, скрытые локации и гастрономия.",
    image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674647/local_i9ul0e.webp",
    icon: Compass, 
    href: "/directions/local",
    isLarge: false,
    color: "text-amber-400",
    bgAccent: "group-hover:bg-amber-500"
  },
  { 
    id: 'kids', 
    title: "Junior Академия", 
    desc: "Семейные выезды и детские лагеря. Учим любить природу, вязать узлы и работать в команде.",
    image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674646/kids_e7lr51.webp",
    icon: Tent, 
    href: "/directions/kids",
    isLarge: false,
    color: "text-pink-400",
    bgAccent: "group-hover:bg-pink-500"
  },
  { 
    id: 'organizers', 
    title: "Организаторам", 
    desc: "Корпоративы, тимбилдинги и туры под ключ. Ваш сценарий — наша реализация.",
    image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/organ_zrvvfc.webp",
    icon: Briefcase, 
    href: "/directions/organizers",
    isLarge: false,
    color: "text-violet-400",
    bgAccent: "group-hover:bg-violet-500",
    isB2B: true
  },
];

export default function DirectionsClient() {
  const openContactModal = useModalStore((state) => state.openContactModal);

  return (
    <main className="min-h-screen bg-slate-950 pt-24 md:pt-32 pb-16 md:pb-24 px-4 relative overflow-hidden selection:bg-teal-500/30">
      
      {/* --- AMBIENCE --- */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/10 md:blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        
        {/* --- HEADER --- */}
        <div className="mb-12 md:mb-16">
            <Link href="/" className="inline-flex items-center gap-1.5 md:gap-2 text-slate-300 hover:text-teal-400 transition-colors mb-6 text-[14px] md:text-sm font-bold uppercase tracking-wider">
                <ArrowLeft size={16} /> На главную
            </Link>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 uppercase tracking-tighter leading-[0.9]">
              Выбери свое <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                Приключение
              </span>
            </h1>
            
            <p className="text-slate-300 text-s md:text-lg max-w-2xl font-medium leading-relaxed">
              Мы не ограничиваемся одним видом приключений. ТурКлуб «Эва» — это экосистема направлений, где каждый найдет свой формат: от суровых восхождений до релакса на сапбордах.
            </p>
        </div>

        {/* --- BENTO GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 auto-rows-[300px] md:auto-rows-[340px]">
            
            {/* ✅ ИСПРАВЛЕНО: Добавлен index для вычисления приоритета */}
            {DIRECTIONS.map((dir, index) => {
                const Icon = dir.icon;
                
                return (
                    <div
                        key={dir.id}
                        className={clsx(
                            "group relative rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900 flex flex-col",
                            dir.isLarge ? "md:col-span-2 md:row-span-2" : "col-span-1 row-span-1"
                        )}
                    >
                        {/* ФОНОВОЕ ФОТО */}
                        <Image
                            src={dir.image}
                            alt={dir.title}
                            fill
                            className="object-cover opacity-60 grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                            sizes={dir.isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                            // ✅ ИСПРАВЛЕНО: priority получают и большие карточки (для десктопа) и первые 2 карточки (для мобилок)
                            priority={dir.isLarge || index < 2} 
                        />
                        {/* ГРАДИЕНТ */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity" />

                        {/* ССЫЛКА НА РОУТЕР */}
                        <Link href={dir.href} className="absolute inset-0 z-10 outline-none" aria-label={dir.title} />

                        {/* КОНТЕНТ */}
                        <div className="relative z-20 flex flex-col h-full p-6 md:p-8 justify-end pointer-events-none">
                            
                            <div className="flex items-center justify-between mb-auto">
                                <div className={clsx(
                                    "w-12 h-12 rounded-2xl backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors duration-300",
                                    "bg-white/10 group-hover:text-slate-950 shadow-xl",
                                    dir.color, dir.bgAccent
                                )}>
                                    <Icon size={24} />
                                </div>
                                
                                <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white group-hover:text-slate-900 transition-all duration-300 transform group-hover:-translate-y-1 group-hover:translate-x-1 shadow-lg">
                                    <ArrowUpRight size={18} />
                                </div>
                            </div>

                            <div className="mt-8">
                                <h2 className={clsx(
                                    "font-black text-white uppercase tracking-tight leading-none drop-shadow-lg transition-colors",
                                    dir.isLarge ? "text-3xl md:text-5xl mb-4" : "text-2xl mb-2",
                                    dir.color.replace('text-', 'group-hover:text-')
                                )}>
                                    {dir.title}
                                </h2>
                                <p className={clsx(
                                    "text-slate-300 font-medium drop-shadow-md",
                                    dir.isLarge ? "text-base md:text-lg max-w-lg line-clamp-3" : "text-sm line-clamp-2"
                                )}>
                                    {dir.desc}
                                </p>
                            </div>

                         {/* B2B Кнопка (Только для Организаторов) */}
                            {dir.isB2B && (
                                <div className="mt-5 pointer-events-auto relative z-30">
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault(); 
                                            e.stopPropagation();
                                            openContactModal('Заявка на сотрудничество (от организатора)', 'B2B');
                                        }}
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 w-full sm:w-auto justify-center"
                                    >
                                        Оставить заявку <ArrowRight size={16} className="ml-1" />
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                );
            })}

        </div>
      </div>
    </main>
  );
}