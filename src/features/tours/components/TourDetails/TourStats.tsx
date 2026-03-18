import React from 'react';
import { Ruler, Signal, Users, Backpack, Info } from 'lucide-react';
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

  const formatLabel = tour.tourFormat || tour.category?.title || 'Активный';

  return (
    <div className="flex flex-col gap-3 w-full">
      
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

        {/* 2. СЛОЖНОСТЬ (с иконкой-подсказкой) */}
        <div 
          className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 hover:bg-slate-800/80 transition-colors flex-1 min-w-0 group cursor-help"
          title="Уровень физической и технической подготовки"
        >
          <div className="text-teal-500 shrink-0"><Signal size={18} strokeWidth={2.5} /></div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none truncate">Сложность</span>
              <Info size={10} className="text-slate-500 group-hover:text-teal-400 transition-colors shrink-0" />
            </div>
            <span className="text-white font-black text-sm leading-none capitalize truncate" title={difficultyLabel}>{difficultyLabel}</span>
          </div>
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

    </div>
  );
}