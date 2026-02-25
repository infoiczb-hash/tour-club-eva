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
  
  // ЛОГИКА: Ищем перевод. Если нет — выводим то, что пришло из базы. Если пусто — прочерк.
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
  // ЛОГИКА: Та же самая. Если пришло "выходной день" — выведем "выходной день".
  const typeLabel = tour.type 
    ? (typeMap[tour.type.toLowerCase()] || tour.type)
    : 'Активный';

  // 3. ТЕГ (Для иконки берем первый, если есть)
  const mainTag = tour.tags && tour.tags.length > 0 ? tour.tags[0] : typeLabel;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
      
      {/* ДИСТАНЦИЯ */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
        <div className="text-teal-500 mb-2"><Ruler size={20} /></div>
        <span className="text-[12px] uppercase font-bold text-slate-400 tracking-widest mb-1">Дистанция</span>
        <span className="text-white font-bold text-sm">{tour.distance || '—'}</span>
      </div>

      {/* СЛОЖНОСТЬ */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
        <div className="text-teal-500 mb-2"><Signal size={20} /></div>
        <span className="text-[12px] uppercase font-bold text-slate-400 tracking-widest mb-1">Сложность</span>
        {/* capitalize делает первую букву заглавной */}
        <span className="text-white font-bold text-sm capitalize">{difficultyLabel}</span>
      </div>

      {/* ГРУППА */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
        <div className="text-teal-500 mb-2"><Users size={20} /></div>
        <span className="text-[12px] uppercase font-bold text-slate-400 tracking-widest mb-1">Группа</span>
        <span className="text-white font-bold text-sm">до {tour.groupSize || 15} чел.</span>
      </div>

      {/* ТИП ТУРА */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
        <div className="text-teal-500 mb-2"><Hash size={20} /></div>
        <span className="text-[12px] uppercase font-bold text-slate-400 tracking-widest mb-1">Тип</span>
        <span className="text-white font-bold text-sm truncate w-full px-2 capitalize">{typeLabel}</span>
      </div>

    </div>
  );
}