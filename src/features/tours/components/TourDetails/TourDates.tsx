"use client";

import React from 'react';
import { Calendar, ArrowRight, User, CheckCircle } from 'lucide-react';
import { Tour } from '@/features/tours/types';

interface TourDatesProps {
  tour: Tour;
  // Добавляем функцию, чтобы по клику открывалась модалка
  onBook?: (dateStr: string) => void;
}

export default function TourDates({ tour, onBook }: TourDatesProps) {
  
  // 1. Формируем список дат.
  // Если массив dates пустой, берем основную дату тура.
  let datesToRender = tour.dates && tour.dates.length > 0 
    ? tour.dates 
    : [{ start: tour.date, end: tour.endDate, spots: tour.spotsLeft }];

  if (!datesToRender || datesToRender.length === 0) return null;

  return (
    <section className="scroll-mt-24 mb-12" id="dates">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <Calendar size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           Даты туров
        </h2>
      </div>

      <div className="grid gap-3">
        {datesToRender.map((item: any, idx: number) => {
           // --- РАБОТА С ДАТОЙ ---
           const startDateObj = new Date(item.start || item.date); 
           const startStr = startDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           let endStr = '';
           if (item.end || item.endDate) {
             const endDateObj = new Date(item.end || item.endDate);
             endStr = ` — ${endDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
           }
           
           const dateString = `${startStr}${endStr}`;
           // Эту строку передадим в модалку (Например: "25 мая в 10:00")
           const fullDateStringForBooking = `${startStr}${item.time ? ` в ${item.time}` : ''}`;

           // --- ЧЕСТНАЯ ЛОГИКА МЕСТ (БЕЗ ЗАГЛУШЕК) ---
           // Проверяем: есть ли spots именно у этой даты? Если нет, смотрим spotsLeft у самого тура.
           // Если и там пусто -> будет undefined.
           const spots = item.spots ?? (datesToRender.length === 1 ? tour.spotsLeft : undefined);
           
           // Мест нет, ТОЛЬКО если пришел четкий 0. Если undefined — считаем, что места есть.
           const isSoldOut = spots !== undefined && spots !== null && spots <= 0;

           return (
             <div key={idx} className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-slate-900 border border-white/5 rounded-2xl hover:border-teal-500/30 transition-all">
                
                {/* ЛЕВАЯ ЧАСТЬ: ДАТА И СТАТУС */}
                <div className="flex flex-col mb-4 md:mb-0">
                   <span className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors capitalize">
                     {dateString}
                   </span>
                   {item.time && (
                      <span className="text-xs text-slate-400 mt-1 font-bold">Старт в {item.time}</span>
                   )}
                   
                   {/* БЕЙДЖ СТАТУСА */}
                   <div className="flex items-center gap-2 mt-2">
                     {isSoldOut ? (
                        // ВАРИАНТ 1: МЕСТ НЕТ (Красный)
                        <span className="text-xs font-bold text-rose-500 uppercase bg-rose-500/10 px-2 py-0.5 rounded">
                          Мест нет
                        </span>
                     ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                           {(spots !== undefined && spots !== null) ? (
                             // ВАРИАНТ 2: ЗНАЕМ ТОЧНОЕ ЧИСЛО (Например: 5)
                             <>
                               <User size={12} className="text-teal-500" />
                               Осталось мест: <span className="text-white">{spots}</span>
                             </>
                           ) : (
                             // ВАРИАНТ 3: ЧИСЛА НЕТ -> ПРОСТО "МЕСТА ЕСТЬ" (Зеленый)
                             <>
                               <CheckCircle size={12} className="text-emerald-500" />
                               <span className="text-emerald-400">Места есть</span>
                             </>
                           )}
                        </span>
                     )}
                   </div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: ЦЕНА И КНОПКА */}
                <div className="flex items-center justify-between md:gap-8">
                   <div className="text-right mr-auto md:mr-0">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold">Цена</span>
                      <span className="block text-lg font-black text-white">
                         {tour.price.toLocaleString()} {tour.currency}
                      </span>
                   </div>
                   
                   <button 
                     disabled={isSoldOut}
                     // ВАЖНО: вызываем onBook при клике
                     onClick={() => !isSoldOut && onBook && onBook(fullDateStringForBooking)}
                     className={`w-10 h-10 md:w-auto md:h-auto md:px-6 md:py-2.5 rounded-xl flex items-center justify-center font-bold uppercase text-xs tracking-wider transition-all ${
                       isSoldOut 
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-white/5 text-white hover:bg-teal-500 hover:text-slate-900 shadow-lg shadow-black/20'
                     }`}
                   >
                     <span className="hidden md:inline">Выбрать</span>
                     <ArrowRight size={18} className="md:hidden" />
                   </button>
                </div>
             </div>
           )
        })}
      </div>
    </section>
  );
}