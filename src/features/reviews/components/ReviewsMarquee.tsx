"use client";

import React, { useState, useEffect } from 'react';
import { CheckCheck, MessageCircle, Send, Instagram, Phone, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
export interface Review {
  id: string;
  name: string;
  text: string;
  source: string; 
  createdAt: string | Date;
  avatar?: string | null;
}

// --- CONFIG ---
const SOURCE_CONFIG: Record<string, any> = {
  tg: {
    label: 'Telegram',
    icon: <Send size={12} strokeWidth={3} />,
    borderClass: "group-hover:border-sky-500/50",
    glowClass: "group-hover:shadow-[0_0_30px_rgba(14,165,233,0.2)]",
    iconColor: "text-sky-400",
    checkActiveColor: "text-sky-400", // Голубой для ТГ
  },
  viber: {
    label: 'Viber',
    icon: <Phone size={12} strokeWidth={3} />,
    borderClass: "group-hover:border-purple-500/50",
    glowClass: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]",
    iconColor: "text-purple-400",
    checkActiveColor: "text-purple-400", // Фиолетовый для Вайбера
  },
  instagram: {
    label: 'Instagram',
    icon: <Instagram size={12} strokeWidth={3} />,
    borderClass: "group-hover:border-pink-500/50",
    glowClass: "group-hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]",
    iconColor: "text-pink-400",
    checkActiveColor: "text-pink-400", // Розовый для Инсты
  },
  default: {
    label: 'Отзыв',
    icon: <MessageCircle size={12} strokeWidth={3} />,
    borderClass: "group-hover:border-teal-500/50",
    glowClass: "group-hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]",
    iconColor: "text-teal-400",
    checkActiveColor: "text-teal-400",
  }
};

const FALLBACK_REVIEWS: Review[] = [
  { id: '1', name: "Ольга М.", text: "Это был лучший сплав в моей жизни! Организация на высоте 🔥", source: 'viber', createdAt: new Date().toISOString() },
  { id: '2', name: "Дмитрий К.", text: "Маршруты, которых нет на картах — это правда. Безопасность на 100% 🛶", source: 'tg', createdAt: new Date().toISOString() },
  { id: '3', name: "Анна С.", text: "Дети в восторге от лагеря, спасибо ЭВА! ❤️", source: 'instagram', createdAt: new Date().toISOString() },
  { id: '4', name: "Максим", text: "Гиды — просто космос. Знают каждую тропинку и историю.", source: 'tg', createdAt: new Date().toISOString() },
  { id: '5', name: "Елена В.", text: "Вкусная еда на костре, гитара и полная перезагрузка. Вернусь!", source: 'instagram', createdAt: new Date().toISOString() },
  { id: '6', name: "Сергей П.", text: "Сплав на байдарках прошел идеально. Инструктора профи своего дела.", source: 'viber', createdAt: new Date().toISOString() },
  { id: '7', name: "Кристина", text: "Не думала, что в Молдове есть такие красивые и дикие места! 😍", source: 'instagram', createdAt: new Date().toISOString() },
  { id: '8', name: "Алексей Ч.", text: "Организация трансфера, еда, снаряжение — всё четко и вовремя.", source: 'tg', createdAt: new Date().toISOString() },
];

// --- CARD COMPONENT ---
const ReviewCard = ({ review }: { review: Review }) => {
  const config = SOURCE_CONFIG[review.source] || SOURCE_CONFIG.default;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const time = mounted 
    ? new Date(review.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) 
    : "--:--";

  return (
    <div className={cn(
      // Mobile: 85vw width + snap alignment
      "group relative flex-shrink-0 w-[85vw] md:w-[380px] p-6 rounded-3xl snap-center",
      // Base styles
      "bg-slate-900/80 backdrop-blur-xl border border-white/5", 
      "transition-all duration-500 ease-out cursor-default md:hover:-translate-y-1",
      // Dynamic styles from config
      config.borderClass,
      config.glowClass
    )}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-slate-300 shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden">
             {review.avatar ? (
               <img src={review.avatar} alt={review.name} className="w-full h-full object-cover"/>
             ) : (
               review.name[0]
             )}
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">{review.name}</span>
            <div className={cn("flex items-center gap-1.5 mt-1.5 transition-colors duration-300 opacity-60 group-hover:opacity-100", config.iconColor)}>
               {config.icon}
               <span className="text-[12px] font-bold uppercase tracking-wider">{config.label}</span>
            </div>
          </div>
        </div>
        
        {/* ЗВЕЗДЫ УДАЛЕНЫ - МИНИМАЛИЗМ */}
      </div>

      {/* BODY */}
      <p className="text-sm text-slate-300 leading-relaxed font-medium mb-4 group-hover:text-white transition-colors duration-300">
        {review.text}
      </p>

      {/* FOOTER */}
      <div className="flex justify-end items-center gap-1.5 mt-auto border-t border-white/5 pt-3">
        <span className="text-[12px] font-mono text-slate-400 group-hover:text-slate-400 transition-colors">{time}</span>
        
        {/* UX: ГАЛОЧКИ ПРОЧТЕНИЯ */}
        {/* По умолчанию: text-slate-600 (не прочитано/серое) */}
        {/* При наведении: text-{color} (прочитано/цветное) */}
        <CheckCheck 
            size={16} 
            className={cn(
                "transition-colors duration-500", 
                "text-slate-600", 
                `group-hover:${config.checkActiveColor}`
            )} 
        />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function ReviewsMarquee({ reviews = [] }: { reviews?: Review[] }) {
  const displayReviews = reviews.length > 0 ? reviews : FALLBACK_REVIEWS;
  const marqueeList = [...displayReviews, ...displayReviews, ...displayReviews];

  return (
    <section className="py-12 md:py-24 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none opacity-40" />

      {/* HEADER: Left Aligned */}
      <div className="container mx-auto px-4 mb-8 md:mb-16 relative z-10 text-left">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
            <MessageCircle size={14} className="text-teal-400" />
            <span className="text-[16px] font-bold uppercase tracking-widest text-teal-400">Люди говорят</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
            <span className="font-light text-slate-400 block md:inline">Отзывы </span>
            <span className="font-black text-white">Участников</span>
            <span className="text-teal-500">.</span>
        </h2>
        
        {/* Subtitle */}
        <div className="flex items-center gap-2 text-slate-400 text-sm md:text-sm font-medium max-w-xl">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
            <span>Создано из отзывов и оценочных форм туров</span>
        </div>
      </div>

      {/* --- CARDS CONTAINER --- */}
      <div className="relative flex flex-col gap-8">
         
         {/* Fade Edges (Desktop only) */}
         <div className="hidden md:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
         <div className="hidden md:block absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

         {/* SCROLL LOGIC:
            Mobile: snap-x snap-mandatory (Native Swipe)
            Desktop: animate-marquee (Auto scroll 100s)
         */}
         <div className="flex gap-4 md:gap-8 px-4 md:px-0 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar md:animate-marquee md:hover:[animation-play-state:paused] w-full md:w-max md:[animation-duration:100s]">
            {marqueeList.map((review, i) => (
               <ReviewCard key={`review-${i}`} review={review} />
            ))}
         </div>

      </div>

    </section>
  );
}