// src/features/tours/components/TourDetails/Step1Cart.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
// ИСПРАВЛЕНИЕ: Добавили Send в общий список импорта lucide-react
import { Calendar, Ticket, Minus, Plus, ArrowRight, LogIn, AlertCircle, Layers, Send } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { BookingFormValues } from './booking.schema';
import Link from 'next/link';
import { clsx } from 'clsx';

const EMPTY_CART: Record<string, number> = {};

interface Step1CartProps {
  // ИСПРАВЛЕНИЕ: Элегантно расширили тип Tour локально через амперсанд (&).
  // Теперь TypeScript знает, что у этого объекта есть массив категорий цен.
  tour: Tour & { tourPriceCategories?: any[] };
  onNext: () => void;
  onSoldOut: () => void;
  isLoggedIn: boolean;
}

const formatDateForDropdown = (d: any) => {
  const dateVal = d.startDate || d.start || d.date;
  if (!dateVal) return '';
  const dateObj = new Date(dateVal);
  const str = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${str}${d.time ? ` в ${d.time}` : ''}`;
};

export default function Step1Cart({ tour, onNext, onSoldOut, isLoggedIn }: Step1CartProps) {
  const { watch, setValue } = useFormContext<BookingFormValues>();

  // Подписываемся на состояние корзины и выбранной даты
  const selectedDateId = watch('tourDateId');
  const cartV2 = watch('cartV2') || EMPTY_CART;
  const ticketsAdult = watch('ticketsAdult');
  const ticketsChild = watch('ticketsChild');
  const ticketsMember = watch('ticketsMember');
  const ticketsFamily = watch('ticketsFamily');

  // Определение режима (Дуализм V1/V2)
  const isV2 = Array.isArray(tour.tourPriceCategories) && tour.tourPriceCategories.length > 0;

  // Фильтруем только будущие выезды
  const validDates = useMemo(() => {
    const sourceDates = (tour.tourDates && tour.tourDates.length > 0) ? tour.tourDates : (tour.dates || []);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return sourceDates.filter((d: any) => {
      const dateVal = d.startDate || d.start || d.date;
      return dateVal ? new Date(dateVal) >= now : true;
    });
  }, [tour.tourDates, tour.dates]);

  const targetDate = useMemo(() => validDates.find((d: any) => d.id === selectedDateId), [validDates, selectedDateId]);
  
  // Места берём строго из базы данных
  const spotsLeft = targetDate ? (targetDate.spotsLeft ?? targetDate.capacity ?? 0) : (tour.spotsLeft || 0);
  const isDateSoldOut = validDates.length > 0 ? (targetDate ? spotsLeft <= 0 : false) : (tour.spotsLeft || 0) <= 0;

  // Подсчёт суммарного количества мест в корзине
  const totalSpotsSelected = useMemo(() => {
    if (isV2) {
      return (tour.tourPriceCategories || []).reduce((sum: number, cat: any) => {
        return sum + ((cartV2[cat.id] || 0) * (cat.spotsPerUnit || 1));
      }, 0);
    }
    return ticketsAdult + ticketsChild + ticketsMember + (ticketsFamily * 3);
  }, [isV2, cartV2, ticketsAdult, ticketsChild, ticketsMember, ticketsFamily, tour.tourPriceCategories]);

  // Сброс и предзаполнение гостей при изменении состава корзины
  useEffect(() => {
    // Автоматически подстраиваем структуру под количество мест
    // Мы сделаем полную разметку массива гостей на следующем шаге (Step2), 
    // здесь нам важно просто контролировать валидность перехода
  }, [totalSpotsSelected]);

  // Обработчики инкремента/декремента для V2
  const handleUpdateV2 = (catId: string, minQty: number, change: number) => {
    const current = cartV2[catId] || 0;
    const nextValue = Math.max(minQty, current + change);
    setValue(`cartV2.${catId}`, nextValue, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
      
      {/* МАРКЕТИНГОВЫЙ БАННЕР АВТОРИЗАЦИИ */}
      {!isLoggedIn && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl shrink-0">
            <LogIn size={20} className="text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-400 mb-1">Рекомендуем войти в клуб</h4>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mb-3">
              Войдите через Telegram или Google перед бронированием. Вам откроются кэшбэк бонусами, билеты всегда под рукой и закрытые распродажи!
            </p>
            <Link 
              href="/login" 
              className="inline-flex px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors items-center gap-2"
            >
              <Send size={12}/> Войти в 1 клик
            </Link>
          </div>
        </div>
      )}

      {/* СЕЛЕКТ ВЫБОРА ДАТЫ */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <Calendar size={12} /> Доступные даты выезда
        </label>
        
        {tour.dates && tour.dates.length > 0 ? (
          <div className="relative">
            <select 
              value={selectedDateId || ''} 
              onChange={(e) => {
                const id = e.target.value;
                setValue('tourDateId', id || null);
                const d = tour.dates?.find(x => x.id === id);
                if (d) setValue('tourDateStr', formatDateForDropdown(d));
              }} 
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-teal-500 outline-none cursor-pointer text-sm font-bold"
            >
              {validDates.map((d: any) => {
                const dSpots = d.spotsLeft ?? (d.capacity ? d.capacity - (d._count?.bookings || 0) : 0);
                const labelText = dSpots <= 0 
                  ? `${formatDateForDropdown(d)} (Мест нет 🔒)` 
                  : `${formatDateForDropdown(d)} (Осталось мест: ${dSpots})`;
                  
                return <option key={d.id} value={d.id}>{labelText}</option>;
              })}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>
        ) : (
          <div className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-bold text-sm">
            Открытая дата (по согласованию)
          </div>
        )}
      </div>

      {/* ТАРИФЫ (УПРАВЛЕНИЕ КОРЗИНОЙ) */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <Ticket size={12} /> Выберите количество мест / тариф
        </label>
        
        <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {isV2 ? (
            /* --- РЕЖИМ V2 (ГИБКИЕ КАТЕГОРИИ ЦЕН ИЗ АДМИНКИ) --- */
            (tour.tourPriceCategories || []).map((cat: any) => {
              const currentQty = cartV2[cat.id] || 0;
              return (
                <div key={cat.id} className={clsx("flex items-center justify-between p-4 transition-colors", !cat.isActive && "hidden")}>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {cat.label} 
                      {cat.spotsPerUnit > 1 && (
                        <span className="text-[9px] bg-slate-800 text-slate-300 border border-white/5 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                          {cat.spotsPerUnit} мест
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">{cat.price} {tour.currency}</div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10 shrink-0">
                    <button 
                      type="button" 
                      disabled={currentQty <= (cat.minQuantity || 0)}
                      onClick={() => handleUpdateV2(cat.id, cat.minQuantity || 0, -1)} 
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30"
                    >
                      <Minus size={14}/>
                    </button>
                    <span className="text-sm font-black text-white w-4 text-center">{currentQty}</span>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateV2(cat.id, cat.minQuantity || 0, 1)} 
                      className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-lg"
                    >
                      <Plus size={14}/>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* --- РЕЖИМ V1 (LEGACY FALLBACK ТАРИФЫ ТУРА) --- */
            <>
              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold text-white">Взрослый билет</div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">{tour.price} {tour.currency}</div>
                </div>
                <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10">
                  <button type="button" onClick={() => setValue('ticketsAdult', Math.max(1, ticketsAdult - 1))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-lg"><Minus size={14}/></button>
                  <span className="text-sm font-black text-white w-4 text-center">{ticketsAdult}</span>
                  <button type="button" onClick={() => setValue('ticketsAdult', ticketsAdult + 1)} className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-lg"><Plus size={14}/></button>
                </div>
              </div>
              
              {tour.priceChild ? (
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-bold text-white">Детский билет</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">{tour.priceChild} {tour.currency}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setValue('ticketsChild', Math.max(0, ticketsChild - 1))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-lg"><Minus size={14}/></button>
                    <span className="text-sm font-black text-white w-4 text-center">{ticketsChild}</span>
                    <button type="button" onClick={() => setValue('ticketsChild', ticketsChild + 1)} className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-lg"><Plus size={14}/></button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* ГЛАВНАЯ УПРАВЛЯЮЩАЯ КНОПКА ШАГА */}
      {isDateSoldOut ? (
        /* Если места закончились, переключаем на Лист ожидания */
        <button 
          type="button" 
          onClick={onSoldOut}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 mt-4 text-sm"
        >
          <AlertCircle size={16} /> Записаться в очередь (Мест нет)
        </button>
      ) : (
        /* Обычный переход на шаг ввода экипажа */
        <button 
          type="button" 
          onClick={onNext}
          disabled={totalSpotsSelected < 1}
          className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-between px-6 shadow-lg shadow-teal-500/20 mt-4 text-sm font-bold"
        >
          <span>Выбрано мест на воду: {totalSpotsSelected}</span>
          <span className="flex items-center gap-2">Далее к анкетам <ArrowRight size={18}/></span>
        </button>
      )}

    </div>
  );
}