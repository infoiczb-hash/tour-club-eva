"use client";

import React, { useState } from 'react';
import { Ruler, Signal, Users, Backpack, Info, X } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { DIFFICULTY_DETAILS } from '../../constants/difficultyMapping';

interface TourStatsProps {
  tour: Tour;
}

export default function TourStats({ tour }: TourStatsProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!tour) return null;

  const categorySlug = tour.category?.slug || 'general';
  const difficultyLevel = tour.difficulty?.toLowerCase() || 'medium';
  
  const tooltipText = 
    DIFFICULTY_DETAILS[categorySlug]?.[difficultyLevel] || 
    DIFFICULTY_DETAILS.general[difficultyLevel] || 
    DIFFICULTY_DETAILS.general['medium'];

  const difficultyMap: Record<string, string> = {
    easy: 'Легкий',
    medium: 'Средний',
    hard: 'Сложный',
    expert: 'Экстрим',
  };
  
  const difficultyLabel = difficultyMap[difficultyLevel] || tour.difficulty || '—';
  const formatLabel = tour.tourFormat || tour.category?.title || 'Активный';

  return (
    <div className="flex flex-col gap-3 w-full relative z-20">
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        
        {/* 1. ДИСТАНЦИЯ */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors flex-1 min-w-0">
          <div className="text-teal-500 shrink-0"><Ruler size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none mb-1 truncate">Дистанция</span>
            <span className="text-white font-black text-sm leading-none truncate">{tour.distance || '—'}</span>
          </div>
        </div>

        {/* 2. СЛОЖНОСТЬ */}
        <div className="relative flex flex-col min-w-0">
          <div 
            className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors cursor-pointer select-none group h-full"
            onClick={() => setShowTooltip(!showTooltip)}
            role="button"
            aria-expanded={showTooltip}
            aria-label="Подробнее о сложности маршрута"
          >
            <div className="text-teal-500 shrink-0"><Signal size={18} strokeWidth={2.5} /></div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none truncate">Сложность</span>
                {/* 👇 ИСПРАВЛЕНО: размер иконки увеличен до 16 */}
                <Info 
                  size={16} 
                  className={showTooltip ? "text-teal-400" : "text-slate-400 group-hover:text-teal-400 transition-colors"} 
                />
              </div>
              <span className="text-white font-black text-sm leading-none capitalize">{difficultyLabel}</span>
            </div>
          </div>

          {/* ТУЛТИП — чистый CSS без framer-motion */}
          {showTooltip && (
            // 👇 ИСПРАВЛЕНО: top-full, mt-3, slide-in-from-top-2
            <div className="absolute top-full left-0 md:left-1/2 md:-translate-x-1/2 mt-3 w-[260px] md:w-72 z-50 p-4 md:p-5 bg-slate-800 border border-teal-500/30 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[12px] font-black uppercase text-teal-400 tracking-wider">О сложности</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                  aria-label="Закрыть подсказку"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                {tooltipText}
              </p>
              {/* 👇 ИСПРАВЛЕНО: Хвостик сверху, указывает вверх */}
              <div className="absolute -top-1.5 left-8 md:left-1/2 md:-translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-l border-t border-teal-500/30" />
            </div>
          )}
        </div>

        {/* 3. ФОРМАТ ТУРА */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors col-span-2 md:col-span-1 min-w-0">
          <div className="text-teal-500 shrink-0"><Backpack size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none mb-1 truncate">Формат</span>
            <span className="text-white font-black text-sm leading-none truncate capitalize">{formatLabel}</span>
          </div>
        </div>
        
      </div>

      {/* НИЖНИЙ РЯД */}
      <div className="flex items-start gap-4 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-4 hover:bg-slate-800/80 transition-colors w-full">
        <div className="text-teal-500 shrink-0 mt-0.5"><Users size={20} strokeWidth={2.5} /></div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none mb-1.5">
            Информация о группе
          </span>
          <span className="text-white font-bold text-sm leading-snug break-words">
            {tour.groupInfo || `Размер группы: до ${tour.spots || 15} человек.`}
          </span>
        </div>
      </div>

      {/* Оверлей для закрытия */}
      {showTooltip && (
        <div className="fixed inset-0 z-40" onClick={() => setShowTooltip(false)} />
      )}
    </div>
  );
}