// src/features/tours/components/TourStats.tsx
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

  // 1. Безопасное определение категории и сложности
  // Если у тура нет категории, используем 'general'
  const categorySlug = tour.category?.slug || 'general';
  
  // У нас в базе сложность может быть easy, medium, hard, expert
  const difficultyLevel = tour.difficulty?.toLowerCase() || 'medium';
  
  // 2. Достаем нужный текст из словаря с фолбэками
  const tooltipText = 
    DIFFICULTY_DETAILS[categorySlug]?.[difficultyLevel] || 
    DIFFICULTY_DETAILS.general[difficultyLevel] || 
    DIFFICULTY_DETAILS.general['medium']; // Фоллбэк последнего уровня

  const difficultyMap: Record<string, string> = {
    easy: 'Легкий',
    medium: 'Средний',
    hard: 'Сложный',
    expert: 'Экстрим',
  };

  const difficultyLabel = difficultyMap[difficultyLevel] || 'Средний';
  const formatLabel = tour.tourFormat || 'Поход';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ВЕРХНИЙ РЯД: 3 колонки (Сложность, Дистанция, Формат) */}
     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Сложность с Tooltip */}
        <div 
          className="relative flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors cursor-help group z-50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <div className="text-teal-500 shrink-0"><Signal size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none mb-1 flex items-center gap-1">
              Сложность
              <Info size={10} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
            </span>
            <span className="text-white font-black text-sm leading-none truncate capitalize" title={difficultyLabel}>
              {difficultyLabel}
            </span>
          </div>

          {/* CSS Tooltip */}
          {showTooltip && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-200"
            >
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {tooltipText}
              </p>
              {/* Треугольник-указатель */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
            </div>
          )}
        </div>

        {/* Дистанция */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors">
          <div className="text-teal-500 shrink-0"><Ruler size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none mb-1 truncate" title="Дистанция">Длина</span>
            <span className="text-white font-black text-sm leading-none truncate" title={tour.distance || '—'}>{tour.distance || '—'}</span>
          </div>
        </div>

        {/* Формат */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors">
          <div className="text-teal-500 shrink-0"><Backpack size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none mb-1 truncate" title="Формат">Формат</span>
            <span className="text-white font-black text-sm leading-none truncate capitalize" title={formatLabel}>{formatLabel}</span>
          </div>
        </div>
        
      </div>

      {/* НИЖНИЙ РЯД: Широкий блок с информацией о группе */}
      <div className="flex items-start gap-4 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-4 hover:bg-slate-800/80 transition-colors w-full">
        <div className="text-teal-500 shrink-0 mt-0.5"><Users size={20} strokeWidth={2.5} /></div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] uppercase font-bold text-slate-300 tracking-widest leading-none mb-1.5" title="Группа">
            Информация о группе
          </span>
          <span className="text-white font-bold text-sm leading-snug break-words">
            {tour.groupInfo || `Размер группы: до ${tour.spots || 8-20} человек`}
          </span>
        </div>
      </div>

      {/* Глобальный оверлей для закрытия тултипа при клике мимо */}
      {showTooltip && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowTooltip(false)} 
        />
      )}
    </div>
  );
}