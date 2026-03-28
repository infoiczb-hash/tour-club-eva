'use client';

import React from 'react';
import { 
  Waves, Anchor, Sailboat, 
  Snowflake, Wind, Mountain, 
  Map, MapPin, 
  Footprints, Activity, 
  Flame, Tent, Lock 
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
  totalNights: number; // ✅ ДОБАВИЛИ НОВУЮ МЕТРИКУ
}

export default function AchievementsBox({ stats }: { stats: UserAchievements }) {
  
  // Конфигурация эволюции бейджей
  const CATEGORIES = [
    {
      id: 'water',
      current: stats.waterTours || 0,
      tiers: [
        { min: 1, name: 'Матрос', icon: Sailboat, color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/30' },
        { min: 3, name: 'Капитан Днестра', icon: Anchor, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
        { min: 5, name: 'Хранитель реки', icon: Waves, color: 'text-blue-500', bg: 'bg-blue-600/10 border-blue-600/30 shadow-[0_0_15px_rgba(37,99,235,0.3)]' },
      ]
    },
    {
      id: 'winter',
      current: stats.winterTours || 0,
      tiers: [
        { min: 1, name: 'Пингвин', icon: Wind, color: 'text-sky-300', bg: 'bg-sky-400/10 border-sky-400/30' },
        { min: 3, name: 'Полярник', icon: Snowflake, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
        { min: 5, name: 'Снежный барс', icon: Mountain, color: 'text-sky-500', bg: 'bg-sky-600/10 border-sky-600/30 shadow-[0_0_15px_rgba(2,132,199,0.3)]' },
      ]
    },
    {
      id: 'pmr',
      current: stats.pmrTours || 0,
      tiers: [
        // Здесь нет уровня 1, начинаем сразу с порога 3
        { min: 3, name: 'Краевед', icon: Map, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
        { min: 5, name: 'Знаток Приднестровья', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-600/10 border-emerald-600/30 shadow-[0_0_15px_rgba(5,150,105,0.3)]' },
      ]
    },
    {
      id: 'distance',
      current: stats.totalKm || 0,
      tiers: [
        // Сдвинутые уровни выносливости
        { min: 50, name: 'Любитель прогулок', icon: Footprints, color: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/30' },
        { min: 100, name: 'Железные ноги', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
        { min: 150, name: 'Неутомимый следопыт', icon: Mountain, color: 'text-amber-500', bg: 'bg-amber-600/10 border-amber-600/30 shadow-[0_0_15px_rgba(217,119,6,0.3)]' },
      ]
    },
    {
      id: 'nights',
      current: stats.totalNights || 0,
      tiers: [
        // Сдвинутые уровни ночевок
        { min: 5, name: 'Мастер костра', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
        { min: 10, name: 'Дикарь', icon: Tent, color: 'text-orange-500', bg: 'bg-orange-600/10 border-orange-600/30 shadow-[0_0_15px_rgba(234,88,12,0.3)]' },
      ]
    }
  ];

  // Умный просчет состояний
  const badges = CATEGORIES.map(category => {
    // Находим максимальный достигнутый уровень
    const currentTierIndex = category.tiers.reduce((latestIndex, tier, index) => {
      if (category.current >= tier.min) return index;
      return latestIndex;
    }, -1);

    const isUnlocked = currentTierIndex >= 0;
    
    // Если бейдж заблокирован — показываем цель первого уровня. Иначе — текущий уровень.
    const activeTier = isUnlocked ? category.tiers[currentTierIndex] : category.tiers[0];
    const nextTier = category.tiers[currentTierIndex + 1];

    let progress = '';
    if (!isUnlocked) {
      progress = `${Math.floor(category.current)}/${activeTier.min}`;
    } else if (nextTier) {
      progress = `${Math.floor(category.current)}/${nextTier.min}`;
    } else {
      progress = 'MAX';
    }

    return {
      id: category.id,
      isUnlocked,
      name: activeTier.name,
      icon: activeTier.icon,
      color: activeTier.color,
      bg: activeTier.bg,
      progress,
      desc: !isUnlocked 
        ? `Цель: ${activeTier.min}` 
        : nextTier 
          ? `Следующий: ${nextTier.name}` 
          : 'Максимальный уровень!'
    };
  });

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-slate-300 font-bold uppercase tracking-wider">Мои награды</h3>
          <p className="text-xs text-slate-500 mt-1">Открыто {unlockedCount} из {CATEGORIES.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div 
              key={badge.id}
              className={cn(
                "relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300",
                badge.isUnlocked 
                  ? badge.bg 
                  : "bg-slate-900/60 border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
              )}
            >
              {!badge.isUnlocked && (
                <div className="absolute top-3 right-3 text-slate-600">
                  <Lock size={12} />
                </div>
              )}
              
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", badge.isUnlocked ? badge.color : "text-slate-500 bg-slate-800/50")}>
                <Icon size={24} strokeWidth={1.5} />
              </div>
              
              <h4 className={cn("text-sm font-bold text-center mb-1 leading-tight", badge.isUnlocked ? "text-white" : "text-slate-400")}>
                {badge.name}
              </h4>
              
              <p className="text-[10px] text-center text-slate-500 mb-2 leading-relaxed">
                {badge.desc}
              </p>
              
              <div className="w-full mt-auto pt-2 border-t border-white/5 text-center">
                <span className={cn(
                  "text-[10px] font-bold tracking-widest px-2 py-1 rounded-md",
                  badge.isUnlocked && badge.progress === 'MAX' ? "text-amber-400 bg-amber-400/10" : "text-slate-500 bg-slate-950"
                )}>
                  {badge.progress}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}