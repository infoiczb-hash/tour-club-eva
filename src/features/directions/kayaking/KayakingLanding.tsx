import dynamic from 'next/dynamic';
import { TourPreview } from '@/features/tours/types';
import { KayakingTabProvider, KayakingTabContent } from "./KayakingTabProvider";
import ToursBrowserDynamic from '@/features/tours/components/ToursBrowserDynamic';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

// Первый экран — синхронно, это LCP
import Hero from "./Hero";

// Серверные компоненты первого таба — синхронно, нет JS-бандла
import Benefits from "./Benefits";
import Fleet from "./Fleet";
import Timeline from "./Timeline";
import KayakRules from "./KayakRules";

// Клиентские компоненты первого таба — ниже фолда, lazy
// min-h вместо h- — скелетон не режет контент если реальный блок выше → нет CLS
const PopularRoutes = dynamic(() => import('./PopularRoutes'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const Gallery = dynamic(() => import('./Gallery'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const FAQ = dynamic(() => import('./FAQ'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

// Второй таб — скрыт при загрузке, всё lazy
const PackingList = dynamic(() => import('./PackingList'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const VideoGuide = dynamic(() => import('./VideoGuide'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const SafetyRegulations = dynamic(() => import('./SafetyRegulations'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const PreparationCTA = dynamic(() => import('./PreparationCTA'), {
  loading: () => <div className="min-h-[160px] bg-slate-950" />,
});

export default function KayakingLanding({ tours }: { tours: TourPreview[] }) {
  return (
    <div className="bg-slate-950 min-h-screen selection:bg-teal-500/30">
      <KayakingTabProvider>

        {/* Первый экран */}
        <Hero />

        {/* ПОТОК 1: "ХОЧУ НА СПЛАВ" */}
        <KayakingTabContent value="newbie">
          {/* Benefits и Fleet — серверные, грузятся без JS */}
          <Benefits />
          <Fleet />
          
          <SectionErrorBoundary label="Популярные маршруты" minHeight="500px">
            <PopularRoutes />
          </SectionErrorBoundary>
          
          <Timeline />
          
          <SectionErrorBoundary label="Галерея" minHeight="500px">
            <Gallery />
          </SectionErrorBoundary>
          
          <SectionErrorBoundary label="FAQ" minHeight="400px">
            <FAQ />
          </SectionErrorBoundary>
          
          <div id="tours" className="bg-[#0B1120] border-y border-white/5 relative z-20">
            {/* Обертка SectionErrorBoundary здесь не нужна, так как мы добавили её внутрь самого ToursBrowserDynamic */}
            <ToursBrowserDynamic
              tours={tours}
              title="Ближайшие сплавы"
              subtitle="Выбери свою дату"
              limit={3}
            />
          </div>
        </KayakingTabContent>

        {/* ПОТОК 2: "Я УЧАСТНИК" — скрыт при загрузке, всё lazy */}
        <KayakingTabContent value="participant">
          <SectionErrorBoundary label="Список снаряжения" minHeight="400px">
            <PackingList />
          </SectionErrorBoundary>
          
          <KayakRules />
          
          <SectionErrorBoundary label="Видеогид" minHeight="400px">
            <VideoGuide />
          </SectionErrorBoundary>
          
          <SectionErrorBoundary label="Правила безопасности" minHeight="500px">
            <SafetyRegulations />
          </SectionErrorBoundary>
          
          <SectionErrorBoundary label="Подготовка CTA" minHeight="160px">
            <PreparationCTA />
          </SectionErrorBoundary>
        </KayakingTabContent>

      </KayakingTabProvider>
    </div>
  );
}