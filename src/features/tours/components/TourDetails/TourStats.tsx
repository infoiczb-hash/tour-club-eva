"use client";

import React from 'react';
import { Ruler, Signal, Users, Hash } from 'lucide-react';
import { Tour } from '@/features/tours/types';

interface TourStatsProps {
  tour: Tour;
}

export default function TourStats({ tour }: TourStatsProps) {
  if (!tour) return null;

  // 1. СЛОЖНОСТЬ
  const difficultyMap: Record<string, string> = {
    easy: 'Легкий',
    medium: 'Средний',
    hard: 'Сложный',
    expert: 'Экстрим',
  };
  
  const difficultyLabel = tour.difficulty 
    ? (difficultyMap[tour.difficulty.toLowerCase()] || tour.difficulty) 
    : '—';

  // 2. ТИП ТУРА
  const typeMap: Record<string, string> = {
    hiking: 'Поход',
    water: 'Сплав',
    auto: 'Автотур',
    excursion: 'Экскурсия',
  };
  
  const typeLabel = tour.type 
    ? (typeMap[tour.type.toLowerCase()] || tour.type)
    : 'Активный';

  return (
    <div className="flex flex-wrap gap-2.5 md:gap-3 w-full">
      
      {/* ДИСТАНЦИЯ */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Ruler size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-none mb-1">Дистанция</span>
          <span className="text-white font-black text-sm leading-none">{tour.distance || '—'}</span>
        </div>
      </div>

      {/* СЛОЖНОСТЬ */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Signal size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-none mb-1">Сложность</span>
          <span className="text-white font-black text-sm leading-none capitalize">{difficultyLabel}</span>
        </div>
      </div>

      {/* ГРУППА */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Users size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-none mb-1">Группа</span>
          <span className="text-white font-black text-sm leading-none">до {tour.groupSize || 15} чел.</span>
        </div>
      </div>

      {/* ТИП ТУРА */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Hash size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-none mb-1">Тип</span>
          <span className="text-white font-black text-sm leading-none truncate capitalize">{typeLabel}</span>
        </div>
      </div>

    </div>
  );
}