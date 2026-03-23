"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, Info, ChevronRight, Award, 
  Map, Mountain, Flame, Crown, Sparkles, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── СИСТЕМА УРОВНЕЙ ────────────────────────────────────────────────────────
const LEVELS = [
  { id: 'novice', name: 'Первопроходец', min: 0, max: 2, color: 'text-slate-300', from: 'from-slate-700', to: 'to-slate-900', border: 'border-slate-500/30', icon: Map },
  { id: 'hiker', name: 'Походник', min: 3, max: 6, color: 'text-emerald-400', from: 'from-emerald-600', to: 'to-teal-900', border: 'border-emerald-500/30', icon: Compass },
  { id: 'experienced', name: 'Бывалый', min: 7, max: 14, color: 'text-blue-400', from: 'from-blue-600', to: 'to-indigo-900', border: 'border-blue-500/30', icon: Mountain },
  { id: 'veteran', name: 'Ветеран', min: 15, max: 29, color: 'text-purple-400', from: 'from-purple-600', to: 'to-fuchsia-900', border: 'border-purple-500/30', icon: Flame },
  { id: 'legend', name: 'Легенда клуба', min: 30, max: 999, color: 'text-amber-400', from: 'from-amber-500', to: 'to-orange-900', border: 'border-amber-500/50', icon: Crown },
];

interface VirtualCardProps {
  name: string;
  level: string;
  totalTours: number;
  totalKm: number;
  memberId: string;
}

export default function VirtualCard({ name, level: _levelStr, totalTours, totalKm, memberId }: VirtualCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const tours = totalTours || 0;
  
  // Определяем текущий уровень
  const currentLevelIndex = LEVELS.findIndex(l => tours >= l.min && tours <= l.max) !== -1 
    ? LEVELS.findIndex(l => tours >= l.min && tours <= l.max) 
    : 0;
  
  const level = LEVELS[currentLevelIndex];
  const nextLevel = LEVELS[currentLevelIndex + 1];
  
  // Вычисляем прогресс
  const toursNeeded = nextLevel ? nextLevel.min - tours : 0;
  const progressPercent = nextLevel 
    ? ((tours - level.min) / (nextLevel.min - level.min)) * 100 
    : 100;

  const LevelIcon = level.icon;

  return (
    <div className="relative w-full max-w-sm mx-auto sm:max-w-none sm:w-[380px] aspect-[1.6/1] perspective-1000">
      <motion.div
        className="w-full h-full relative preserve-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* ─── ЛИЦЕВАЯ СТОРОНА ────────────────────────────────────────────── */}
        <div className={cn(
          "absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl border",
          "bg-gradient-to-br", level.from, level.to, level.border
        )}>
          {/* Декоративный паттерн */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <Compass className={level.color} size={24} />
              </div>
              <span className="font-black text-white tracking-widest uppercase text-lg drop-shadow-md">EVA</span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md border border-white/10 transition-colors text-white/80 hover:text-white"
              aria-label="Информация об уровне"
            >
              <Info size={18} />
            </button>
          </div>

          <div className="relative z-10 flex flex-col gap-1 mt-auto">
            <div className="flex items-center gap-2 mb-1">
              <LevelIcon className={level.color} size={16} />
              <p className={cn("text-xs font-bold uppercase tracking-widest drop-shadow-md", level.color)}>
                {level.name}
              </p>
            </div>
            <p className="text-xl font-bold text-white tracking-widest drop-shadow-md truncate">
              {name || 'ТУРИСТ'}
            </p>
            <div className="flex justify-between items-end mt-2">
              <p className="text-sm font-medium text-white/70 tracking-widest font-mono truncate mr-2">
                {memberId.split('-')[0].toUpperCase() || 'ID_PENDING'}
              </p>
              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">КМ</p>
                  <p className="text-xl font-black text-white leading-none">{Math.round(totalKm)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">Туров</p>
                  <p className="text-xl font-black text-white leading-none">{tours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ОБРАТНАЯ СТОРОНА (ПРОГРЕСС И ПРАВИЛА) ──────────────────────── */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col overflow-hidden shadow-2xl border bg-slate-900 border-white/10",
          )}
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Прогресс</h3>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {nextLevel ? (
              <>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">До уровня</span>
                  </div>
                  <span className={cn("text-xs font-black uppercase tracking-widest", nextLevel.color)}>
                    {nextLevel.name}
                  </span>
                </div>
                
                <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 mb-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isFlipped ? `${progressPercent}%` : 0 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className={cn("h-full bg-gradient-to-r relative", level.from, nextLevel.to)}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                  </motion.div>
                </div>

                <p className="text-center text-sm font-medium text-slate-300">
                  Осталось туров: <strong className="text-white text-lg">{toursNeeded}</strong>
                </p>
              </>
            ) : (
              <div className="text-center">
                <Sparkles size={32} className="text-amber-400 mx-auto mb-3" />
                <h3 className="text-amber-400 font-black uppercase tracking-widest mb-2">Максимальный уровень</h3>
                <p className="text-xs text-slate-400 font-medium">Вы достигли вершины нашей программы лояльности. Спасибо, что вы с нами!</p>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-medium">Новые уровни открывают доступ к закрытым турам и раннему бронированию.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}