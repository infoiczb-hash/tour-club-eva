// src/features/tours/components/TourLogistics.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Ссылка уже импортирована, это хорошо
import { MapPin, User, Navigation } from 'lucide-react';
import { Tour } from '@/features/tours/types';

interface TourLogisticsProps {
  tour: Tour;
}

export default function TourLogistics({ tour }: TourLogisticsProps) {
  if (!tour) return null;

  const guide = tour.guide;
  const guideName = typeof guide === 'string' ? guide : guide?.name || 'Инструктор клуба';
  const guideImage = typeof guide === 'object' ? guide?.image : null;
  const guideRole = typeof guide === 'object' ? guide?.role : 'Гид группы';
  
  // ✅ ИЗВЛЕКАЕМ SLUG ГИДА
  const guideSlug = typeof guide === 'object' ? guide?.slug : null;

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 md:p-6 grid md:grid-cols-3 gap-6">
      
      {/* 1. МЕСТО СБОРА */}
      <div className="flex gap-4 items-center">
         <div className="w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0 border border-teal-500/20">
            <MapPin size={20} />
         </div>
         <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-bold text-slate-300 uppercase tracking-widest mb-1 break-words">
               Место сбора
            </h3>
            <p className="text-white font-bold text-sm leading-snug break-words">
               {tour.meetingPoint || 'Тирасполь (уточнит гид)'}
            </p>
         </div>
      </div>

      {/* 2. ГИД */}
      <div className="flex gap-4 items-center">
         {/* ✅ ИСПРАВЛЕНО: Добавлен класс relative для корректной работы fill */}
         <div className="relative w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full overflow-hidden bg-indigo-500/10 border border-indigo-500/20 shrink-0 flex items-center justify-center text-indigo-400">
            {guideSlug ? (
               <Link href={`/guides/${guideSlug}`} className="block w-full h-full relative">
                  {guideImage ? (
                    <Image 
                      src={guideImage} 
                      alt={guideName} 
                      fill 
                      loading="lazy"
                      className="object-cover object-top hover:scale-110 transition-transform duration-300"
                      sizes="40px"
                    />
                  ) : (
                    <User size={20} />
                  )}
               </Link>
            ) : (
               guideImage ? (
                 <Image src={guideImage} alt={guideName} fill className="object-cover object-top" sizes="40px" />
               ) : (
                 <User size={20} />
               )
            )}
         </div>
         
         <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-bold text-slate-300 uppercase tracking-widest mb-1 break-words">
               {guideRole}
            </h3>
            {/* ✅ ИСПРАВЛЕНО: Имя теперь ссылка на /guides/[slug] */}
            {guideSlug ? (
              <Link 
                href={`/guides/${guideSlug}`} 
                className="text-white font-bold text-sm leading-snug break-words hover:text-teal-400 transition-colors duration-200 underline-offset-2 decoration-teal-500/30"
              >
                {guideName}
              </Link>
            ) : (
              <p className="text-white font-bold text-sm leading-snug break-words">
                 {guideName}
              </p>
            )}
         </div>
      </div>

      {/* 3. МАРШРУТ */}
      <div className="flex gap-4 items-center">
         <div className="w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
            <Navigation size={20} />
         </div>
         <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-bold text-slate-300 uppercase tracking-widest mb-1 break-words">
               Маршрут
            </h3>
            <p className="text-white font-bold text-sm leading-snug break-words">
               {tour.route|| 'не установлен'}
            </p>
         </div>
      </div>

    </div>
  );
}