import React from 'react';
import { Ruler, Signal, Users, Hash } from 'lucide-react';
import { Tour } from '@/features/tours/types';

interface TourStatsProps {
  tour: Tour;
}

export default function TourStats({ tour }: TourStatsProps) {
  if (!tour) return null;

  const difficultyMap: Record<string, string> = {
    easy: 'Легкий',
    medium: 'Средний',
    hard: 'Сложный',
    expert: 'Экстрим',
  };
  
  const difficultyLabel = tour.difficulty 
    ? (difficultyMap[tour.difficulty.toLowerCase()] || tour.difficulty) 
    : '—';

  const typeLabel = tour.category?.title || 'Активный';

  return (
    <div className="flex flex-wrap gap-2.5 md:gap-3 w-full">
      
      {/* ДИСТАНЦИЯ */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Ruler size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1 truncate" title="Дистанция">Дистанция</span>
          <span className="text-white font-black text-sm leading-none truncate" title={tour.distance || '—'}>{tour.distance || '—'}</span>
        </div>
      </div>

      {/* СЛОЖНОСТЬ */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Signal size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1 truncate" title="Сложность">Сложность</span>
          <span className="text-white font-black text-sm leading-none capitalize truncate" title={difficultyLabel}>{difficultyLabel}</span>
        </div>
      </div>

      {/* ГРУППА */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Users size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1 truncate" title="Группа">Группа</span>
          <span className="text-white font-black text-sm leading-none truncate" title={`до ${tour.groupSize || 15} чел.`}>до {tour.groupSize || 15} чел.</span>
        </div>
      </div>

      {/* ТИП ТУРА */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-slate-800/80 transition-colors flex-1 min-w-[130px]">
        <div className="text-teal-500 shrink-0"><Hash size={18} strokeWidth={2.5} /></div>
        <div className="flex flex-col overflow-hidden min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1 truncate" title="Тип">Тип</span>
          <span className="text-white font-black text-sm leading-none truncate capitalize" title={typeLabel}>{typeLabel}</span>
        </div>
      </div>

    </div>
  );
}