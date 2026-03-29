"use client";

import React, { useState, useRef, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Crown, Mountain, Flame, Map, Compass, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import LevelsInfoModal from '@/components/modals/LevelsInfoModal'; // ✅ Подключаем новую модалку
import MemberQrCode from '@/features/account/components/MemberQrCode';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface VirtualCardProps {
  name: string | null;
  level: string;
  totalTours: number;
  totalKm: number;
  memberId: string | null;
  bookingShortId?: number | null;  // Booking.shortId — короткий номер
  tourTitle?: string | null;       // Booking.tour.title
  tourStartDate?: Date | null;     // Booking.tourDate.startDate
}

// 1. Внедрение четкой системы уровней и Визуальный апгрейд
const LEVELS_CONFIG = [
  // ✅ ИСПРАВЛЕНО: Первый уровень теперь премиальный темно-изумрудный, а не блекло-серый
  { name: 'Первопроходец', min: 0, max: 2, color: 'text-emerald-400', bg: 'from-emerald-700 to-teal-900', border: 'border-emerald-500/30', icon: Map },
  { name: 'Походник', min: 3, max: 6, color: 'text-emerald-400', bg: 'from-emerald-600 to-teal-900', border: 'border-emerald-500/30', icon: Compass },
  { name: 'Бывалый', min: 7, max: 14, color: 'text-blue-400', bg: 'from-blue-600 to-indigo-900', border: 'border-blue-500/30', icon: Mountain },
  { name: 'Ветеран', min: 15, max: 29, color: 'text-purple-400', bg: 'from-purple-600 to-fuchsia-900', border: 'border-purple-500/30', icon: Flame },
  { name: 'Легенда клуба', min: 30, max: 9999, color: 'text-amber-400', bg: 'from-amber-500 to-orange-900', border: 'border-amber-500/50', icon: Crown },
];

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

  const safeTours = totalTours || 0;
  const safeKm = totalKm || 0;
  const displayId = memberId ? memberId.split('-')[0].toUpperCase() : 'ID_PENDING';

  // Находим текущий уровень и следующий
  const currentLevelIndex = LEVELS_CONFIG.findIndex(l => safeTours >= l.min && safeTours <= l.max) !== -1
    ? LEVELS_CONFIG.findIndex(l => safeTours >= l.min && safeTours <= l.max)
    : 0;

  const currentConfig = LEVELS_CONFIG[currentLevelIndex];
  const nextConfig = LEVELS_CONFIG[currentLevelIndex + 1];
  const Icon = currentConfig.icon;

  // Логика прогресса
  const toursNeeded = nextConfig ? nextConfig.min - safeTours : 0;
  const progressPercent = nextConfig
    ? ((safeTours - currentConfig.min) / (nextConfig.min - currentConfig.min)) * 100
    : 100;

  // 3D эффект при наведении мыши (только для десктопа)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return; // Отключаем 3D-наклон, если карта перевернута
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

      {/* Обертка для 3D-наклона мышью */}
      <div
        ref={cardRef}
        className="relative w-full aspect-[1.6/1] transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: isFlipped ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' : transformStyle
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Интерактивность: framer-motion для переворота */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full h-full relative preserve-3d cursor-pointer shadow-2xl rounded-2xl"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* ─── ЛИЦЕВАЯ СТОРОНА ────────────────────────────────────────── */}
          <div className={cn(
            "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between overflow-hidden backface-hidden border",
            "bg-gradient-to-br", currentConfig.bg, currentConfig.border
          )}>
            {/* Декоративный паттерн */}
            <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em]">Турклуб</span>
                <span className="text-white text-xl font-black tracking-tighter leading-none">ЭВА</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
                  <Icon size={14} className={currentConfig.color} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", currentConfig.color)}>
                    {currentConfig.name}
                  </span>
                </div>

                {/* ✅ Кнопка Info: отключена, так как переворот работает по клику, но оставлена в коде */}
                {/*
                <button
                  onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                  className="w-7 h-7 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/10 transition-colors text-white/80 hover:text-white"
                >
                  <Info size={14} />
                </button>
                */}
              </div>
            </div>

            <div className="relative z-10 flex justify-between items-end gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Участник</span>
                {/* ✅ ИСПРАВЛЕНО: Имя переносится на две строки (text-balance) и не обрезается (truncate убран) */}
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

          {/* ─── ОБОРОТНАЯ СТОРОНА (ПРОПУСК И QR) ─────────────────────────── */}
          <div className={cn(
            "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden backface-hidden border rotate-y-180",
            "bg-slate-900 border-slate-700"
          )}>
            {/* Магнитная полоса (декор) */}
            <div className="absolute inset-x-0 top-6 h-10 bg-black/40" />

            <button
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white z-20"
            >
              <X size={16} />
            </button>

<div className="relative z-10 bg-white p-2.5 rounded-xl mt-8 mb-4 shadow-lg">
          {bookingShortId ? (
            <MemberQrCode
              bookingShortId={bookingShortId}
              tourTitle={tourTitle ?? ''}
              tourStartDate={tourStartDate ?? null}
              size={140}
            />
          ) : (
            // Нет активных броней — показываем иконку-заглушку lucide-react
            <QrCode size={140} className="text-slate-950" />
          )}
        </div>

            <p className="text-slate-400 text-xs uppercase tracking-[0.2em] font-mono text-center font-bold">
              ID: {displayId}
            </p>
           </div>
        </motion.div>
      </div>

      {/* ─── Шкала прогресса и Кнопка Модалки ────────────────────────────── */}
      <div className="mt-8 px-2 flex flex-col gap-4">
        {nextConfig ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Прогресс статуса</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Еще {toursNeeded} {toursNeeded === 1 ? 'тур' : toursNeeded > 1 && toursNeeded < 5 ? 'тура' : 'туров'} до «{nextConfig.name}»
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className={cn("h-full transition-all duration-1000 ease-out bg-gradient-to-r", currentConfig.bg)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-500/10 py-3.5 rounded-xl border border-amber-500/20 shadow-inner">
            <Crown size={16} /> Максимальный уровень
          </div>
        )}

        {/* ✅ НОВОЕ: Встроенная модалка с информацией об уровнях (прямо под прогресс-баром) */}
        <LevelsInfoModal />
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