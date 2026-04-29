'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Waves, Anchor, Sailboat, 
  Snowflake, Wind, Mountain, 
  Map, MapPin, 
  Footprints, Activity, 
  Flame, Tent, Lock, ChevronRight, X, CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface UserAchievements {
  waterTours: number;
  winterTours: number;
  pmrTours: number;
  totalKm: number;
  totalNights: number;
}

// Конфигурация эволюции бейджей
const CATEGORIES = [
  {
    id: 'water',
    title: 'Водные туры',
    unit: 'сплав.',
    current: (stats: UserAchievements) => stats.waterTours || 0,
    tiers: [
      { min: 1, name: 'Матрос', icon: Sailboat, color: 'text-blue-300', bg: 'from-blue-600 to-indigo-900', shadow: 'shadow-blue-500/20' },
      { min: 3, name: 'Капитан', icon: Anchor, color: 'text-blue-400', bg: 'from-blue-500 to-blue-800', shadow: 'shadow-blue-500/40' },
      { min: 5, name: 'Хранитель реки', icon: Waves, color: 'text-cyan-300', bg: 'from-cyan-400 to-blue-700', shadow: 'shadow-cyan-500/50' },
    ]
  },
  {
    id: 'winter',
    title: 'Зимние походы',
    unit: 'тур.',
    current: (stats: UserAchievements) => stats.winterTours || 0,
    tiers: [
      { min: 1, name: 'Пингвин', icon: Wind, color: 'text-sky-300', bg: 'from-sky-600 to-slate-800', shadow: 'shadow-sky-500/20' },
      { min: 3, name: 'Полярник', icon: Snowflake, color: 'text-sky-400', bg: 'from-sky-500 to-indigo-800', shadow: 'shadow-sky-500/40' },
      { min: 5, name: 'Снежный барс', icon: Mountain, color: 'text-blue-200', bg: 'from-blue-400 to-sky-700', shadow: 'shadow-blue-400/50' },
    ]
  },
  {
    id: 'pmr',
    title: 'По Приднестровью',
    unit: 'тур.',
    current: (stats: UserAchievements) => stats.pmrTours || 0,
    tiers: [
      { min: 3, name: 'Краевед', icon: Map, color: 'text-emerald-300', bg: 'from-emerald-600 to-teal-900', shadow: 'shadow-emerald-500/20' },
      { min: 5, name: 'Знаток края', icon: MapPin, color: 'text-emerald-400', bg: 'from-emerald-500 to-emerald-800', shadow: 'shadow-emerald-500/40' },
    ]
  },
  {
    id: 'distance',
    title: 'Километраж',
    unit: 'км',
    current: (stats: UserAchievements) => stats.totalKm || 0,
    tiers: [
      { min: 50, name: 'Прогульщик', icon: Footprints, color: 'text-amber-300', bg: 'from-amber-600 to-orange-900', shadow: 'shadow-amber-500/20' },
      { min: 100, name: 'Железные ноги', icon: Activity, color: 'text-amber-400', bg: 'from-amber-500 to-orange-800', shadow: 'shadow-amber-500/40' },
      { min: 150, name: 'Следопыт', icon: Mountain, color: 'text-yellow-200', bg: 'from-yellow-500 to-amber-700', shadow: 'shadow-yellow-500/50' },
    ]
  },
  {
    id: 'nights',
    title: 'Ночевки в палатке',
    unit: 'ноч.',
    current: (stats: UserAchievements) => stats.totalNights || 0,
    tiers: [
      { min: 5, name: 'Мастер костра', icon: Flame, color: 'text-orange-300', bg: 'from-orange-600 to-red-900', shadow: 'shadow-orange-500/20' },
      { min: 10, name: 'Дикарь', icon: Tent, color: 'text-orange-400', bg: 'from-orange-500 to-red-800', shadow: 'shadow-orange-500/40' },
    ]
  }
];

