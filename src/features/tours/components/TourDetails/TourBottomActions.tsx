"use client";

import React, { useEffect, useState } from 'react';
import { Tour } from '@/features/tours/types';
import { clsx } from 'clsx';
import { X, Crown, Baby, Users, Ticket, ChevronUp } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';

interface TourBottomActionsProps {
  tour: Tour;
}

export default function TourBottomActions({ tour }: TourBottomActionsProps) {
  const [isVisible, setIsVisible]   = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const openBookingModal = useModalStore((state) => state.openBookingModal);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрываем при скролле вверх (пользователь ушёл от тура)
  useEffect(() => {
    if (!isVisible) setIsExpanded(false);
  }, [isVisible]);

  if (!tour) return null;

  const prices = [
    { label: 'Взрослый', value: tour.price,        icon: <Ticket size={14} className="text-slate-300" /> },
    { label: 'Клубная карта', value: tour.priceMember,  icon: <Crown  size={14} className="text-amber-400" /> },
    { label: 'Детский (до 13)', value: tour.priceChild,   icon: <Baby   size={14} className="text-pink-400" /> },
    { label: 'Семья (2+1)', value: tour.priceFamily,  icon: <Users  size={14} className="text-blue-400" /> },
  ].filter((p) => typeof p.value === 'number' && (p.value as number) > 0);

  const minPrice     = Math.min(...prices.map(p => p.value as number));
  const isSoldOut    = (tour.spotsLeft || 0) <= 0;
  const left         = Number(tour.spotsLeft || 0);
  const isLowSpots   = left > 0 && left <= 5;

  const hasDiscount     = Number(tour.priceOld || 0) > Number(tour.price || 0);
  const discountPercent = hasDiscount
    ? Math.round(((Number(tour.priceOld) - Number(tour.price)) / Number(tour.priceOld)) * 100)
    : 0;

  return (
    <>
      {/* Затемнение фона при расширении */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={clsx(
          "fixed bottom-0 left-0 right-0 z-[60] lg:hidden transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        aria-label="Панель бронирования тура"
      >
        {/* ПАНЕЛЬ */}
        <div className={clsx(
          "bg-slate-900/98 backdrop-blur-xl border-t border-white/10 transition-all duration-400 ease-in-out",
          "rounded-t-3xl shadow-2xl shadow-black/60",
        )}>

          {/* ── ХЭНДЛ + КНОПКА ЗАКРЫТИЯ ── */}
          <div
            className="flex items-center justify-center pt-3 pb-1 cursor-pointer relative"
            onClick={() => setIsExpanded(!isExpanded)}
            role="button"
            aria-label={isExpanded ? 'Свернуть панель' : 'Развернуть детали тура'}
            aria-expanded={isExpanded}
          >
            {/* Полоска-хэндл — универсальный bottom sheet паттерн */}
            <div className="w-10 h-1 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />

            {/* Крестик закрытия — только в расширенном состоянии */}
            {isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                aria-label="Закрыть панель"
                className="absolute right-4 top-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={14} className="text-slate-300" />
              </button>
            )}
          </div>

          {/* ── РАСШИРЕННЫЙ КОНТЕНТ ── */}
          <div className={clsx(
            "overflow-hidden transition-all duration-400 ease-in-out",
            isExpanded ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="px-5 pt-2 pb-4 space-y-4 overflow-y-auto max-h-[55vh]">

              {/* Цена с скидкой */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-1">Стоимость участия</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">{Number(tour.price).toLocaleString('ru-RU')}</span>
                    <span className="text-sm font-bold text-teal-500">{tour.currency || 'RUB'}</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-300 line-through text-xs">{Number(tour.priceOld).toLocaleString()}</span>
                      <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
                        −{discountPercent}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Свободных мест */}
                <div className="text-right">
                  <p className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-1">Мест</p>
                  <span className={clsx(
                    "text-2xl font-black",
                    isSoldOut ? "text-rose-500" : isLowSpots ? "text-amber-400" : "text-teal-400"
                  )}>
                    {isSoldOut ? "0" : left}
                  </span>
                  {isLowSpots && !isSoldOut && (
                    <p className="text-xs font-bold text-amber-400 uppercase">Мало!</p>
                  )}
                </div>
              </div>

              {/* Разделитель */}
              <div className="border-t border-white/5" />

              {/* Все тарифы */}
              {prices.length > 1 && (
                <div className="space-y-2.5">
                  <p className="text-xs uppercase font-bold text-slate-300 tracking-wider">Тарифы</p>
                  {prices.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        {p.icon}
                        <span>{p.label}</span>
                      </div>
                      <span className="font-bold text-white text-sm">
                        {(p.value as number).toLocaleString()} {tour.currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── COLLAPSED BAR (всегда виден) ── */}
          <div className="px-4 pb-6 pt-3 flex items-center gap-3">

            {/* Цена + стрелка-триггер */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 flex items-center gap-2 min-w-0 group"
              aria-label={isExpanded ? 'Свернуть детали' : 'Показать детали'}
            >
              <div className="min-w-0">
                <p className="text-xs text-slate-300 uppercase font-bold tracking-wider mb-0.5">Стоимость</p>
                <div className="flex items-baseline gap-1">
                  {prices.length > 1 && <span className="text-xs text-slate-300 font-medium">от</span>}
                  <span className="text-xl font-black text-white">{minPrice.toLocaleString()}</span>
                  <span className="text-xs font-bold text-teal-500">{tour.currency || 'RUB'}</span>
                </div>
              </div>

              {/* Стрелка — визуальный индикатор расширения */}
              <div className={clsx(
                "w-7 h-7 rounded-full border border-white/15 flex items-center justify-center shrink-0 transition-all duration-300",
                isExpanded
                  ? "bg-white/15 rotate-180 border-white/30"
                  : "bg-white/5 group-hover:bg-white/10"
              )}>
                <ChevronUp size={14} className="text-slate-300" />
              </div>
            </button>

            {/* Кнопка записи */}
            <button
              onClick={() => { setIsExpanded(false); openBookingModal(tour); }}
              disabled={isSoldOut}
              aria-label={isSoldOut ? 'Мест нет' : `Записаться в тур ${tour.title}`}
              className={clsx(
                "shrink-0 px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95 whitespace-nowrap",
                isSoldOut
                  ? "bg-slate-800 text-slate-300 cursor-not-allowed"
                  : "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-lg shadow-teal-500/25"
              )}
            >
              {isSoldOut ? 'Мест нет' : 'Записаться'}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}