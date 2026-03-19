"use client";

import React, { useState } from 'react';
import { Ruler, Signal, Users, Backpack, Info, X } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { DIFFICULTY_DETAILS } from '../../constants/difficultyMapping';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const difficultyLabel = difficultyMap[difficultyLevel] || tour.difficulty || '—';
  const formatLabel = tour.tourFormat || tour.category?.title || 'Активный';

  return (
    <div className="flex flex-col gap-3 w-full relative z-20">
      
      {/* ВЕРХНИЙ РЯД: 3 короткие метрики в линию */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        
        {/* 1. ДИСТАНЦИЯ */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors flex-1 min-w-0">
          <div className="text-teal-500 shrink-0"><Ruler size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1 truncate" title="Дистанция">Дистанция</span>
            <span className="text-white font-black text-sm leading-none truncate" title={tour.distance || '—'}>{tour.distance || '—'}</span>
          </div>
        </div>

        {/* 2. СЛОЖНОСТЬ (с интерактивной подсказкой) */}
        <div 
          className="relative flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors flex-1 min-w-0 group cursor-pointer select-none"
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <div className="text-teal-500 shrink-0"><Signal size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none truncate">Сложность</span>
              <Info size={10} className={showTooltip ? "text-teal-400" : "text-slate-500 group-hover:text-teal-400 transition-colors"} />
            </div>
            <span className="text-white font-black text-sm leading-none capitalize truncate">{difficultyLabel}</span>
          </div>

          {/* ИНТЕРАКТИВНЫЙ TOOLTIP */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-full left-0 md:left-1/2 md:-translate-x-1/2 mb-3 w-[260px] md:w-72 z-50 p-4 md:p-5 bg-slate-800 border border-teal-500/30 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()} // Клик внутри тултипа его не закрывает
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider">О сложности</span>
                  <X 
                    size={16} 
                    className="text-slate-400 cursor-pointer hover:text-white transition-colors" 
                    onClick={() => setShowTooltip(false)} 
                  />
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                  {tooltipText}
                </p>
                {/* Декоративный хвостик тултипа */}
                <div className="absolute -bottom-1.5 left-8 md:left-1/2 md:-translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-teal-500/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. ФОРМАТ ТУРА */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors col-span-2 md:col-span-1 min-w-0">
          <div className="text-teal-500 shrink-0"><Backpack size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1 truncate" title="Формат">Формат</span>
            <span className="text-white font-black text-sm leading-none truncate capitalize" title={formatLabel}>{formatLabel}</span>
          </div>
        </div>
        
      </div>

      {/* НИЖНИЙ РЯД: Широкий блок с информацией о группе */}
      <div className="flex items-start gap-4 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-4 hover:bg-slate-800/80 transition-colors w-full">
        <div className="text-teal-500 shrink-0 mt-0.5"><Users size={20} strokeWidth={2.5} /></div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1.5" title="Группа">
            Информация о группе
          </span>
          <span className="text-white font-bold text-sm leading-snug break-words">
            {tour.groupInfo || `Размер группы: до ${tour.spots || 15} человек.`}
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