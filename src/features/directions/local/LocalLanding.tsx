import { Suspense } from 'react';
import { TourPreview } from '@/features/tours/types';
import dynamic from 'next/dynamic';

// Первый экран — синхронно (серверный, с изображением + priority)
import LocalHero from '@/features/directions/local/LocalHero';

// Серверные компоненты без JS
import LocalPhilosophy from '@/features/directions/local/LocalPhilosophy';
import LocalConditions from '@/features/directions/local/LocalConditions';
import LocalRoutes from '@/features/directions/local/LocalRoutes';
import LocalGallery from '@/features/directions/local/LocalGallery';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

// Клиентский компонент — lazy
const LocalFAQ = dynamic(() => import('@/features/directions/local/LocalFAQ'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

import ToursBrowserDynamic from '@/features/tours/components/ToursBrowserDynamic';

async function ToursCatalog({ toursPromise }: { toursPromise: Promise<TourPreview[]> }) {
  const tours = await toursPromise;
  return (
    <ToursBrowserDynamic
      tours={tours}
      limit={6}
      title="Афиша выездов"
      subtitle="Локальная программа"
    />
  );
}

export default function LocalLanding({ toursPromise }: { toursPromise: Promise<TourPreview[]> }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-white">

      {/* 1. Главный экран (LCP — без обертки) */}
      <LocalHero />

      {/* 2. Философия отдыха */}
      <LocalPhilosophy />

      {/* 3. Фирменные маршруты и контент */}
      <LocalConditions />
      <LocalRoutes />
      <LocalGallery />

      <SectionErrorBoundary label="FAQ местный туризм" minHeight="400px">
        <LocalFAQ />
      </SectionErrorBoundary>

      {/* 4. Каталог / Расписание */}
      <section id="schedule" className="py-10 md:py-18 bg-slate-950 relative border-t border-white/5 scroll-mt-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/10 md:blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-4 md:p-8 backdrop-blur-sm">
            <Suspense fallback={<div className="min-h-[300px] bg-slate-950 animate-pulse rounded-3xl" />}>
              <ToursCatalog toursPromise={toursPromise} />
            </Suspense>
          </div>
        </div>
      </section>

    </main>
  );
}