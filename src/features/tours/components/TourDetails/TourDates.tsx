"use client";

import React from 'react';
import { Calendar, User, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Tour } from '@/features/tours/types';
import { useModalStore } from '@/shared/store/useModalStore';

interface TourDatesProps {
  tour: Tour;
}

export default function TourDates({ tour }: TourDatesProps) {
  const openBookingModal = useModalStore((state) => state.openBookingModal);
  
  // ✅ ИСПРАВЛЕНО: Теперь берем унифицированный массив dates
  const datesToRender = tour.dates || [];

  if (datesToRender.length === 0) return null;

  return (
    <section className="scroll-mt-24 mb-12 md:mb-16" id="dates">
      {/* ЗАГОЛОВОК */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 min-w-[40px] min-h-[40px] bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0">
           <Calendar size={20} strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
           Расписание
        </h2>
      </div>

      {/* СПИСОК ДАТ */}
      <div className="flex flex-col gap-3">
        {datesToRender.map((item, idx) => {
           // ✅ ИСПРАВЛЕНО: Заменили item.date на item.start
           if (!item.start) return null;

           const startDateObj = new Date(item.start); 
           const startStr = startDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           const endDateObj = item.end ? new Date(item.end) : startDateObj;
           const endStr = endDateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
           
           const dateString = startStr === endStr ? startStr : `${startStr} — ${endStr}`;
           const fullDateStringForBooking = `${dateString}${item.time ? ` в ${item.time}` : ''}`;
           const isSoldOut = (item.spotsLeft ?? 0) <= 0;
           
           const guideName = tour.guide?.name || 'Гид клуба';
           const guideImage = tour.guide?.image || null;

           return (
            <div 
               key={item.id || idx} 
               onClick={() => !isSoldOut && openBookingModal(tour, fullDateStringForBooking, item.id)}
               className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 md:py-4 rounded-2xl border transition-all duration-300 ${
                 isSoldOut 
                  ? 'bg-slate-900/30 border-white/5 opacity-60 cursor-not-allowed'
                  : 'bg-slate-900/60 backdrop-blur-md border-white/10 hover:border-teal-500/40 hover:bg-slate-800/80 cursor-pointer shadow-lg'
               }`}
            >
                {/* ЛЕВАЯ ЧАСТЬ: ДАТЫ */}
                <div className="flex justify-between items-center md:w-1/3 mb-3 md:mb-0">
                   <div className="flex flex-col">
                       <span className={`text-lg md:text-xl font-black uppercase tracking-tight transition-colors ${
                           isSoldOut ? 'text-slate-400' : 'text-white group-hover:text-teal-400'
                       }`}>
                         {dateString}
                       </span>
                       {item.time && (
                          <span className="text-xs text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                              Старт в {item.time}
                          </span>
                       )}
                   </div>
                   
                   <div className="md:hidden shrink-0">
                        {!isSoldOut && (
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors">
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </div>
                        )}
                   </div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: ГИД И СТАТУС */}
                <div className="flex items-center justify-between md:w-2/3 md:justify-end md:gap-8">
                    
                    <div className="flex gap-3 items-center mr-auto md:mr-0">
                        <div className={`relative w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full overflow-hidden shrink-0 flex items-center justify-center ${
                             isSoldOut ? 'bg-slate-800 text-slate-600' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                        }`}>
                           {guideImage ? (
                           <Image 
  src={guideImage} 
  alt={guideName} 
  fill 
  className={`object-cover object-top ${isSoldOut ? 'grayscale opacity-50' : ''}`} 
  sizes="40px" 
/>
                           ) : (
                             <User size={20} />
                           )}
                        </div>
                        <div>
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">
                             Ведет группу
                           </h3>
                           <p className={`text-sm font-bold leading-none ${isSoldOut ? 'text-slate-400' : 'text-white'}`}>
                             {guideName}
                           </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isSoldOut ? (
                            <div className="flex items-center gap-1.5 text-rose-500/80 font-bold text-[11px] uppercase tracking-widest bg-rose-500/10 px-2.5 py-1.5 rounded-md">
                                Мест нет
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-slate-950/50 border border-white/5 px-2.5 py-1.5 rounded-md">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-emerald-400">Осталось {item.spotsLeft ?? tour.spotsLeft}</span>
                            </div>
                        )}

                        {!isSoldOut && (
                            <div className="hidden md:flex w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/5 items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-slate-900 group-hover:translate-x-1 transition-all duration-300">
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