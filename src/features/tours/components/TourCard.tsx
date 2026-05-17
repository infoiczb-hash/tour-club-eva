// src/features/tours/components/TourCard.tsx
"use client";

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Calendar, Clock, Crown, Baby,
  ArrowRight, Flame, Sparkles, Percent, Star, Hash,
  type LucideIcon
} from 'lucide-react';
import { TourPreview } from '@/features/tours/types';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LABEL_CONFIG: Record<string, { bg: string, text: string, icon: LucideIcon, label: string }> = {
  hit: { bg: "bg-amber-500", text: "text-slate-900", icon: Flame, label: "Хит продаж" },
  new: { bg: "bg-emerald-500", text: "text-white", icon: Sparkles, label: "Новинка" },
  sale: { bg: "bg-rose-500", text: "text-white", icon: Percent, label: "Скидка" },
  exclusive: { bg: "bg-violet-500", text: "text-white", icon: Star, label: "Эксклюзив" },
};

// СЛОВАРЬ ДИЗАЙН-СИСТЕМЫ (Привязан к цвету из БД)
const COLOR_THEMES: Record<string, { bg: string, border: string, text: string }> = {
  slate:   { bg: "bg-slate-800/80",   border: "border-slate-500",   text: "text-white" },
  teal:    { bg: "bg-teal-500/80",    border: "border-teal-400",    text: "text-white" },
  emerald: { bg: "bg-emerald-500/80", border: "border-emerald-400", text: "text-white" },
  sky:     { bg: "bg-sky-500/80",     border: "border-sky-400",     text: "text-white" },
  blue:    { bg: "bg-blue-500/80",    border: "border-blue-400",    text: "text-white" },
  violet:  { bg: "bg-violet-500/80",  border: "border-violet-400",  text: "text-white" },
  pink:    { bg: "bg-pink-500/80",    border: "border-pink-400",    text: "text-white" },
  rose:    { bg: "bg-rose-500/80",    border: "border-rose-400",    text: "text-white" },
  orange:  { bg: "bg-orange-500/80",  border: "border-orange-400",  text: "text-white" },
  amber:   { bg: "bg-amber-500/80",   border: "border-amber-400",   text: "text-white" },
};

export interface TourCardProps {
  tour: TourPreview;
  isHot?: boolean;
  priority?: boolean;
}

