"use client";

import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { Tour } from '@/features/tours/types';

// 1. СЛОВАРЬ ТИПОВ
// Если ключ есть - берем перевод. Если нет - берем значение из базы.
const TYPE_MAP: Record<string, string> = {
  hiking: 'Поход',
  water: 'Сплав',
  auto: 'Автотур',
  excursion: 'Экскурсия',
  kids: 'Детский',
  // 'weekend', 'выходной день' и прочее выведутся как есть
};

interface TourHeroProps {
  tour: Tour;
}

export default function TourHero({ tour }: TourHeroProps) {
  
  // --- ЛОГИКА ДАТ (Без изменений, ваш код) ---
  const renderDateRange = () => {
    if (!tour.date) return 'Дата уточняется';
    
    const startDate = new Date(tour.date);
    const ruDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
    const dayOnly = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });

    if (!tour.endDate) return ruDate.format(startDate);

    const endDate = new Date(tour.endDate);
    if (startDate.getMonth() === endDate.getMonth()) {
       return `${dayOnly.format(startDate)} — ${ruDate.format(endDate)}`;
    }
    return `${ruDate.format(startDate)} — ${ruDate.format(endDate)}`;
  };

  const getDuration = () => {
    if (tour.duration) return tour.duration;
    if (tour.date && tour.endDate) {
      const start = new Date(tour.date).getTime();
      const end = new Date(tour.endDate).getTime();
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return `${days} дней`;
    }
    return '1 день';
  };

  // --- ЛОГИКА МЕТКИ (TYPE) ---
  // Пробуем словарь, иначе база
  const typeLabel = tour.type 
    ? (TYPE_MAP[tour.type.toLowerCase()] || tour.type) 
    : 'Путешествие';

  return (
    <section className="relative h-[80vh] min-h-[550px] w-full flex items-end overflow-hidden">
      
      {/* 1. ФОН (Ваш код) */}
      <div className="absolute inset-0 z-0">
        <Image
          src={tour.image || '/placeholder-tour.jpg'}
          alt={tour.title}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/60 to-transparent" />
      </div>

      {/* 2. КОНТЕНТ */}
      <div className="container mx-auto px-4 relative z-10 pb-12 md:pb-16 pt-32 flex flex-col justify-end h-full">
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4 md:space-y-6 max-w-5xl">

            {/* --- БЕЙДЖИ (ИСПРАВЛЕНО) --- */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              
              {/* 1. ТИП ТУРА (Всегда первый) */}
              {/* Стиль: Бирюзовый фон, темный текст (как на скрине) */}
              <span className="px-3 py-1 rounded-md bg-teal-500 text-slate-900 text-[14px] md:text-xs font-black uppercase tracking-widest backdrop-blur-md">
                  {typeLabel}
              </span>

              {/* 2. МАРКЕТИНГОВАЯ МЕТКА (LABEL) - Только если есть */}
              {/* Стиль: Прозрачный/Серый фон, белый текст (как "Средний" на скрине, но теперь тут Label) */}
              {tour.label && (
                <span className="px-3 py-1 rounded-md bg-white/20 text-white border border-white/20 text-[14px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    {tour.label}
                </span>
              )}
            </div>

            {/* ЗАГОЛОВОК */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-[1.1] tracking-tight drop-shadow-xl">
              {tour.title}
            </h1>
            
            {/* ПОДЗАГОЛОВОК */}
            {tour.subtitle && (
              <p className="text-sm md:text-lg text-slate-200 font-light max-w-2xl leading-relaxed opacity-90">
                {tour.subtitle}
              </p>
            )}

            {/* --- НИЖНИЙ БЛОК ИНФОРМАЦИИ (КАК БЫЛО) --- */}
            {/* Линия сверху, 3 элемента в ряд */}
            <div className="pt-6 md:pt-8 mt-4 border-t border-white/10">
                <div className="grid grid-cols-2 md:flex md:items-center gap-y-6 gap-x-8 md:gap-12 text-white">
                    
                    {/* Локация */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Локация</p>
                            <p className="font-bold text-sm md:text-base leading-none">{tour.location}</p>
                        </div>
                    </div>

                    {/* Даты */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Даты</p>
                            <p className="font-bold text-sm md:text-base leading-none capitalize">{renderDateRange()}</p>
                        </div>
                    </div>

                    {/* Длительность */}
                    <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                            <Clock size={16} />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Длительность</p>
                            <p className="font-bold text-sm md:text-base leading-none">{getDuration()}</p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </section>
  );
}