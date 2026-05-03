"use client";

import React, { useState, useRef, MouseEvent } from 'react';
import { QrCode as QrCodeIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LEVELS_CONFIG, getLevelConfig } from '@/lib/constants/levels';
import dynamic from 'next/dynamic';

const LevelsInfoModal = dynamic(() => import('@/components/modals/LevelsInfoModal'), { ssr: false });
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface VirtualCardProps {
  name: string | null;
  level: string;
  totalTours: number;
  totalKm: number;
  memberId: string | null;
  bookingShortId?: string | null;
  tourTitle?: string | null;       
  tourStartDate?: Date | null;     
}

export default function VirtualCard({
  name,
  level,
  totalTours,
  totalKm,
  bookingShortId,
  tourTitle,
  tourStartDate,
  memberId,
}: VirtualCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');
  
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null); // ✅ Кэш для размеров карточки, чтобы избежать Forced Reflow

  const safeTours = totalTours || 0;
  const safeKm = totalKm || 0;
  const displayId = memberId ? memberId.split('-')[0].toUpperCase() : 'ID_PENDING';

  // ✅ БЕРЕМ УРОВНИ ИЗ ЕДИНОГО ИСТОЧНИКА ПРАВДЫ
  const currentConfig = getLevelConfig(safeTours);
  const currentLevelIndex = LEVELS_CONFIG.indexOf(currentConfig);
  const nextConfig = LEVELS_CONFIG[currentLevelIndex + 1];
  const Icon = currentConfig.icon;

  const toursNeeded = nextConfig ? nextConfig.min - safeTours : 0;
  const progressPercent = nextConfig
    ? ((safeTours - currentConfig.min) / (nextConfig.min - currentConfig.min)) * 100
    : 100;

  const handleMouseEnter = () => {
    // ✅ Читаем геометрию ОДИН раз при наведении, избавляемся от синхронного перерасчета макета
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!rectRef.current || isFlipped) return; 
    
    const rect = rectRef.current; // Берем размеры из кэша
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    rectRef.current = null; // Очищаем кэш
    setTransformStyle(`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
  };

  return (
    <div className="w-full max-w-md mx-auto relative perspective-1000">
      <div
        ref={cardRef}
        className="relative w-full aspect-[1.6/1] transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: isFlipped ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' : transformStyle
        }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ✅ Использован чистый CSS + cubic-bezier для эффекта пружинки вместо framer-motion */}
        <div
          className="w-full h-full relative preserve-3d cursor-pointer shadow-2xl rounded-2xl transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* ЛИЦЕВАЯ СТОРОНА */}
          <div className={cn(
            "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between overflow-hidden backface-hidden border",
            "bg-gradient-to-br", currentConfig.bg, currentConfig.border
          )}>
            <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-white/80 text-xs font-bold uppercase tracking-[0.3em]">Турклуб</span>
                <span className="text-white text-xl font-black tracking-tighter leading-none">ЭВА</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
                  <Icon size={14} className={currentConfig.color} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", currentConfig.color)}>
                    {currentConfig.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex justify-between items-end gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-white/50 text-xs uppercase font-bold tracking-widest">Участник</span>
                <span className="text-white text-lg md:text-xl font-black uppercase tracking-widest drop-shadow-md line-clamp-2 text-balance break-words leading-tight">
                  {name || 'ТУРИСТ'}
                </span>
              </div>
              <div className="text-right flex flex-col gap-1 shrink-0">
                <span className="text-white/90 text-sm font-bold">{safeTours} ТУРОВ</span>
                <span className="text-white/60 text-xs font-medium">{Math.floor(safeKm)} КМ</span>
              </div>
            </div>
          </div>

          {/* ОБОРОТНАЯ СТОРОНА */}
          <div className={cn(
            "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden backface-hidden border rotate-y-180",
            "bg-ui-panel border-ui-border"
          )}>
            <div className="absolute inset-x-0 top-6 h-10 bg-black/40" />

            <button
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              className="absolute top-4 right-4 p-1.5 bg-ui-border/50 hover:bg-ui-border rounded-full transition-colors text-ui-muted hover:text-ui-text z-20"
            >
              <X size={16} />
            </button>
            <div className="relative z-10 bg-white p-2.5 rounded-xl mt-8 mb-4 shadow-lg">
              {/* Только QR участника клуба, больше никаких проверок! */}
              <QRCode 
                value={`https://evatur.club/admin/scan?m=${memberId}`}
                size={150} 
                level="M" 
              />
            </div>

            <p className="text-ui-muted text-xs uppercase tracking-[0.2em] font-mono text-center font-bold">
              ID: {displayId}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 px-2 flex flex-col gap-4">
        {nextConfig ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-ui-muted uppercase tracking-widest">Прогресс статуса</span>
              <span className="text-xs text-ui-muted font-bold uppercase tracking-widest">
                Еще {toursNeeded} {toursNeeded === 1 ? 'тур' : toursNeeded > 1 && toursNeeded < 5 ? 'тура' : 'туров'} до «{nextConfig.name}»
              </span>
            </div>
            <div className="h-2 w-full bg-ui-panel rounded-full overflow-hidden border border-ui-border">
              <div
                className={cn("h-full transition-all duration-1000 ease-out bg-gradient-to-r", currentConfig.bg)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-500/10 py-3.5 rounded-xl border border-amber-500/20 shadow-inner">
            <Icon size={16} /> Максимальный уровень
          </div>
        )}

        <LevelsInfoModal />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}