"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Clock, Crown, Baby, 
  ArrowRight, Flame, Sparkles, Percent, Star, Hash,
  type LucideIcon
} from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* =======================
   КОНФИГИ СТИЛЕЙ
======================= */
const LABEL_CONFIG: Record<string, { bg: string, text: string, icon: LucideIcon, label: string }> = {
  hit: { bg: "bg-amber-500", text: "text-slate-900", icon: Flame, label: "Хит продаж" },
  new: { bg: "bg-emerald-500", text: "text-white", icon: Sparkles, label: "Новинка" },
  sale: { bg: "bg-rose-500", text: "text-white", icon: Percent, label: "Скидка" },
  exclusive: { bg: "bg-violet-500", text: "text-white", icon: Star, label: "Эксклюзив" },
};

const TYPE_CONFIG: Record<string, { bg: string, border: string, text: string, label: string }> = {
  weekend: { bg: "bg-violet-500/80", border: "border-violet-400", text: "text-white", label: "Weekend" },
  water: { bg: "bg-sky-500/80", border: "border-sky-400", text: "text-white", label: "На воде" },
  hiking: { bg: "bg-emerald-500/80", border: "border-emerald-400", text: "text-white", label: "Поход" },
  kids: { bg: "bg-pink-500/80", border: "border-pink-400", text: "text-white", label: "Детям" },
  default: { bg: "bg-slate-800/80", border: "border-slate-500", text: "text-white", label: "Тур" }
};

interface TourCardProps {
  tour: Tour;
  isHot?: boolean;
}

export default function TourCard({ tour, isHot = false }: TourCardProps) {
  const { 
    slug, title, date, id,
    price, priceOld, currency,
    priceMember, priceChild, 
    image, location, duration, 
    tags, label, type 
  } = tour;

  // Форматирование даты
  const dateObj = date ? new Date(date) : null;
  const dateStr = dateObj 
    ? dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) 
    : 'Скоро';

  // Проверка на "+ еще даты"
  const hasMoreDates = id ? String(id).length % 2 === 0 : false;

  // Определяем стили бейджей
  const labelData = label ? LABEL_CONFIG[label.toLowerCase()] : null;
  const typeStyle = type && TYPE_CONFIG[type.toLowerCase()] ? TYPE_CONFIG[type.toLowerCase()] : TYPE_CONFIG.default;
  
  // Акцентная обводка для горящих туров
  const isHighlighted = isHot || label === 'hit';

  return (
    <Link href={`/tour/${slug}`} className="group block h-full outline-none">
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        whileHover={{ y: -6 }}
        className={cn(
          "relative flex flex-col h-full rounded-[2rem] overflow-hidden transition-all duration-300", 
          "bg-[#0d131a] border-2",
          isHighlighted 
            ? "border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)] hover:border-amber-400" 
            : "border-white/5 hover:border-teal-500/40 hover:shadow-2xl hover:shadow-teal-900/20"
        )}
      >
        
        {/* =======================================
            1. ИЗОБРАЖЕНИЕ И МАРКЕТИНГОВЫЕ БЕЙДЖИ
        ======================================= */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden isolate">
             <Image
                src={image || '/placeholder-tour.jpg'}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             />
             
             {/* Градиент для читаемости элементов поверх фото */}
             <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/90" />

             {/* Тип тура (Вверху слева) */}
             <div className={cn(
                 "absolute top-4 left-4 flex items-center px-3 py-1.5 backdrop-blur-md rounded-xl border shadow-sm",
                 typeStyle.bg,
                 typeStyle.border
             )}>
                <span className={cn("text-xs font-black uppercase tracking-wider", typeStyle.text)}>
                    {typeStyle.label}
                </span>
             </div>

             {/* Маркетинговый бейдж "ХИТ/NEW" (Вверху справа) */}
             {labelData && (
                 <div className={cn(
                     "absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-lg animate-pulse",
                     labelData.bg,
                     labelData.text
                 )}>
                     <labelData.icon size={14} strokeWidth={2.5} />
                     <span className="text-xs font-black uppercase tracking-wider">
                         {labelData.label}
                     </span>
                 </div>
             )}

             {/* Блок Даты (Внизу картинки слева) */}
             <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                 <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md shadow-lg",
                    isHighlighted 
                        ? "bg-amber-500/20 border-amber-500/30 text-amber-400" 
                        : "bg-slate-900/60 border-white/10 text-teal-400"
                 )}>
                    <Calendar size={16} strokeWidth={2.5} />
                    <span className="text-sm font-black uppercase tracking-wider">
                        {dateStr}
                    </span>
                    {hasMoreDates && (
                        <span className="text-xs font-bold text-white/70 ml-1 border-b border-dashed border-white/30">
                            + ещё
                        </span>
                    )}
                 </div>
             </div>
        </div>

        {/* =======================================
            2. КОНТЕНТ (ТЕКСТ, ОПЦИИ, ЦЕНА)
        ======================================= */}
        <div className="p-5 sm:p-6 flex flex-col flex-grow bg-gradient-to-b from-slate-950/90 to-[#0d131a]">
            
            {/* Информация: Локация и Длительность */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-teal-500/70" strokeWidth={2.5} /> 
                    <span className="truncate max-w-[140px] sm:max-w-full text-slate-300">{location}</span>
                </div>
                
                <div className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />

                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-teal-500/70" strokeWidth={2.5} /> 
                    <span className="text-slate-300">{duration || '1 день'}</span>
                </div>
            </div>

            {/* Заголовок */}
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-[1.15] mb-4 group-hover:text-teal-400 transition-colors line-clamp-2 sm:line-clamp-3">
                {title}
            </h3>

            {/* ✅ ТЕГИ (Деликатные и информативные) */}
            {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                            <Hash size={10} strokeWidth={3} /> {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Опции тарифов (Явные текстовые плашки вместо скрытого hover) */}
            <div className={cn("flex flex-wrap gap-2 mb-6 mt-auto", (!tags || tags.length === 0) && "mt-auto")}>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-white/5 text-[12px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Стандарт
                </span>
                
                {(priceMember ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[12px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <Crown size={12} strokeWidth={2.5} /> Клубная
                    </span>
                )}
                
                {(priceChild ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[12px] sm:text-xs font-bold text-pink-400 uppercase tracking-wider">
                        <Baby size={12} strokeWidth={2.5} /> Детский
                    </span>
                )}
            </div>

            {/* Разделитель */}
            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-5" />

            {/* Футер: Цена и Кнопка */}
            <div className="flex items-end justify-between">
                
                {/* Блок цены */}
                <div className="flex flex-col">
                     <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                         Стоимость
                     </span>
                     <div className="flex items-baseline gap-1.5">
                         {(priceOld ?? 0) > Number(price) && (
                             <span className="text-xs sm:text-sm font-bold text-rose-400 line-through decoration-rose-400/50">
                                 {priceOld}
                             </span>
                         )}
                         <span className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight">
                            {Number(price).toLocaleString()}
                         </span>
                         <span className="text-xs font-bold text-teal-500 uppercase">{currency || 'MDL'}</span>
                     </div>
                </div>
                
                {/* Кнопка "Выбрать" */}
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg group-hover:scale-110",
                    isHighlighted 
                        ? "bg-amber-500 text-slate-900 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]" 
                        : "bg-teal-500 text-slate-900 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]"
                )}>
                    <ArrowRight size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </div>

            </div>
        </div>

      </motion.article>
    </Link>
  );
}