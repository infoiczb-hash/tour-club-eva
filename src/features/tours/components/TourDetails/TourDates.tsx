"use client";

import React from 'react';
import { Calendar, User, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Tour } from '@/features/tours/types';

interface TourDatesProps {
  tour: Tour;
  onBook?: (dateStr: string) => void;
}

export default function TourDates({ tour, onBook }: TourDatesProps) {
  
  let datesToRender = tour.dates && tour.dates.length > 0 
    ? tour.dates 
    : [{ start: tour.date, end: tour.endDate, spots: tour.spotsLeft }];

  if (!datesToRender || datesToRender.length === 0) return null;

  return (
    <section className="scroll-mt-24 mb-12 md:mb-16" id="dates">
      {/* ================= ЗАГОЛОВОК ================= */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
           <Calendar size={20} strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
           Расписание
        </h2>
      </div>

      {/* ================= СПИСОК ДАТ ================= */}
      <div className="flex flex-col gap-3">
        {datesToRender.map((item: any, idx: number) => {
           
           // --- ЛОГИКА ДАТ: ВСЕГДА ПЕРИОД "ОТ и ДО" ---
           const startDateObj = new Date(item.start || item.date); 
           const startStr = startDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           // Если дата конца не указана, дублируем стартовую, чтобы сохранить формат "Периода"
           const endDateObj = new Date(item.end || item.endDate || item.start || item.date);
           const endStr = endDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           // Итоговая строка: "20 февраля — 22 февраля"
           const dateString = startStr === endStr ? startStr : `${startStr} — ${endStr}`;
           const fullDateStringForBooking = `${dateString}${item.time ? ` в ${item.time}` : ''}`;

           // --- МЕСТА И СТАТУС ---
           const spots = item.spots ?? (datesToRender.length === 1 ? tour.spotsLeft : undefined);
           const isSoldOut = spots !== undefined && spots !== null && spots <= 0;
           const guideData = typeof tour.guide === 'object' && tour.guide !== null ? tour.guide : null;
const guideName = guideData?.name || 'Гид клуба';
const guideImage = guideData?.image || null;

           return (
            <div 
   key={idx} 
   onClick={() => !isSoldOut && onBook && onBook(fullDateStringForBooking)}
   className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 md:py-4 rounded-2xl border transition-all duration-300 
   print:bg-transparent print:border-slate-300 print:shadow-none print:break-inside-avoid print:p-2 print:mb-4 print:text-black ${
     isSoldOut 
      ? 'bg-slate-900/30 border-white/5 opacity-60 cursor-not-allowed print:opacity-100 print:text-slate-500'
      : 'bg-slate-900/60 backdrop-blur-md border-white/10 hover:border-teal-500/40 hover:bg-slate-800/80 cursor-pointer shadow-lg'
   }`}
>
              {/* 1. ВЕРХНЯЯ СТРОКА (Мобилка) / ЛЕВАЯ ЧАСТЬ (Десктоп) -> ДАТЫ */}
                <div className="flex justify-between items-center md:w-1/3 mb-3 md:mb-0">
                   <div className="flex flex-col">
                       <span className={`text-lg md:text-xl font-black uppercase tracking-tight transition-colors ${
                           isSoldOut ? 'text-slate-500' : 'text-white group-hover:text-teal-400'
                       }`}>
                         {dateString}
                       </span>
                       {item.time && (
                          <span className="text-xs text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                              Старт в {item.time}
                          </span>
                       )}
                   </div>
                   
                   {/* Стрелка на мобилке (на десктопе скрыта) */}
                   <div className="md:hidden shrink-0">
                        {!isSoldOut && (
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors">
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </div>
                        )}
                   </div>
                </div>

                {/* 2. НИЖНЯЯ СТРОКА (Мобилка) / ЦЕНТР И ПРАВО (Десктоп) */}
                <div className="flex items-center justify-between md:w-2/3 md:justify-end md:gap-8">
                    
                    {/* --- ГИД (Теперь с правильными типами) --- */}
                    <div className="flex gap-3 items-center mr-auto md:mr-0">
                        <div className={`relative w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center ${
                             isSoldOut ? 'bg-slate-800 text-slate-600' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                        }`}>
                           {guideImage ? (
                             <Image 
                               src={guideImage} 
                               alt={guideName} 
                               fill 
                               className={`object-cover ${isSoldOut ? 'grayscale opacity-50' : ''}`}
                               sizes="40px"
                             />
                           ) : (
                             <User size={20} />
                           )}
                        </div>
                        
                        <div>
                           <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 leading-none">
                              Ведет группу
                           </h4>
                           <p className={`text-sm font-bold leading-none ${isSoldOut ? 'text-slate-500' : 'text-white'}`}>
                              {guideName}
                           </p>
                        </div>
                    </div>

                    {/* --- СТАТУС И СТРЕЛКА (Десктоп) --- */}
                    <div className="flex items-center gap-4">
                        {/* Статус мест */}
                        {isSoldOut ? (
                            <div className="flex items-center gap-1.5 text-rose-500/80 font-bold text-[11px] uppercase tracking-widest bg-rose-500/10 px-2.5 py-1.5 rounded-md">
                                Мест нет
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-slate-950/50 border border-white/5 px-2.5 py-1.5 rounded-md">
                                {(spots !== undefined && spots !== null) ? (
                                    <>
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                        </span>
                                        <span className="text-amber-500">Осталось {spots}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-emerald-400">Места есть</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Стрелка на десктопе */}
                        {!isSoldOut && (
                            <div className="hidden md:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-slate-900 group-hover:translate-x-1 transition-all duration-300">
                                <ChevronRight size={20} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>

                </div>
             </div>
           )
        })}
      </div>
    </section>
  );
}