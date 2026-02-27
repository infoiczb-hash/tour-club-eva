'use client';

import { useRef } from 'react';
import { Tour } from '@/features/tours/types'; 

// Импортируем будущие блоки
import LocalHero from '@/features/directions/local/LocalHero';
import LocalPhilosophy from '@/features/directions/local/LocalPhilosophy';
import LocalRoutes from '@/features/directions/local/LocalRoutes';
import LocalConditions from '@/features/directions/local/LocalConditions'; 
import LocalGallery from '@/features/directions/local/LocalGallery';
import LocalFAQ from '@/features/directions/local/LocalFAQ';
import ToursBrowser from '@/features/tours/components/ToursBrowser';


export default function LocalLanding({ tours }: { tours: Tour[] }) {
  // Реф для плавного скролла к расписанию
  const scheduleRef = useRef<HTMLDivElement>(null);

  const scrollToSchedule = () => {
    scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-white">
      
      {/* 1. Главный экран */}
      <LocalHero onScrollDown={scrollToSchedule} />
      
      {/* 2. Философия отдыха */}
      <LocalPhilosophy />
      
      {/* 3. Фирменные маршруты */}
       <LocalConditions />
       <LocalRoutes />
           <LocalGallery />
      <LocalFAQ />

      {/* 5. Каталог / Расписание */}
      <section ref={scheduleRef} className="py-10 md:py-18 bg-slate-950 relative border-t border-white/5 scroll-mt-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
              <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-4 md:p-8 backdrop-blur-sm">
                  <ToursBrowser 
                      tours={tours} 
                      limit={6}
                      title="Афиша выездов"
                      subtitle="Локальная программа"
                  />
              </div>
          </div>
      </section>

    </main>
  );
}