// src/features/tours/components/TourDetails/TourDetailsWrapper.tsx
import React, { Suspense } from 'react'; 
import dynamic from 'next/dynamic';
import { Tour, TourPreview } from '@/features/tours/types';

import TourStickyNav from './TourStickyNav';
import TourHero from './TourHero';
import TourDirectionBanner from './TourDirectionBanner';
import TourLegalLinks from './TourLegalLinks';
import SimilarTours, { SimilarToursSkeleton } from './SimilarTours';

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

interface TourDetailsWrapperProps {
  tour: Tour;
  similarToursPromise: Promise<TourPreview[]>; 
  isWished: boolean;
}

export default function TourDetailsWrapper({ 
  tour, 
  similarToursPromise, 
  isWished 
}: TourDetailsWrapperProps) {
  return (
    <>
      <TourHero tour={tour} isWished={isWished} />
      <TourStickyNav />

      {/* Основной контент */}
      <div className="container relative z-10 mt-6 md:mt-10 pb-24">
        
        {/* ИСПРАВЛЕНО: Убрали items-start. Теперь колонки тянутся на всю высоту друг друга! */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* ЛЕВАЯ КОЛОНКА (Длинный контент) */}
          {/*    ИЗМЕНЕНИЕ: overflow-x-hidden заменен на overflow-x-clip */}
          <div className="lg:col-span-8 flex flex-col gap-8 md:gap-10 overflow-x-clip">
              <TourStats tour={tour} />
            <TourDates tour={tour} isWished={isWished} />
            <TourLogistics tour={tour} />
            <TourDescription tour={tour} />
            <TourProgram program={tour.program} />
            <TourGallery images={tour.gallery || []} />
            <TourEssentials
              included={tour.included || []}
              additionalExpenses={tour.additionalExpenses || []}
              documents={tour.documents}
              checklist={tour.checklist}
              includedDetailed={tour.includedDetailed}
              excludedDetailed={tour.excludedDetailed}
            />
            <TourFAQ tour={tour} />
            <TourDirectionBanner categorySlug={tour.category?.slug ?? null} />
            <TourLegalLinks />
            <TourActionButtons tour={tour} />
          </div>

        {/* ПРАВАЯ КОЛОНКА (Сайдбар) */}
          <div className="hidden lg:block lg:col-span-4 relative">
            {/* ДОБАВЛЕНО: Передаем профиль в сайдбар */}
           <TourSidebar tour={tour} />
          </div>
        </div>

        {/* Suspense-обертка для SimilarTours */}
        <Suspense fallback={<SimilarToursSkeleton />}>
          <SimilarTours toursPromise={similarToursPromise} />
        </Suspense>
      </div>

     <TourBottomActions tour={tour} />
    </>
  );
}