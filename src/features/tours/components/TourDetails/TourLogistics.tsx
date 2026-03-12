import React from 'react';
import Image from 'next/image';
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

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 md:p-6 grid md:grid-cols-3 gap-6">
      
      {/* 1. МЕСТО СБОРА */}
      <div className="flex gap-4 items-center">
         <div className="w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0 border border-teal-500/20">
            <MapPin size={20} />
         </div>
         <div>
            <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-1">
               Место сбора
            </h3>
            <p className="text-white font-bold text-sm leading-snug">
               {tour.meetingPoint || 'Уточняется у менеджера'}
            </p>
         </div>
      </div>

      {/* 2. ГИД (С ФОТО) - Исправлено сплющивание */}
      <div className="flex gap-4 items-center">
         <div className="relative w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full overflow-hidden bg-indigo-500/10 border border-indigo-500/20 shrink-0 flex items-center justify-center text-indigo-400">
            {guideImage ? (
              <Image 
                src={guideImage} 
                alt={guideName} 
                fill 
                priority
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <User size={20} />
            )}
         </div>
         
         <div>
            <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-1">
               {guideRole}
            </h3>
            <p className="text-white font-bold text-sm leading-snug">
               {guideName}
            </p>
         </div>
      </div>

      {/* 3. МАРШРУТ */}
      <div className="flex gap-4 items-center">
         <div className="w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
            <Navigation size={20} />
         </div>
         <div>
            <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-1">
               Нить маршрута
            </h3>
            <p className="text-white font-medium text-sm leading-snug">
               {tour.route || 'Кольцевой маршрут'}
            </p>
         </div>
      </div>

    </div>
  );
}