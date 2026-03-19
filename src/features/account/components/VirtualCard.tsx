"use client";

import React, { useState, useRef, MouseEvent } from 'react';
import { QrCode, Crown, Mountain, Shield, Star, Compass, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface VirtualCardProps {
  name: string;
  level: string;
  totalTours: number;
  totalKm: number;
  memberId: string;
}

const LEVELS_CONFIG = [
  { name: 'Первопроходец', min: 0, max: 2, color: 'slate', bg: 'from-slate-600 to-slate-900', border: 'border-slate-500/30', text: 'text-slate-300', icon: Compass },
  { name: 'Походник', min: 3, max: 5, color: 'emerald', bg: 'from-emerald-600 to-teal-900', border: 'border-emerald-500/40', text: 'text-emerald-300', icon: Mountain },
  { name: 'Бывалый', min: 6, max: 10, color: 'blue', bg: 'from-blue-600 to-indigo-900', border: 'border-blue-500/40', text: 'text-blue-300', icon: Shield },
  { name: 'Ветеран', min: 11, max: 19, color: 'purple', bg: 'from-purple-600 to-fuchsia-900', border: 'border-purple-500/40', text: 'text-purple-300', icon: Star },
  { name: 'Легенда клуба', min: 20, max: 9999, color: 'amber', bg: 'from-amber-500 to-orange-900', border: 'border-amber-500/50', text: 'text-amber-300', icon: Crown },
];

export default function VirtualCard({ name, level, totalTours, totalKm, memberId }: VirtualCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Находим текущий уровень и следующий
  const currentLevelIndex = LEVELS_CONFIG.findIndex(l => totalTours >= l.min && totalTours <= l.max) !== -1 
    ? LEVELS_CONFIG.findIndex(l => totalTours >= l.min && totalTours <= l.max) 
    : 0;
  
  const currentConfig = LEVELS_CONFIG[currentLevelIndex];
  const nextConfig = LEVELS_CONFIG[currentLevelIndex + 1];
  const Icon = currentConfig.icon;

  // Логика прогресса
  const toursNeeded = nextConfig ? nextConfig.min - totalTours : 0;
  const progressPercent = nextConfig 
    ? ((totalTours - currentConfig.min) / (nextConfig.min - currentConfig.min)) * 100 
    : 100;

  // 3D эффект при наведении мыши (только для десктопа)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle(`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
  };

  return (
    <div className="w-full max-w-md mx-auto relative perspective-1000">
      {/* Сама карта */}
      <div 
        ref={cardRef}
        className="relative w-full aspect-[1.6/1] cursor-pointer transition-all duration-300 ease-out preserve-3d"
        style={{ 
          transform: isFlipped ? 'perspective(1000px) rotateY(180deg)' : transformStyle,
          transformStyle: 'preserve-3d'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* ЛИЦЕВАЯ СТОРОНА */}
        <div className={clsx(
          "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between overflow-hidden backface-hidden shadow-2xl border",
          "bg-gradient-to-br", currentConfig.bg, currentConfig.border
        )}>
          {/* Декоративный шум и блик */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-[50px] rounded-full" />
          
          {/* Шапка карты */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em]">Турклуб</span>
              <span className="text-white text-xl font-black tracking-tighter leading-none">ЭВА</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
              <Icon size={14} className={currentConfig.text} />
              <span className={clsx("text-xs font-black uppercase tracking-widest", currentConfig.text)}>
                {currentConfig.name}
              </span>
            </div>
          </div>

          {/* Низ карты */}
          <div className="relative z-10 flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Участник</span>
              <span className="text-white text-lg md:text-xl font-black uppercase tracking-widest drop-shadow-md">
                {name || 'ТУРИСТ'}
              </span>
            </div>
            <div className="text-right flex flex-col gap-1">
              <span className="text-white/90 text-sm font-bold">{totalTours} ТУРОВ</span>
              <span className="text-white/60 text-xs font-medium">{Math.floor(totalKm)} КМ</span>
            </div>
          </div>
        </div>

        {/* ОБОРОТНАЯ СТОРОНА */}
        <div className={clsx(
          "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden backface-hidden shadow-2xl border rotate-y-180",
          "bg-slate-900 border-slate-700"
        )}>
          <div className="absolute inset-x-0 top-6 h-10 bg-black/40" />
          <div className="relative z-10 bg-white p-2 rounded-lg mt-8 mb-4">
            <QrCode size={80} className="text-slate-900" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-mono text-center">
            ID: {memberId.split('-')[0].toUpperCase()}
          </p>
          <p className="text-slate-500 text-[9px] mt-2 text-center max-w-[80%]">
            Покажите этот код гиду на старте маршрута
          </p>
        </div>
      </div>

      {/* Блок прогресса (Вне карточки) */}
      <div className="mt-6 px-2">
        {nextConfig ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Прогресс статуса</span>
              <span className="text-[10px] text-slate-500 font-medium">
                Еще {toursNeeded} {toursNeeded === 1 ? 'тур' : toursNeeded > 1 && toursNeeded < 5 ? 'тура' : 'туров'} до «{nextConfig.name}»
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-1000 ease-out bg-gradient-to-r", currentConfig.bg)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-500/10 py-3 rounded-xl border border-amber-500/20">
            <Crown size={16} /> Максимальный уровень
          </div>
        )}
      </div>

      {/* Глобальные стили для поддержки 3D во всех браузерах */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}