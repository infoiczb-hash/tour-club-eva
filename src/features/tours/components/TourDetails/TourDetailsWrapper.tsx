import React from 'react';
import dynamic from 'next/dynamic';
import { Tour } from '@/features/tours/types';

// ✅ Above-fold (Первый экран) — статические импорты (попадают в initial bundle)
import TourStickyNav from './TourStickyNav';
import TourHero from './TourHero';
import TourDirectionBanner from './TourDirectionBanner';
import TourLegalLinks from './TourLegalLinks';

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
  isWished?: boolean; // ✅ ДОБАВИЛИ: новый пропс для вишлиста
}

// ✅ ДОБАВИЛИ: достаем isWished (по умолчанию false)
export default function TourDetailsWrapper({ tour, similarTours, isWished = false }: TourDetailsWrapperProps) {
  
  return (
    // overflow-x-hidden убран с корня — sticky сайдбар его не переживает
    <div className="bg-slate-950 min-h-screen pb-0 selection:bg-teal-500/30 selection:text-teal-200">

      <TourStickyNav />
      {/* ✅ ДОБАВИЛИ: Передаем пропс isWished дальше в TourHero */}
      <TourHero tour={tour} isWished={isWished} /> 

      <main className="container mx-auto px-4 relative z-10 mt-6 md:mt-10 pb-24">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Левая колонка: overflow-x-hidden только здесь, не на родителе */}
          <div className="lg:col-span-8 flex flex-col gap-8 md:gap-10 overflow-x-hidden">
            <TourStats tour={tour} />
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
            <TourDates tour={tour} />
                <TourFAQ tour={tour} />
            <TourDirectionBanner categorySlug={tour.category?.slug ?? null} />
            <TourLegalLinks />
            <TourActionButtons tour={tour} />
          </div>

          {/* Правая колонка: self-start и relative убраны — они мешали sticky */}
          <div className="hidden lg:block lg:col-span-4">
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