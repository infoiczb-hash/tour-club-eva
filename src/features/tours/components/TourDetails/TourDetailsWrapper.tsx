import React from 'react';
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
import TourProgram from './TourProgram';
import SimilarTours from './SimilarTours'; 

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
   {/* Вот сюда добавляем self-start */}
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