"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCheck, MessageCircle, Send, Instagram, Phone, ShieldCheck, Tags, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Image from 'next/image';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
export interface Review {
  id: string;
  name: string;
  text: string;
  source: string; 
  category?: string;
  createdAt: string | Date;
  avatar?: string | null;
}

// --- CONFIG ---
const SOURCE_CONFIG: Record<string, any> = {
  tg: { label: 'Telegram', icon: <Send size={12} strokeWidth={3} />, borderClass: "group-hover:border-sky-500/50", glowClass: "group-hover:shadow-[0_0_30px_rgba(14,165,233,0.2)]", iconColor: "text-sky-400", checkActiveColor: "text-sky-400" },
  viber: { label: 'Viber', icon: <Phone size={12} strokeWidth={3} />, borderClass: "group-hover:border-purple-500/50", glowClass: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]", iconColor: "text-purple-400", checkActiveColor: "text-purple-400" },
  instagram: { label: 'Instagram', icon: <Instagram size={12} strokeWidth={3} />, borderClass: "group-hover:border-pink-500/50", glowClass: "group-hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]", iconColor: "text-pink-400", checkActiveColor: "text-pink-400" },
  default: { label: 'Отзыв', icon: <MessageCircle size={12} strokeWidth={3} />, borderClass: "group-hover:border-teal-500/50", glowClass: "group-hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]", iconColor: "text-teal-400", checkActiveColor: "text-teal-400" }
};