export default function AchievementsBox({ stats }: { stats: UserAchievements }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (selectedCategory) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedCategory]);

  // Просчет состояний для карточек
  const badges = CATEGORIES.map(category => {
    const currentVal = category.current(stats);
    
    // Находим индекс максимального достигнутого уровня
    const currentTierIndex = category.tiers.reduce((latestIndex, tier, index) => {
      if (currentVal >= tier.min) return index;
      return latestIndex;
    }, -1);

    const isUnlocked = currentTierIndex >= 0;
    const activeTier = isUnlocked ? category.tiers[currentTierIndex] : category.tiers[0];
    const nextTier = category.tiers[currentTierIndex + 1];

    // Высчитываем процент до следующей цели (или 100% если макс)
    let progressPercent = 100;
    if (!isUnlocked) {
      progressPercent = (currentVal / activeTier.min) * 100;
    } else if (nextTier) {
      // Прогресс внутри текущего уровня
      progressPercent = (currentVal / nextTier.min) * 100;
    }

    return {
      ...category,
      currentVal,
      isUnlocked,
      activeTier,
      nextTier,
      progressPercent: Math.min(Math.max(progressPercent, 0), 100) // Ограничиваем 0-100
    };
  });

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const activeModalData = badges.find(b => b.id === selectedCategory);

 // МОДАЛКА ЭВОЛЮЦИИ (Выкидываем в Portal)
  const modalContent = activeModalData && mounted ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedCategory(null)}>
      <div className="relative w-full max-w-sm flex flex-col bg-ui-panel border border-ui-border rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Шапка модалки */}
        <div className="flex items-center justify-between p-5 border-b border-ui-border bg-ui-panel/95">
          <div>
            <h2 className="text-lg font-black text-ui-text tracking-tight">{activeModalData.title}</h2>
            <p className="text-xs text-ui-muted mt-0.5">Ваш прогресс: {Math.floor(activeModalData.currentVal)} {activeModalData.unit}</p>
          </div>
          <button onClick={() => setSelectedCategory(null)} className="p-2 -mr-2 rounded-full hover:bg-ui-border/50 text-ui-muted hover:text-ui-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Дерево эволюции */}
        <div className="p-6 space-y-4">
          {activeModalData.tiers.map((tier, idx) => {
            const isTierUnlocked = activeModalData.currentVal >= tier.min;
            const TierIcon = tier.icon;
            
            return (
              <div key={idx} className={cn(
                "relative flex items-center gap-4 p-4 rounded-2xl border transition-all",
                isTierUnlocked ? "bg-ui-bg/60 border-ui-border" : "bg-ui-bg/40 border-ui-border/50 opacity-60 grayscale"
              )}>
                {/* Линия соединения (дерево) */}
                {idx !== activeModalData.tiers.length - 1 && (
                  <div className="absolute left-9 top-14 bottom-[-16px] w-px bg-ui-border z-0" />
                )}

                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg",
                  tier.bg, tier.color, isTierUnlocked ? tier.shadow : ""
                )}>
                  <TierIcon size={20} />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={cn("text-sm font-bold", isTierUnlocked ? "text-ui-text" : "text-ui-muted")}>{tier.name}</h4>
                    {isTierUnlocked ? (
                      <CheckCircle2 size={14} className="text-ui-accent" />
                    ) : (
                      <Lock size={12} className="text-ui-muted/50" />
                    )}
                  </div>
                  <p className="text-xs text-ui-muted">
                    Цель: {tier.min} {activeModalData.unit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  ) : null;

  return (
    <div className="bg-transparent md:bg-ui-panel/40 md:border md:border-ui-border md:rounded-3xl md:p-6 md:shadow-lg">
      
      {/* Шапка блока */}
      <div className="flex items-center justify-between mb-4 px-2 md:px-0">
        <div>
          <h3 className="text-ui-text font-bold tracking-wider flex items-center gap-2">
            Достижения
          </h3>
          <p className="text-sm text-ui-muted mt-0.5">Собрано {unlockedCount} из {CATEGORIES.length}</p>
        </div>
        <ChevronRight size={20} className="text-ui-muted/50 md:hidden" />
      </div>

      {/* Горизонтальный скролл на мобилке, сетка на десктопе */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 px-2 md:px-0 md:pb-0 md:grid md:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {badges.map((badge) => {
          const Icon = badge.activeTier.icon;
          
          return (
            <button 
              key={badge.id}
              onClick={() => setSelectedCategory(badge.id)}
              className={cn(
                "snap-start shrink-0 w-[120px] md:w-auto relative flex flex-col items-center p-4 rounded-[20px] border transition-all duration-300 group overflow-hidden focus:outline-none",
                badge.isUnlocked 
                  ? "bg-ui-panel/80 border-ui-border hover:border-ui-accent/50 hover:bg-ui-panel" 
                  : "bg-ui-panel/40 border-ui-border/50 opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
              )}
            >
              {/* Замочек для закрытых */}
              {!badge.isUnlocked && (
                <div className="absolute top-3 right-3 text-ui-muted/50">
                  <Lock size={12} />
                </div>
              )}
              
              {/* Градиентный "Щит" с иконкой */}
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500 bg-gradient-to-br",
                badge.activeTier.bg,
                badge.isUnlocked ? badge.activeTier.shadow : "shadow-none"
              )}>
                <Icon size={26} strokeWidth={1.5} className={badge.activeTier.color} />
              </div>
              
              {/* Название */}
              <h4 className={cn("text-xs font-bold text-center mb-1 w-full truncate", badge.isUnlocked ? "text-ui-text" : "text-ui-muted")}>
                {badge.activeTier.name}
              </h4>
              
              {/* Тонкая линия прогресса в самом низу карточки */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-ui-bg/50">
                <div 
                  className={cn("h-full transition-all duration-1000", badge.isUnlocked ? "bg-ui-accent" : "bg-ui-border")}
                  style={{ width: `${badge.progressPercent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Рендер модалки */}
      {mounted && createPortal(modalContent, document.body)}

    </div>
  );
}