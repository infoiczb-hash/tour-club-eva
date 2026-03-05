import { Tour } from '@/features/tours/types'; 

import HikesHero from './HikesHero';
import HikesStory from './HikesStory';
import HikesDestinations from './HikesDestinations';
import HikesLogistics from './HikesLogistics';
import HikesGallery from './HikesGallery';
import HikesFAQ from './HikesFAQ';
import ToursBrowserDynamic from '@/features/tours/components/ToursBrowserDynamic';

export default function HikesLanding({ tours = [] }: { tours?: Tour[] }) {
  return (
    // Обертка страницы теперь темная!
    <main className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-teal-500/30">
      
      <HikesHero />
      <HikesStory />
      <HikesLogistics />
      <HikesDestinations />
      <HikesGallery />
      <HikesFAQ />
      
      {/* Афиша реальных туров. Заменили ref на id="catalog" */}
      <section id="catalog" className="py-10 md:py-14 bg-stone-950 relative overflow-hidden scroll-mt-10 border-t border-white/5">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10 max-w-6xl">
              <div className="bg-stone-900/40 rounded-[2.5rem] border border-stone-800 p-4 md:p-8 backdrop-blur-sm">
                  
                  {/* 🔥 Заменили <ToursBrowser> на <ToursBrowserDynamic> */}
                  <ToursBrowserDynamic 
                      tours={tours} 
                      limit={6}
                      title="Ближайшие экспедиции"
                      subtitle="Выберите маршрут, который подходит именно вам"
                  />
                  
              </div>
          </div>
      </section>

    </main>
  );
}