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
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
           <Calendar size={20} strokeWidth={2} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
           Расписание
        </h2>
      </div>

      {/* ================= СПИСОК ДАТ ================= */}
      <div className="flex flex-col gap-3 md:gap-4">
        {datesToRender.map((item: any, idx: number) => {
           // --- ПОЛНЫЕ ДАТЫ (Без изменений) ---
           const startDateObj = new Date(item.start || item.date); 
           const startStr = startDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           let endStr = '';
           if (item.end || item.endDate) {
             const endDateObj = new Date(item.end || item.endDate);
             endStr = ` — ${endDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
           }
           
           const dateString = `${startStr}${endStr}`;
           const fullDateStringForBooking = `${startStr}${item.time ? ` в ${item.time}` : ''}`;

           // --- МЕСТА И СТАТУС ---
           const spots = item.spots ?? (datesToRender.length === 1 ? tour.spotsLeft : undefined);
           const isSoldOut = spots !== undefined && spots !== null && spots <= 0;

           return (
             <div 
                key={idx} 
                onClick={() => !isSoldOut && onBook && onBook(fullDateStringForBooking)}
                className={`group relative flex flex-col md:flex-row md:items-center justify-between p-5 md:px-8 md:py-6 rounded-[2rem] border transition-all duration-500 ${
                  isSoldOut 
                   ? 'bg-slate-900/20 border-white/5 opacity-60 cursor-not-allowed'
                   : 'bg-slate-900/50 backdrop-blur-md border-white/5 hover:border-teal-500/30 hover:bg-slate-800/60 cursor-pointer shadow-xl'
                }`}
             >
                {/* 1. ЛЕВАЯ ЧАСТЬ: ДАТА И ВРЕМЯ */}
                <div className="flex flex-col mb-5 md:mb-0 md:w-1/3">
                   <div className="flex items-center justify-between md:justify-start gap-4">
                       <span className={`text-xl md:text-2xl font-black uppercase tracking-tight transition-colors ${
                           isSoldOut ? 'text-slate-500' : 'text-white group-hover:text-teal-400'
                       }`}>
                         {dateString}
                       </span>
                       
                       {/* Мобильная стрелочка (чтобы дизайн не ломался) */}
                       <div className="md:hidden flex-shrink-0">
                            {!isSoldOut && (
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all duration-300">
                                    <ChevronRight size={20} strokeWidth={2.5} />
                                </div>
                            )}
                       </div>
                   </div>

                   {item.time && (
                      <span className="text-sm text-slate-400 mt-1 font-bold">
                          Старт в {item.time}
                      </span>
                   )}
                </div>

                {/* 2. ЦЕНТРАЛЬНАЯ ЧАСТЬ: ГИД (Жизнь и доверие) */}
                <div className="flex flex-row items-center gap-3 pt-4 border-t border-white/5 md:border-none md:pt-0 md:w-1/3 md:justify-center">
                    <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                        {/* Если в базе пока нет полей guide_image, Next.js просто покажет иконку-заглушку */}
                        {tour.guide_image ? (
                            <Image src={tour.guide_image} alt={tour.guide_name || "Гид"} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={18}/></div>
                        )}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] md:text-[11px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">Ведет группу</span>
                        <span className={`text-sm md:text-base font-bold ${isSoldOut ? 'text-slate-500' : 'text-white'}`}>
                            {tour.guide_name || "Гид клуба"}
                        </span>
                    </div>
                </div>

                {/* 3. ПРАВАЯ ЧАСТЬ: СТАТУС И СТРЕЛКА (Десктоп) */}
                <div className="hidden md:flex items-center justify-end md:w-1/3 gap-6">
                    
                    {/* Пульсирующий индикатор мест */}
                    <div className="flex items-center gap-2">
                        {isSoldOut ? (
                            <div className="flex items-center gap-2 text-rose-500/80 font-bold text-sm uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-lg">
                                Мест нет
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                                {(spots !== undefined && spots !== null) ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                        <span className="text-amber-500">Осталось {spots}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-emerald-400">Места есть</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {!isSoldOut && (
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-slate-900 group-hover:translate-x-2 transition-all duration-300 shadow-inner">
                            <ChevronRight size={24} strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                {/* МОБИЛЬНЫЙ СТАТУС (Встраивается отдельной строкой внизу) */}
                <div className="md:hidden mt-4 pt-4 border-t border-white/5">
                     {isSoldOut ? (
                            <div className="flex items-center justify-center gap-2 text-rose-500/80 font-bold text-xs uppercase tracking-widest bg-rose-500/10 px-3 py-2 rounded-lg">
                                Мест нет
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-slate-800/50 py-2 rounded-lg border border-white/5">
                                {(spots !== undefined && spots !== null) ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                        <span className="text-amber-500">Осталось {spots}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-emerald-400">Места есть</span>
                                    </>
                                )}
                            </div>
                        )}
                </div>

             </div>
           )
        })}
      </div>
    </section>
  );
}