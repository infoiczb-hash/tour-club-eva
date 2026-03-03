"use client";

import React, { useState } from 'react';
import { Tour } from '@/features/tours/types';

import TourStickyNav from './TourStickyNav';
import TourHero from './TourHero';
import TourStats from './TourStats';
import TourLogistics from './TourLogistics';
import TourDescription from './TourDescription';
import TourGallery from './TourGallery';
import TourEssentials from './TourEssentials';
import TourDates from './TourDates';
import TourFAQ from './TourFAQ';
import TourSidebar from './TourSidebar';
import TourActionButtons from './TourActionButtons';
import TourBottomActions from './TourBottomActions';
import dynamic from 'next/dynamic';

const TourProgram = dynamic(() => import('./TourProgram'), { ssr: true });

const BookingModal = dynamic(() => import('./BookingModal'), { ssr: false });

interface TourDetailsWrapperProps {
  tour: Tour;
}

export default function TourDetailsWrapper({ tour }: TourDetailsWrapperProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const handleOpenBooking = (dateStr?: string) => {
    if (dateStr) setSelectedDate(dateStr);
    setIsBookingOpen(true);
  };

  return (
    <div className="bg-slate-950 min-h-screen pb-0 selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* 1. НАВИГАЦИЯ */}
      <TourStickyNav />

      {/* 2. ГЕРОЙ */}
      <TourHero tour={tour} />

      {/* 3. ОСНОВНОЙ КОНТЕНТ */}
      {/* FIX: Заменил mb-24 на pb-24. 
         Это убирает белую полосу снизу, так как отступ теперь внутри окрашенного блока.
      */}
      <main className="container mx-auto px-4 relative z-10 mt-6 md:mt-10 pb-24">
        
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* ЛЕВАЯ КОЛОНКА */}
          {/* FIX СПЕЙСИНГА: Уменьшил gap-10 md:gap-14 -> gap-8 md:gap-10.
             Почему: У компонентов (Dates, FAQ) внутри есть свои mb-12. 
             Уменьшение gap здесь компенсирует двойные отступы.
          */}
          <div className="lg:col-span-8 flex flex-col gap-8 md:gap-10">
             <TourStats tour={tour} />
             <TourLogistics tour={tour} />
             
             {/* FIX: Добавил передачу тегов */}
             <TourDescription 
                description={tour.description} 
                highlights={tour.highlights}
                tags={tour.tags} 
             />

             <TourProgram program={tour.program} />
             <TourGallery images={tour.gallery || []} />
             
             <TourEssentials 
                included={tour.included || []}
                additionalExpenses={tour.additionalExpenses || []}
                documents={tour.documents}
                checklist={tour.checklist}
             />

             {/* FIX: Добавил функцию onBook для кнопки "Выбрать" */}
             <TourDates 
                tour={tour} 
                onBook={(dateStr) => handleOpenBooking(dateStr)} 
             />

             <TourFAQ tour={tour} />
             <TourActionButtons tour={tour} />
          </div>

          {/* ПРАВАЯ КОЛОНКА (Сайдбар) */}
          <div className="hidden lg:block lg:col-span-4 relative">
             <div className="sticky top-24">
                <TourSidebar 
                   tour={tour} 
                   onBook={() => handleOpenBooking()} 
                />
             </div>
          </div>

        </div>
      </main>

      {/* 4. МОБИЛЬНЫЙ БАР */}
      <TourBottomActions 
        tour={tour} 
        onBook={() => handleOpenBooking()} 
      />

      {/* 5. МОДАЛКА */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)}
        tour={tour}
        initialDate={selectedDate}
      />

    </div>
  );
}