const CATEGORY_MAP: Record<string, { label: string, colorClass: string }> = {
    general: { label: 'Местное', colorClass: 'text-slate-300 bg-slate-800/50 border-slate-700/50' },
    kayak: { label: 'Сплавы', colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    sup: { label: 'SUP-туры', colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    mountains: { label: 'Туры в горы', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    kids: { label: 'Детские', colorClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

const FALLBACK_REVIEWS: Review[] = [
  { id: '1', name: "Ольга М.", text: "Это был лучший сплав в моей жизни! Организация на высоте 🔥", source: 'viber', category: 'kayak', createdAt: '2024-05-01T10:00:00.000Z' },
  { id: '2', name: "Дмитрий К.", text: "Маршруты, которых нет на картах — это правда. Безопасность на 100% 🛶", source: 'tg', category: 'sup', createdAt: '2024-05-02T11:30:00.000Z' },
  { id: '3', name: "Анна С.", text: "Дети в восторге от лагеря, спасибо ЭВА! ❤️", source: 'instagram', category: 'kids', createdAt: '2024-05-03T14:15:00.000Z' },
  { id: '4', name: "Максим", text: "Гиды — просто космос. Знают каждую тропинку и историю.", source: 'tg', category: 'mountains', createdAt: '2024-05-04T09:45:00.000Z' },
  { id: '5', name: "Елена В.", text: "Вкусная еда на костре, гитара и полная перезагрузка. Вернусь!", source: 'instagram', category: 'general', createdAt: '2024-05-05T18:20:00.000Z' },
];

// --- CARD COMPONENT ---
const ReviewCard = ({ review }: { review: Review }) => {
  const config = SOURCE_CONFIG[review.source] || SOURCE_CONFIG.default;
  const catConfig = CATEGORY_MAP[review.category || 'general'] || CATEGORY_MAP.general;
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const time = mounted ? new Date(review.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : "--:--";

  return (
    <div className={cn(
      "group relative flex flex-col flex-shrink-0 w-[85vw] md:w-[380px] p-6 rounded-[2rem] snap-center h-fit",
      "bg-slate-900/80 backdrop-blur-xl border border-white/5 shadow-xl", 
      "transition-all duration-500 ease-out md:hover:-translate-y-2",
      config.borderClass, config.glowClass
    )}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-slate-300 shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden shrink-0 pointer-events-none">
             {review.avatar ? (
               <Image
                  src={review.avatar}
                  alt={review.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  draggable={false}
               />
             ) : (
               review.name[0]
             )}
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">{review.name}</span>
            <div className={cn("flex items-center gap-1.5 mt-1.5 transition-colors duration-300", config.iconColor)}>
               {config.icon}
               <span className="text-xs font-bold uppercase tracking-wider">{config.label}</span>
            </div>
          </div>
        </div>

        {/* CATEGORY BADGE - ✅ ИСПРАВЛЕНИЕ: text-[9px] заменен на text-[10px] md:text-xs */}
        <div className={cn("inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] md:text-xs font-bold uppercase tracking-widest", catConfig.colorClass)}>
            <Tags size={12} strokeWidth={2.5} />
            {catConfig.label}
        </div>
      </div>

      {/* BODY */}
      <p className="text-sm text-slate-300 leading-relaxed font-medium mb-5 group-hover:text-white transition-colors duration-300 flex-1">
        {review.text}
      </p>

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-auto border-t border-white/5 pt-4">
        {/* ✅ ИСПРАВЛЕНИЕ: text-[11px] заменен на text-xs */}
        <span className="text-xs font-mono text-slate-400 transition-colors">
            {time}
        </span>
        
        <CheckCheck 
            size={16} 
            className={cn("transition-colors duration-500", "text-slate-600", `group-hover:${config.checkActiveColor}`)} 
        />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function ReviewsMarquee({ reviews = [] }: { reviews?: Review[] }) {
  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
  
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const availableCategories = useMemo(() => {
    const categories = displayReviews.map(r => r.category || 'general');
    return Array.from(new Set(categories));
  }, [displayReviews]);

  const filteredReviews = useMemo(() => {
    if (activeCategory === 'all') return displayReviews;
    return displayReviews.filter(r => (r.category || 'general') === activeCategory);
  }, [activeCategory, displayReviews]);

  // --- DRAG TO SCROLL LOGIC ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerOffsetRef = useRef<number>(0); // ✅ Кэш для offsetLeft (предотвращает Forced Reflow)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    // Кэшируем позицию контейнера один раз при нажатии
    containerOffsetRef.current = scrollContainerRef.current.offsetLeft;
    setStartX(e.pageX - containerOffsetRef.current);
    setScrollLeftPos(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    // ✅ Используем закэшированное значение вместо чтения DOM (0 Layout Thrashing)
    const x = e.pageX - containerOffsetRef.current;
    const walk = (x - startX) * 1.5; 
    
    scrollContainerRef.current.style.scrollBehavior = 'auto';
    scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
    scrollContainerRef.current.style.scrollBehavior = 'smooth';
  };

  // ✅ ИСПРАВЛЕНИЕ: Кнопки навигации для десктопа
  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
   <section className="py-12 md:py-24 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none opacity-50" />

      <div className="container mx-auto px-4 mb-8 md:mb-12 relative z-10">
        
        {/* HEADER */}
        <div className="text-left mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                <MessageCircle size={14} className="text-teal-400" />
                <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-widest text-teal-400">Люди говорят</span>
            </div>

            <h2 className="text-4xl md:text-6xl uppercase tracking-tighter leading-none mb-4">
                <span className="font-light text-slate-300 block md:inline">Отзывы </span>
                <span className="font-black text-white">Участников</span>
                <span className="text-teal-500">.</span>
            </h2>
            
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                <span>Создано из отзывов и оценочных форм туров</span>
            </div>
        </div>

        {/* ФИЛЬТРЫ КАТЕГОРИЙ */}
        {availableCategories.length > 1 && (
            <div className="flex flex-col gap-4 md:gap-5">
                <div className="flex items-center">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all border shadow-sm",
                            activeCategory === 'all' 
                                ? "bg-teal-700 text-white border-teal-600 shadow-teal-900/20" 
                                : "bg-slate-900/50 text-slate-300 border-white/5 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        Все отзывы
                    </button>
                </div>

                <div className="flex gap-2 md:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {availableCategories.map(catId => {
                        const catInfo = CATEGORY_MAP[catId] || CATEGORY_MAP.general;
                        return (
                            <button
                                key={catId}
                                onClick={() => setActiveCategory(catId)}
                                className={cn(
                                    "shrink-0 snap-center px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all border shadow-sm",
                                    activeCategory === catId 
                                        ? "bg-teal-600 text-white border-teal-500 shadow-teal-900/20" 
                                        : "bg-slate-900/50 text-slate-300 border-white/5 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                {catInfo.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        )}

      </div>

      {/* --- CARDS CONTAINER С DRAG TO SCROLL И КНОПКАМИ --- */}
      <div className="relative flex flex-col gap-8 group/slider">
         
         {/* Fade Edges (Desktop only) */}
         <div className="hidden md:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
         <div className="hidden md:block absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

         {/* ✅ ИСПРАВЛЕНИЕ: Кнопки-стрелки для десктопа */}
         <button 
            onClick={() => scrollByAmount(-400)} 
            aria-label="Прокрутить влево"
            className="hidden md:flex opacity-0 group-hover/slider:opacity-100 absolute left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-white hover:bg-teal-600 hover:border-teal-500 transition-all shadow-xl hover:scale-110"
         >
            <ChevronLeft size={28} />
         </button>
         
         <button 
            onClick={() => scrollByAmount(400)} 
            aria-label="Прокрутить вправо"
            className="hidden md:flex opacity-0 group-hover/slider:opacity-100 absolute right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-white hover:bg-teal-600 hover:border-teal-500 transition-all shadow-xl hover:scale-110"
         >
            <ChevronRight size={28} />
         </button>

         <div className="relative">
             <div 
                ref={scrollContainerRef}
                key={activeCategory}
                tabIndex={0} 
                role="region" 
                aria-label={`Отзывы в категории ${activeCategory}`} 
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ WebkitOverflowScrolling: 'touch' }}
                className={cn(
                    "flex gap-4 md:gap-6 px-4 md:px-32 overflow-x-auto hide-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-2xl w-full pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
                    isDragging ? "cursor-grabbing select-none snap-none" : "cursor-grab snap-x snap-mandatory"
                )}
              >
                {filteredReviews.map((review, i) => (
                  <ReviewCard key={`${review.id}-${i}`} review={review} />
                ))}
              </div>

           {/* ПОДСКАЗКА ДЛЯ СКРОЛЛА */}
           <div className="flex md:hidden items-center gap-2 mb-4 text-slate-400 pl-4">
              <ArrowRight size={16} className="text-teal-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Листайте вбок</span>
           </div>
         </div>
      </div>

    </section>
  );
}