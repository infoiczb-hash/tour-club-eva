// src/features/tours/components/TourDetails/Step1Cart.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Calendar, Ticket, Minus, Plus, ArrowRight, LogIn, Send, Flame, Zap } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { BookingFormValues } from './booking.schema';
import Link from 'next/link';
import { clsx } from 'clsx';
import { calculateDynamicPrice } from '@/features/tours/lib/pricing';

interface Step1CartProps {
  tour: Tour & { tourPriceCategories?: any[]; priceCategories?: any[] };
  onNext: () => void;
  onSoldOut: () => void;
  onClose: () => void;
  isLoggedIn: boolean;
}

const formatDateForDropdown = (d: any) => {
  const dateVal = d.startDate || d.start || d.date;
  if (!dateVal) return '';
  const dateObj = new Date(dateVal);
  const str = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${str}${d.time ? ` в ${d.time}` : ''}`;
};

export default function Step1Cart({ tour, onNext, onSoldOut, onClose, isLoggedIn }: Step1CartProps) {
  const { watch, setValue } = useFormContext<BookingFormValues>();

  const selectedDateId = watch('tourDateId');
  const ticketsAdult = Number(watch('ticketsAdult') || 0);
  const ticketsChild = Number(watch('ticketsChild') || 0);
  const ticketsMember = Number(watch('ticketsMember') || 0);
  const ticketsFamily = Number(watch('ticketsFamily') || 0);

  const initialCart = watch('cartV2') || {};
  const [localCart, setLocalCart] = useState<Record<string, number>>(initialCart);

  useEffect(() => {
    const formCart = watch('cartV2');
    if (formCart && Object.keys(formCart).length > 0) {
      setLocalCart(formCart);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  
  const spotsLeft = targetDate ? (targetDate.spotsLeft ?? targetDate.capacity ?? 0) : (tour.spotsLeft || 0);
  const isDateSoldOut = validDates.length > 0 ? (targetDate ? spotsLeft <= 0 : false) : (tour.spotsLeft || 0) <= 0;

  // 🚀 SENIOR FIX: Считаем динамическую цену/скидку для выбранной даты
  const basePriceVal = Number(tour.price || 0);
  const dynamicPricing = calculateDynamicPrice(basePriceVal, targetDate || null);
  const priceDelta = dynamicPricing.price - basePriceVal;
  const hasDiscount = priceDelta < 0;

  // Подключаем гибкие тарифы и применяем к ним скидку (не даем уйти в минус)
  const priceCategories = useMemo(() => {
    const rawCategories = tour.tourPriceCategories || tour.priceCategories || [];
    return rawCategories.map((c: any) => {
      const original = Number(c.price || 0);
      return {
        ...c,
        originalPrice: original,
        currentPrice: Math.max(0, original + priceDelta)
      };
    });
  }, [tour.tourPriceCategories, tour.priceCategories, priceDelta]);

  const isV2 = Array.isArray(priceCategories) && priceCategories.length > 0;

  // Считаем актуальные цены для старой логики V1 (с учетом скидок)
  const v1AdultPrice = Math.max(0, basePriceVal + priceDelta);
  const v1ChildPrice = Math.max(0, Number(tour.priceChild || 0) + priceDelta);
  const v1FamilyPrice = Math.max(0, Number(tour.priceFamily || 0) + priceDelta);
  const v1MemberPrice = Math.max(0, Number(tour.priceMember || 0) + priceDelta);

  const totalSpotsSelected = isV2 
    ? priceCategories.reduce((sum: number, cat: any) => {
        const qty = Number(localCart[cat.id] || 0);
        const spots = Number(cat.spotsPerUnit || 1);
        return sum + (qty * spots);
      }, 0)
    : ticketsAdult + ticketsChild + ticketsMember + (ticketsFamily * 3);

  const currentTotalPrice = isV2 
    ? priceCategories.reduce((sum: number, cat: any) => {
        const qty = Number(localCart[cat.id] || 0);
        return sum + (qty * cat.currentPrice);
      }, 0)
    : (ticketsAdult * v1AdultPrice) + 
      (ticketsChild * v1ChildPrice) + 
      (ticketsMember * v1MemberPrice) + 
      (ticketsFamily * v1FamilyPrice);

  const handleUpdateV2 = (catId: string, minQty: number, change: number) => {
    const current = Number(localCart[catId] || 0);
    let nextValue = current + change;

    if (change > 0 && current === 0) {
      nextValue = Math.max(minQty, 1);
    } else if (change < 0 && nextValue < minQty) {
      nextValue = 0;
    }

    const newCart = { ...localCart, [catId]: nextValue };
    setLocalCart(newCart); 
    setValue('cartV2', newCart, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
      
      {!isLoggedIn && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl shrink-0">
            <LogIn size={20} className="text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-400 mb-1">Рекомендуем войти в клуб</h4>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mb-3">
              Войдите через Telegram (рекомендуем) или Google перед бронированием. Вам откроются кэшбэк бонусами, билеты всегда под рукой, промокоды и магазин товаров!
            </p>
            <Link 
              href="/login" 
              onClick={onClose}
              className="inline-flex px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors items-center gap-2"
            >
              <Send size={12}/> Войти в 1 клик
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between ml-1">
          <span className="flex items-center gap-1.5"><Calendar size={12} /> Доступные даты выезда</span>
          
          {/* Маркетинговые бейджи над датой */}
          {dynamicPricing.type === 'EARLY_BIRD' && (
            <span className="text-[10px] text-teal-400 flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20"><Flame size={10} /> Раннее</span>
          )}
          {dynamicPricing.type === 'LAST_MINUTE' && (
            <span className="text-[10px] text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"><Zap size={10} /> Горящий</span>
          )}
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

      <div className="space-y-2 pt-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <Ticket size={12} /> Выберите количество мест / тариф
        </label>
        
        <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {isV2 ? (
            priceCategories.map((cat: any) => {
              const currentQty = localCart[cat.id] || 0;
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
                    {/* Вывод цены V2 со скидкой */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-teal-400">{cat.currentPrice} {tour.currency ?? 'RUB'}</span>
                      {hasDiscount && cat.originalPrice > 0 && (
                        <span className="text-xs text-slate-500 line-through decoration-rose-500/50">{cat.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10 shrink-0">
                    <button 
                      type="button" 
                      disabled={currentQty === 0}
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
            <>
              {/* ВАРИАНТ V1: ЗАМЕНИЛИ ХАРДКОД СЛОВ НА ПРАВИЛЬНЫЕ */}
              <div className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold text-white">Стандарт</div>
                  <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-teal-400">{v1AdultPrice} {tour.currency ?? 'RUB'}</span>
                      {hasDiscount && basePriceVal > 0 && (
                        <span className="text-xs text-slate-500 line-through decoration-rose-500/50">{basePriceVal}</span>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10">
                  <button type="button" onClick={() => setValue('ticketsAdult', Math.max(0, ticketsAdult - 1))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-lg"><Minus size={14}/></button>
                  <span className="text-sm font-black text-white w-4 text-center">{ticketsAdult}</span>
                  <button type="button" onClick={() => setValue('ticketsAdult', ticketsAdult + 1)} className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-lg"><Plus size={14}/></button>
                </div>
              </div>
              
              {tour.priceChild && tour.priceChild > 0 ? (
                <div className="flex items-center justify-between p-4 border-t border-white/5">
                  <div>
                    <div className="text-sm font-bold text-white">Детский</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-teal-400">{v1ChildPrice} {tour.currency ?? 'RUB'}</span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-500 line-through decoration-rose-500/50">{tour.priceChild}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setValue('ticketsChild', Math.max(0, ticketsChild - 1))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-lg"><Minus size={14}/></button>
                    <span className="text-sm font-black text-white w-4 text-center">{ticketsChild}</span>
                    <button type="button" onClick={() => setValue('ticketsChild', ticketsChild + 1)} className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-lg"><Plus size={14}/></button>
                  </div>
                </div>
              ) : null}

              {tour.priceFamily && tour.priceFamily > 0 ? (
                <div className="flex items-center justify-between p-4 border-t border-white/5">
                  <div>
                    <div className="text-sm font-bold text-white">Семья (2+1)</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-teal-400">{v1FamilyPrice} {tour.currency ?? 'RUB'}</span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-500 line-through decoration-rose-500/50">{tour.priceFamily}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setValue('ticketsFamily', Math.max(0, ticketsFamily - 1))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-lg"><Minus size={14}/></button>
                    <span className="text-sm font-black text-white w-4 text-center">{ticketsFamily}</span>
                    <button type="button" onClick={() => setValue('ticketsFamily', ticketsFamily + 1)} className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-lg"><Plus size={14}/></button>
                  </div>
                </div>
              ) : null}

              {tour.priceMember && tour.priceMember > 0 ? (
                <div className="flex items-center justify-between p-4 border-t border-white/5">
                  <div>
                    <div className="text-sm font-bold text-white">Клубная карта</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-teal-400">{v1MemberPrice} {tour.currency ?? 'RUB'}</span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-500 line-through decoration-rose-500/50">{tour.priceMember}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setValue('ticketsMember', Math.max(0, ticketsMember - 1))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-white/10 rounded-lg"><Minus size={14}/></button>
                    <span className="text-sm font-black text-white w-4 text-center">{ticketsMember}</span>
                    <button type="button" onClick={() => setValue('ticketsMember', ticketsMember + 1)} className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-lg"><Plus size={14}/></button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {isDateSoldOut ? (
        <button 
          type="button" 
          onClick={onSoldOut}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 mt-4 text-sm"
        >
          Записаться в очередь (Мест нет)
        </button>
      ) : (
        <button 
          type="button" 
          onClick={onNext}
          disabled={totalSpotsSelected < 1}
          className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-between px-6 shadow-lg shadow-teal-500/20 mt-4 text-sm font-bold"
        >
          <span>Выбрано мест: {totalSpotsSelected} ({currentTotalPrice.toLocaleString()} {tour.currency ?? 'RUB'})</span>
          <span className="flex items-center gap-2">Продолжить <ArrowRight size={18}/></span>
        </button>
      )}

    </div>
  );
}