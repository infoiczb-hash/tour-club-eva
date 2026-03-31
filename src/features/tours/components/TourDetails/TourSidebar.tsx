"use client";

import React from 'react';
import { Tour } from '@/features/tours/types';
import { Users, ShieldCheck, Crown, Baby, Ticket, Check } from 'lucide-react';
import { clsx } from 'clsx';
// ✅ ИСПРАВЛЕНО: Подключили Zustand для вызова модалки бронирования
import { useModalStore } from '@/shared/store/useModalStore';

interface TourSidebarProps {
  tour: Tour;
  // Удалили onBook, так как теперь компонент сам открывает модалку
}

export default function TourSidebar({ tour }: TourSidebarProps) {
  // ✅ ИСПРАВЛЕНО: Достаем функцию открытия модалки из глобального стора
  const openBookingModal = useModalStore((state) => state.openBookingModal);

  const { price, currency = 'RUB', priceOld, priceMember, priceChild, priceFamily, spotsLeft } = tour;
  
  const currentPrice = Number(price || 0);
  const oldPriceVal = Number(priceOld || 0);
  const left = Number(spotsLeft || 0);

  const hasDiscount = oldPriceVal > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((oldPriceVal - currentPrice) / oldPriceVal) * 100) : 0;

  const isSoldOut = left <= 0;
  const isLowSpots = left > 0 && left <= 5;

  return (
    <aside className="hidden lg:block relative z-30">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50 overflow-hidden relative">
        
        {/* БЛОК 1: Цена и Места */}
        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
          <div>
            <p className="text-slate-400 text-[14px] font-bold uppercase tracking-wider mb-1">Стоимость участия</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl xl:text-4xl font-black text-white tracking-tight">
                {currentPrice.toLocaleString('ru-RU')}
              </span>
              <span className="text-sm font-bold text-teal-500">{currency}</span>
            </div>
            
            {hasDiscount && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-400 line-through text-xs font-medium decoration-rose-500/50">
                  {oldPriceVal.toLocaleString('ru-RU')}
                </span>
                <span className="bg-rose-500/10 text-rose-500 text-[14px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20">
                  Выгода {discountPercent}%
                </span>
              </div>
            )}
          </div>
          
          <div className="text-right">
              <p className="text-slate-400 text-[14px] font-bold uppercase tracking-wider mb-1">Свободных мест</p>
              <div className={clsx("text-2xl font-black tabular-nums", isSoldOut ? "text-rose-500" : (isLowSpots ? "text-amber-500" : "text-teal-400"))}>
                {isSoldOut ? "0" : left}
              </div>
              {isLowSpots && !isSoldOut && (
                <span className="text-[12px] font-bold text-amber-500 uppercase ">Заканчиваются!</span>
              )}
          </div>
        </div>

        {/* БЛОК 2: Доступные тарифы (если они есть) */}
        {((priceMember || 0) > 0 || (priceChild || 0) > 0 || (priceFamily || 0) > 0) && (
          <div className="space-y-3 mb-6">
            <p className="text-slate-400 text-[14px] font-bold uppercase mb-2">Доступные тарифы</p>
            
            <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2 text-slate-300">
                 <Ticket size={14} className="text-slate-400"/>
                 <span>Взрослый</span>
               </div>
               <span className="font-bold text-white">{currentPrice.toLocaleString()} {currency}</span>
            </div>
            
            {(priceMember ?? 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-amber-400">
                  <Crown size={14} />
                  <span className="font-bold">Клубная карта</span>
                </div>
                <span className="font-bold text-amber-400">{priceMember?.toLocaleString()} {currency}</span>
              </div>
            )}
            
            {(priceChild ?? 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-pink-400">
                  <Baby size={14} />
                  <span>Детский (до 13)</span>
                </div>
                <span className="font-bold text-white">{priceChild?.toLocaleString()} {currency}</span>
              </div>
            )}
            
            {(priceFamily ?? 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-blue-400">
                  <Users size={14} />
                  <span>Семья (2+1)</span>
                </div>
                <span className="font-bold text-white">{priceFamily?.toLocaleString()} {currency}</span>
              </div>
            )}
          </div>
        )}

        {/* БЛОК 3: Кнопка Бронирования */}
        <button 
          onClick={() => openBookingModal(tour)} // ✅ ИСПРАВЛЕНО: Вызываем модалку через Zustand
          disabled={isSoldOut}
          className={clsx(
              "w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
              isSoldOut 
                ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5" 
                : "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] hover:-translate-y-0.5 active:translate-y-0"
          )}
        >
          {isSoldOut ? 'Мест нет' : 'Записаться в группу'}
        </button>
        
        {/* БЛОК 4: Гарантии */}
        {!isSoldOut && (
          <div className="mt-4 flex items-center justify-center gap-4 opacity-60">
              <p className="text-[12px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <ShieldCheck size={10} className="text-teal-500"/> Без предоплаты
              </p>
              <p className="text-[12px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Check size={10} className="text-teal-500"/>Автоматическое подтверждение
              </p>
          </div>
        )}
        
      </div>
    </aside>
  );
}