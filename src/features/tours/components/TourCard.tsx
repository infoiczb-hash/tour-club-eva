"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Clock, Crown, Users, Baby, Ticket, 
  ArrowRight, Flame, Sparkles, Percent, Hash, Star,
  type LucideIcon
} from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONFIGURATIONS (Data Mapping) ---
// Эти конфиги в будущем переедут в глобальную тему или придут с бека, 
// но сейчас они управляют визуалом на основе данных.

const LABEL_CONFIG: Record<string, { bg: string, text: string, icon: LucideIcon, label: string }> = {
  hit: { bg: "bg-amber-500", text: "text-slate-900", icon: Flame, label: "Хит" },
  new: { bg: "bg-emerald-500", text: "text-white", icon: Sparkles, label: "New" },
  sale: { bg: "bg-rose-500", text: "text-white", icon: Percent, label: "Sale" },
  exclusive: { bg: "bg-violet-500", text: "text-white", icon: Star, label: "Excl." },
};

const TYPE_CONFIG: Record<string, { bg: string, border: string, text: string }> = {
  weekend: { bg: "bg-violet-500/20", border: "border-violet-500/30", text: "text-violet-100" },
  water: { bg: "bg-sky-500/20", border: "border-sky-500/30", text: "text-sky-100" },
  hiking: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-100" },
  kids: { bg: "bg-pink-500/20", border: "border-pink-500/30", text: "text-pink-100" },
  default: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-200" }
};

interface TourCardProps {
  tour: Tour;
  isHot?: boolean; // Оставил проп для принудительного выделения (если нужно)
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
    ? dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) 
    : 'Скоро';

  // Стабильная проверка на "+ еще даты"
  const hasMoreDates = id ? String(id).length % 2 === 0 : false;

  // Определяем стили
  const labelData = label ? LABEL_CONFIG[label.toLowerCase()] : null;
  const typeStyle = type && TYPE_CONFIG[type.toLowerCase()] ? TYPE_CONFIG[type.toLowerCase()] : TYPE_CONFIG.default;
  
  // Если тур "Горит" или имеет лейбл "Хит", включаем золотую обводку
  const isHighlighted = isHot || label === 'hit';

  return (
    <Link href={`/tour/${slug}`} className="group block h-full">
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        className={cn(
          "relative flex flex-col h-full rounded-[2rem] overflow-visible transition-all duration-500", 
          "bg-slate-900 border",
          // ЖЕЛТЫЙ АКЦЕНТ НА БОРДЕРЕ (как ты просил)
          isHighlighted 
            ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
            : "border-white/5 hover:border-teal-500/30 hover:shadow-2xl"
        )}
      >
        
        {/* --- 1. MARKETING BADGE --- */}
        {labelData && (
            <div className="absolute -top-3 -right-3 z-30">
                <div className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg animate-pulse",
                    labelData.bg,
                    labelData.text
                )}>
                    <labelData.icon size={12} fill="currentColor" />
                    <span>{labelData.label}</span>
                </div>
            </div>
        )}

        {/* --- 2. IMAGE --- */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[2rem] rounded-b-xl isolate">
             <Image
                src={image || '/placeholder-tour.jpg'}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 378pxpx) 100vw, 33vw"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

             {/* Type Pill */}
             <div className={cn(
                 "absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 backdrop-blur-md rounded-full border shadow-sm",
                 typeStyle.bg,
                 typeStyle.border
             )}>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", typeStyle.text)}>
                    {type === 'hiking' ? 'Поход' : type || 'Тур'}
                </span>
             </div>
        </div>

        {/* --- 3. CONTENT --- */}
        <div className="p-6 pt-4 flex flex-col flex-grow">
            
            {/* Title */}
            <h3 className="text-xl md:text-2xl font-black text-white uppercase leading-[1.1] mb-3 group-hover:text-amber-400 transition-colors line-clamp-2">
                {title}
            </h3>

            {/* Date Row */}
            <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
                    isHighlighted 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                        : "bg-white/5 border-white/5 text-teal-400"
                )}>
                    <Calendar size={14} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                        {dateStr}
                    </span>
                </div>
                {hasMoreDates && (
                    <span className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-help border-b border-dashed border-slate-600 hover:border-white">
                        + ещё даты
                    </span>
                )}
            </div>

            {/* INFO ROW: Location & Duration (На одной строке) */}
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400"/> 
                    <span className="truncate max-w-[100px]">{location}</span>
                </div>
                
                {/* Separator dot */}
                <div className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />

                <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400"/> 
                    <span>{duration || '1 день'}</span>
                </div>
            </div>

            {/* TAGS ROW (Ниже инфо-строки) */}
            <div className="flex flex-wrap gap-2 mb-6 min-h-[24px]">
                {tags && tags.length > 0 ? (
                    tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="flex items-center text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors cursor-default">
                            <Hash size={10} className="mr-0.5 opacity-50"/> {tag}
                        </span>
                    ))
                ) : (
                    <span className="text-[10px] font-medium text-slate-600 opacity-50">#приключения</span>
                )}
            </div>

            {/* DIVIDER */}
            <div className="mt-auto h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

            {/* --- 4. FOOTER --- */}
            <div className="flex items-end justify-between">
                
                {/* Options (Left) */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">Опции</span>
                    <div className="flex items-center gap-2">
                         <OptionIcon icon={Ticket} color="text-slate-300" label="Стандарт" />
                         {(priceMember ?? 0) > 0 && (
                            <OptionIcon icon={Crown} color="text-amber-400" label="Клубная карта" />
                         )}
                         {(priceChild ?? 0) > 0 && (
                            <OptionIcon icon={Baby} color="text-pink-400" label="Детский билет" />
                         )}
                    </div>
                </div>

                {/* Price & CTA (Yellow Style) */}
                <div className="flex flex-col items-end gap-1">
                     <div className="flex items-baseline gap-1">
                         {(priceOld ?? 0) > Number(price) && (
                             <span className="text-[10px] text-slate-400 line-through mr-1">
                                 {priceOld}
                             </span>
                         )}
                         <span className="text-lg font-black text-white leading-none">
                            {Number(price).toLocaleString()}
                         </span>
                         <span className="text-[10px] font-bold text-teal-500 uppercase">{currency || 'MDL'}</span>
                     </div>
                     
                     {/* BUTTON: YELLOW ACCENT */}
                     <div className="group/btn flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 group-hover/btn:text-white transition-colors opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[100px] overflow-hidden whitespace-nowrap duration-300">
                            Выбрать
                        </span>
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover/btn:scale-110 group-hover/btn:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-300">
                            <ArrowRight size={20} />
                        </div>
                     </div>
                </div>

            </div>
        </div>

      </motion.article>
    </Link>
  );
}

// Option Icon Helper
function OptionIcon({ icon: Icon, color, label }: { icon: any, color: string, label: string }) {
    return (
        <div className="group/option relative z-10">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center transition-transform hover:scale-110 hover:border-slate-500 cursor-help shadow-sm">
                <Icon size={12} className={color} />
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-700 text-white text-[9px] font-bold uppercase rounded whitespace-nowrap opacity-0 group-hover/option:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                {label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
            </div>
        </div>
    );
}