"use client";

import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, Sparkles, Map } from 'lucide-react';
import clsx from 'clsx';
import { Tour } from '@/features/tours/types';
import TourCard from './TourCard';
// Импортируем ваш календарь (убедитесь, что путь верный)
import CalendarView from './CalendarView';

interface TourListProps {
  tours: Tour[];
  t?: any;
  viewMode: 'grid' | 'calendar';
}

const INITIAL_COUNT = 6; // Старт: 2 ряда по 3 карточки
const LOAD_STEP = 6;     // Шаг подгрузки

export default function TourList({ tours, t, viewMode }: TourListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  // Сброс пагинации, если изменились фильтры (пришел новый массив tours)
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [tours]);

  // --- 1. ПУСТОЕ СОСТОЯНИЕ (Empty State 2026) ---
  if (!tours || tours.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
           <Map className="text-slate-300" size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 font-condensed uppercase">
          Здесь пока тихо...
        </h3>
        <p className="text-slate-300 max-w-md mx-auto text-lg">
          Туров в этой категории пока нет, но мы уже готовим новые маршруты. Попробуйте выбрать другую категорию.
        </p>
      </div>
    );
  }

  // --- 2. РЕЖИМ КАЛЕНДАРЯ ---
  // Если выбран календарь, рендерим компонент календаря (ему нужны все туры сразу)
  if (viewMode === 'calendar') {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <CalendarView events={tours} />
        </div>
    );
  }

  // --- 3. РЕЖИМ СЕТКИ (GRID) ---
  
  // Вырезаем только видимую часть (для пагинации)
  const visibleTours = tours.slice(0, visibleCount);
  const hasMore = visibleCount < tours.length;
  // Вычисляем процент для прогресс-бара
  const progressPercentage = Math.min((visibleCount / tours.length) * 100, 100);

  return (
    <div className="flex flex-col gap-12">
      
      {/* Сетка карточек */}
      <div 
        className={clsx(
          "grid gap-6 md:gap-5",
          // Mobile: 1 колонка | Tablet: 2 колонки | Desktop: 3 колонки (как договаривались)
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        )}
      >
        {visibleTours.map((tour) => (
           <TourCard key={tour.id} tour={tour}/>
        ))}
      </div>

      {/* Кнопка "Показать еще" (Load More) */}
      {hasMore && (
        <div className="flex flex-col items-center justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           
           {/* UX 2026: Прогресс просмотра (Feedback) */}
           <div className="flex flex-col items-center w-full max-w-xs mb-6">
               <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">
                  Показано {visibleTours.length} из {tours.length}
               </p>
               
               {/* Визуальный прогресс-бар */}
               <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
                    style={{ width: `${progressPercentage}%` }}
                  />
               </div>
           </div>

           {/* Сама кнопка */}
           <button
             onClick={() => setVisibleCount(prev => prev + LOAD_STEP)}
             className="group relative flex items-center gap-4 px-10 py-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-200 text-slate-900 font-bold rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
           >
             <span className="uppercase tracking-wider text-sm">Показать еще туры</span>
             <ArrowDownCircle 
               size={24} 
               className="text-teal-600 group-hover:translate-y-1 transition-transform duration-300" 
             />
           </button>
        </div>
      )}
    </div>
  );
}