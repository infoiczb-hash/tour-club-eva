import { Suspense } from 'react';
import { TourPreview } from '@/features/tours/types';
import dynamic from 'next/dynamic';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

// Первый экран — синхронно, это LCP (серверный, без JS)
import HikesHero from './HikesHero';

// Всё ниже фолда — lazy
const HikesStory = dynamic(() => import('./HikesStory'), {
  loading: () => <div className="min-h-[500px] bg-stone-950" />,
});

const HikesLogistics = dynamic(() => import('./HikesLogistics'), {
  loading: () => <div className="min-h-[400px] bg-stone-950" />,
});

const HikesDestinations = dynamic(() => import('./HikesDestinations'), {
  loading: () => <div className="min-h-[500px] bg-stone-950" />,
});

const HikesGallery = dynamic(() => import('./HikesGallery'), {
  loading: () => <div className="min-h-[400px] bg-stone-950" />,
});

const HikesFAQ = dynamic(() => import('./HikesFAQ'), {
  loading: () => <div className="min-h-[400px] bg-stone-950" />,
});

import ToursBrowserDynamic from '@/features/tours/components/ToursBrowserDynamic';

async function ToursCatalog({ toursPromise }: { toursPromise: Promise<TourPreview[]> }) {
  const tours = await toursPromise;
  return (
    <ToursBrowserDynamic
      tours={tours}
      limit={6}
      title="Ближайшие туры"
      subtitle="Выберите маршрут, который подходит именно вам"
    />
  );
}

export default function HikesLanding({ toursPromise }: { toursPromise: Promise<TourPreview[]> }) {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-teal-500/30">

      {/* 1. Главный экран (LCP - без обертки) */}
      <HikesHero />

      <SectionErrorBoundary label="История походов" minHeight="500px">
        <HikesStory />
      </SectionErrorBoundary>

      <SectionErrorBoundary label="Логистика" minHeight="400px">
        <HikesLogistics />
      </SectionErrorBoundary>

      <SectionErrorBoundary label="Направления" minHeight="500px">
        <HikesDestinations />
      </SectionErrorBoundary>

      <SectionErrorBoundary label="Галерея походов" minHeight="400px">
        <HikesGallery />
      </SectionErrorBoundary>

      <SectionErrorBoundary label="FAQ походы" minHeight="400px">
        <HikesFAQ />
      </SectionErrorBoundary>

      {/* Афиша реальных туров */}
      <section id="catalog" className="py-10 md:py-14 bg-stone-950 relative overflow-hidden scroll-mt-10 border-t border-white/5">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <div className="bg-stone-900/40 rounded-[2.5rem] border border-stone-800 p-4 md:p-8 backdrop-blur-sm">
            <Suspense fallback={<div className="min-h-[300px] bg-stone-950 animate-pulse rounded-3xl" />}>
              <ToursCatalog toursPromise={toursPromise} />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}