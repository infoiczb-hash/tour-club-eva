import React from 'react';
import dynamic from 'next/dynamic';
import { Tour } from '@/features/tours/types';

// ✅ Above-fold (Первый экран) — статические импорты (попадают в initial bundle)
import TourStickyNav from './TourStickyNav';
import TourHero from './TourHero';

// ✅ Below-fold (Ниже первого экрана) — ленивые импорты (разгружают Main Thread)
const TourStats         = dynamic(() => import('./TourStats'));
const TourLogistics     = dynamic(() => import('./TourLogistics'));
const TourSidebar       = dynamic(() => import('./TourSidebar'));
const TourBottomActions = dynamic(() => import('./TourBottomActions'));
const TourDescription   = dynamic(() => import('./TourDescription'));
const TourProgram       = dynamic(() => import('./TourProgram'));
const TourGallery       = dynamic(() => import('./TourGallery'));
const TourEssentials    = dynamic(() => import('./TourEssentials'));
const TourDates         = dynamic(() => import('./TourDates'));
const TourFAQ           = dynamic(() => import('./TourFAQ'));
const TourActionButtons = dynamic(() => import('./TourActionButtons'));
const SimilarTours      = dynamic(() => import('./SimilarTours'));

interface TourDetailsWrapperProps {
  tour: Tour;
  similarTours?: Tour[];
}

export default function TourDetailsWrapper({ tour, similarTours }: TourDetailsWrapperProps) {
  return (
    // ✅ ИСПРАВЛЕНИЕ: Убрали overflow-x-hidden отсюда, чтобы вернуть сайдбару способность прилипать (sticky)
    <div className="bg-slate-950 min-h-screen pb-0 selection:bg-teal-500/30 selection:text-teal-200">

      <TourStickyNav />
      <TourHero tour={tour} />

      <main className="container mx-auto px-4 relative z-10 mt-6 md:mt-10 pb-24">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ✅ ИСПРАВЛЕНИЕ: Перенесли overflow-x-hidden сюда. Теперь левая колонка защищена от вылезания контента, а правая может быть sticky */}
          <div className="lg:col-span-8 flex flex-col gap-8 md:gap-10 overflow-x-hidden">
            <TourStats tour={tour} />
            <TourLogistics tour={tour} />
            
            {/* ✅ ИНЖЕКЦИЯ: Передаем весь объект tour для доступа к importantInfo */}
            <TourDescription tour={tour} />
            
            <TourProgram program={tour.program} />
            <TourGallery images={tour.gallery || []} />
            
            {/* ✅ ИНЖЕКЦИЯ: Добавили новые детальные списки (аккордеоны) */}
            <TourEssentials 
              included={tour.included || []} 
              additionalExpenses={tour.additionalExpenses || []} 
              documents={tour.documents} 
              checklist={tour.checklist} 
              includedDetailed={tour.includedDetailed} 
              excludedDetailed={tour.excludedDetailed} 
            />

            <TourDates tour={tour} />

            <TourFAQ tour={tour} />
            <TourActionButtons tour={tour} />
          </div>

          <div className="hidden lg:block
  lg:col-span-4 relative
  self-start">
  <div className="sticky top-24">

              <TourSidebar tour={tour} />
            </div>
          </div>

        </div>
        <SimilarTours tours={similarTours || []} />
      </main>

      <TourBottomActions tour={tour} />

    </div>
  );
}