function TourCard({ tour, isHot = false, priority = false }: TourCardProps) {
  const {
    slug, title, date, id,
    price, priceOld, currency,
    priceMember, priceChild,
    image, location, duration,
    tags, label, category,
    dates 
  } = tour;

  // ОПТИМИЗАЦИЯ: Мемоизируем тяжелые вычисления с датами, чтобы не грузить главный поток
  const { dateStr, isPast, hasMoreDates } = useMemo(() => {
    const dateObj = date ? new Date(date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPastDate = dateObj ? dateObj.getTime() < today.getTime() : false;
    
    let futureCount = 0;
    if (Array.isArray(dates)) {
      futureCount = dates.filter((d: any) => {
        const end = d.end ? new Date(d.end) : new Date(d.start);
        end.setHours(0, 0, 0, 0);
        return end >= today;
      }).length;
    }

    return {
      dateStr: dateObj ? dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Скоро',
      isPast: isPastDate,
      hasMoreDates: futureCount > 1
    };
  }, [date, dates]);

  const isHighlighted = isHot || (label && label.toLowerCase().includes('хит'));
  const themeColor = category?.color || 'slate';
  const typeStyle = COLOR_THEMES[themeColor] || COLOR_THEMES.slate;
  const displayLabel = category?.title || "Тур";

  // ОПТИМИЗАЦИЯ: prefetch={false} спасает от DDoS-атаки на собственный сервер при скролле
  return (
    <Link href={`/tour/${slug}`} prefetch={false} className="group block h-full outline-none w-full">
      <article
        className={cn(
          "relative flex flex-col h-full rounded-[2rem] overflow-hidden transition-all duration-500",
          "bg-[#0d131a] border-2 border-white/10",
          isHighlighted
            ? "shadow-[0_0_30px_rgba(245,158,11,0.1)] hover:border-amber-500/60"
            : "hover:border-teal-500/60 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_20px_rgba(20,184,166,0.2)]",
          "hover:-translate-y-2"
        )}
      >
       <div className="relative w-full aspect-[4/5] sm:aspect-[16/13] overflow-hidden bg-slate-800 shrink-0">
          <Image
            src={image || '/placeholder-tour.jpg'}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            quality={60}
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d131a] via-transparent to-slate-950/40" />
  
          {/* Бейдж категории */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <div className={cn(
              "flex items-center px-3 py-1.5 backdrop-blur-md rounded-xl border shadow-sm min-w-0",
              typeStyle.bg, typeStyle.border
            )}>
              <span className={cn("text-xs font-black uppercase tracking-wider truncate", typeStyle.text)}>
                {displayLabel}
              </span>
            </div>

            {/* Плашка "Хит/Новинка" */}
            {label && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-lg bg-rose-500 text-white animate-pulse shrink-0">
                {!label.includes('🔥') && !label.includes('✨') && (
                  <Flame size={14} strokeWidth={2.5} />
                )}
                <span className="text-xs font-black uppercase tracking-wider">{label}</span>
              </div>
            )}
          </div>

          {/* Дата поверх фото снизу */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md shadow-lg",
              isHighlighted
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-slate-900/80 border-white/20 text-teal-400"
            )}>
              <Calendar size={14} strokeWidth={2.5} />
              <span suppressHydrationWarning className={cn(
                  "text-xs sm:text-sm font-black uppercase tracking-wider",
                  isPast && "text-slate-400"
              )}>
                 {isPast ? "Завершен" : dateStr}
              </span>
              {hasMoreDates && !isPast && (
                <span className="text-xs font-bold text-white/90 ml-1 border-b border-dashed border-white/40">+ другие даты</span>
              )}
            </div>
          </div>
        </div>

        {/* Текстовый блок */}
       <div className="p-6 sm:p-7 flex flex-col flex-grow bg-[#0d131a]">
          
          {/* Локация и длительность */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-teal-500" strokeWidth={3} />
              <span className="truncate max-w-[140px] sm:max-w-full text-slate-200">{location}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-teal-500" strokeWidth={3} />
              <span className="text-slate-200">{duration || '1 день'}</span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white uppercase leading-[1.2] mb-4 group-hover:text-teal-400 transition-colors line-clamp-2">
            {title}
          </h3>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                  <Hash size={12} strokeWidth={3} /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Тарифы */}
          <div className={cn("flex flex-wrap gap-2 mb-6 mt-auto", (!tags || tags.length === 0) && "mt-auto")}>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-white/20 text-xs font-bold text-slate-200 uppercase tracking-wider">
              Стандарт
            </span>
            {(priceMember ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Crown size={12} strokeWidth={2.5} /> Клубная
              </span>
            )}
            {(priceChild ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-xs font-bold text-pink-400 uppercase tracking-wider">
                <Baby size={12} strokeWidth={2.5} /> Детский
              </span>
            )}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mb-5" />

          {/* Подвал с ценой и кнопкой */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Стоимость</span>
              <div className="flex items-baseline gap-1.5">
                {(priceOld ?? 0) > Number(price) && (
                  <span className="text-xs font-bold text-rose-400/80 line-through decoration-rose-400/50 mr-1">{priceOld}</span>
                )}
                <span className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tighter drop-shadow-md">
                  {Number(price).toLocaleString()}
                </span>
                <span className="text-xs font-black text-teal-400 uppercase tracking-wider ml-1">{currency || 'RUB'}</span>
              </div>
            </div>
            
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110",
              isHighlighted
                ? "bg-amber-500 text-slate-900 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                : "bg-teal-500 text-slate-900 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]"
            )}>
              <ArrowRight size={24} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default memo(TourCard);