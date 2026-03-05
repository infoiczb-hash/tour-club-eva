"use client";

import React, { useEffect, useState } from 'react';
import { Tour } from '@/features/tours/types';
import { clsx } from 'clsx';
import { Info, X } from 'lucide-react';
// ✅ ИСПРАВЛЕНО: Подключили Zustand для вызова модалки бронирования
import { useModalStore } from '@/shared/store/useModalStore';

interface TourBottomActionsProps {
  tour: Tour;
  // Удалили onBook из пропсов
}

export default function TourBottomActions({ tour }: TourBottomActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showHint, setShowHint] = useState(false); // Состояние для тултипа с тарифами
  
  // ✅ ИСПРАВЛЕНО: Достаем функцию из стора
  const openBookingModal = useModalStore((state) => state.openBookingModal);

  // Логика появления бара при скролле вниз
  useEffect(() => {
    const handleScroll = () => {
      // Показываем бар, когда проскроллили 80% первого экрана
      setIsVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!tour) return null;

  // Собираем все непустые тарифы для тултипа
  const prices = [
    { label: 'Взрослый', value: tour.price },
    { label: 'Клубная', value: tour.priceMember },
    { label: 'Детский', value: tour.priceChild },
    { label: 'Семейный', value: tour.priceFamily }
  ].filter((p) => typeof p.value === 'number' && p.value > 0);

  // Находим минимальную цену для отображения в баре ("от ... RUB")
  const minPrice = Math.min(...prices.map(p => p.value as number));
  const hasMultiplePrices = prices.length > 1;
  
  // Проверка мест
  const isSoldOut = (tour.spotsLeft || 0) <= 0;

  return (
    <>
      {/* Оверлей для закрытия тултипа кликом в любую область */}
      {showHint && (
        <div 
          className="fixed inset-0 z-[55]" 
          onClick={() => setShowHint(false)} 
        />
      )}

      {/* Сам мобильный бар */}
      <div 
        className={clsx(
          "fixed bottom-0 left-0 right-0 z-[60] p-4 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 transition-transform duration-300 lg:hidden pb-6 md:pb-6 safe-area-padding",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        
        {/* Тултип со списком всех тарифов */}
        <div className={clsx(
             "absolute bottom-full left-4 mb-3 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all origin-bottom-left",
             showHint ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
        )}>
            {/* Шапка тултипа */}
            <div className="bg-slate-950/50 p-3 border-b border-white/5 flex justify-between items-center">
                <span className="text-[12px] font-bold uppercase text-slate-400 tracking-wider">Все тарифы</span>
                <button onClick={() => setShowHint(false)}>
                  <X size={14} className="text-slate-500 hover:text-white transition-colors" />
                </button>
            </div>
            
            {/* Список цен */}
            <div className="p-3 space-y-2">
                {prices.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-300">{p.label}</span>
                        <span className="font-bold text-white">{(p.value as number).toLocaleString()} {tour.currency}</span>
                    </div>
                ))}
            </div>
            
            {/* Стрелочка тултипа вниз */}
            <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
        </div>

        {/* Основной контент бара */}
        <div className="flex items-center gap-4">
          
          {/* Левая часть: Цена */}
          <div className="flex-grow">
            <p className="text-[12px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Стоимость участия</p>
            <div className="flex items-center gap-2">
                <div className="flex items-baseline gap-1">
                    {hasMultiplePrices && <span className="text-sm text-slate-400 font-medium">от</span>}
                    <span className="text-2xl font-black text-white">{minPrice.toLocaleString()}</span>
                    <span className="text-xs font-bold text-teal-500">{tour.currency || 'RUB'}</span>
                </div>
                
                {/* Иконка Info для вызова тултипа */}
                {hasMultiplePrices && (
                    <button 
                      onClick={() => setShowHint(!showHint)} 
                      className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center border transition-colors", 
                        showHint 
                          ? "bg-teal-500 text-slate-900 border-teal-500" 
                          : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Info size={14} />
                    </button>
                )}
            </div>
          </div>
          
          {/* Правая часть: Кнопка Бронирования */}
          <button
            onClick={() => openBookingModal(tour)} // ✅ ИСПРАВЛЕНО: Вызов Zustand
            disabled={isSoldOut}
            className={clsx(
              "px-6 py-3 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg active:scale-95 transition-all whitespace-nowrap", 
              isSoldOut 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-teal-500 text-slate-900 shadow-teal-500/20"
            )}
          >
            {isSoldOut ? 'Мест нет' : 'Записаться'}
          </button>
          
        </div>
      </div>
    </>
  );
}