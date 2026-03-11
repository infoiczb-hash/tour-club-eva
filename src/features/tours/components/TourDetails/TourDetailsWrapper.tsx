import React from 'react';
import dynamic from 'next/dynamic';
import { Tour } from '@/features/tours/types';

// ✅ Above-fold — статические импорты (попадают в initial bundle)
import TourStickyNav from './TourStickyNav';
import TourHero from './TourHero';
import TourStats from './TourStats';
import TourLogistics from './TourLogistics';
import TourSidebar from './TourSidebar';
import TourBottomActions from './TourBottomActions';

// ✅ Below-fold — lazy (не блокируют LCP, грузятся после)
const TourDescription  = dynamic(() => import('./TourDescription'));
const TourProgram      = dynamic(() => import('./TourProgram'));
const TourGallery      = dynamic(() => import('./TourGallery'));
const TourEssentials   = dynamic(() => import('./TourEssentials'));
const TourDates        = dynamic(() => import('./TourDates'));
const TourFAQ          = dynamic(() => import('./TourFAQ'));
const TourActionButtons = dynamic(() => import('./TourActionButtons'));
const SimilarTours     = dynamic(() => import('./SimilarTours'), { ssr: false });

interface TourDetailsWrapperProps {
  tour: Tour;
  similarTours?: Tour[];
}

export default function TourDetailsWrapper({ tour, similarTours }: TourDetailsWrapperProps) {
  return (
    <div className="bg-slate-950 min-h-screen pb-0 selection:bg-teal-500/30 selection:text-teal-200">

      <TourStickyNav />
      <TourHero tour={tour} />

      <main className="container mx-auto px-4 relative z-10 mt-6 md:mt-10 pb-24">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-8 flex flex-col gap-8 md:gap-10">
            <TourStats tour={tour} />
            <TourLogistics tour={tour} />
            <TourDescription description={tour.description} highlights={tour.highlights} tags={tour.tags} />
            <TourProgram program={tour.program} />
            <TourGallery images={tour.gallery || []} />
            <TourEssentials included={tour.included || []} additionalExpenses={tour.additionalExpenses || []} documents={tour.documents} checklist={tour.checklist} />

            {/* Передаем только тур. Внутри TourDates кнопка сама вызовет Zustand */}
            <TourDates tour={tour} />

            <TourFAQ tour={tour} />
            <TourActionButtons tour={tour} />
          </div>

          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-24 self-start">
              <TourSidebar tour={tour} />
            </div>
          </div>

        </div>
        <SimilarTours tours={similarTours || []} />
      </main>

      {/* Передаем только тур. Внутри TourBottomActions кнопка сама вызовет Zustand */}
      <TourBottomActions tour={tour} />

    </div>
  );
}