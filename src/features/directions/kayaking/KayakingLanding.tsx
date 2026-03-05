import Hero from "./Hero";
import Benefits from "./Benefits";
import Timeline from "./Timeline";
import Fleet from "./Fleet";
import PopularRoutes from "./PopularRoutes";
import Gallery from "./Gallery"; 
import FAQ from "./FAQ";
import PackingList from "./PackingList";
import KayakRules from "./KayakRules";
import VideoGuide from "./VideoGuide";
import SafetyRegulations from "./SafetyRegulations";
import PreparationCTA from "./PreparationCTA";
import { Tour } from "@/features/tours/types";
import dynamic from 'next/dynamic';
import { KayakingTabProvider, KayakingTabContent } from "./KayakingTabProvider";

const ToursBrowser = dynamic(() => import('@/features/tours/components/ToursBrowser'), {
  ssr: false,
});

export default function KayakingLanding({ tours }: { tours: Tour[] }) {
  return (
    <div className="bg-slate-950 min-h-screen selection:bg-teal-500/30">
      <KayakingTabProvider>
        
        {/* Главный экран сам достанет нужный стейт из контекста */}
        <Hero />
        
        {/* ==========================================
            ПОТОК 1: "ХОЧУ НА СПЛАВ" (ПРОДАЖА И ЭМОЦИИ)
            Эти блоки теперь СЕРВЕРНЫЕ КОМПОНЕНТЫ!
            ========================================== */}
        <KayakingTabContent value="newbie">
          <Benefits />
          <Fleet />
          <PopularRoutes />
          <Timeline />
          <Gallery />
          <FAQ />
          <div id="tours" className="bg-[#0B1120] border-y border-white/5 relative z-20">
              <ToursBrowser 
                tours={tours} 
                title="Ближайшие сплавы" 
                subtitle="Выбери свою дату" 
                limit={3} 
              />
          </div>
        </KayakingTabContent>

        {/* ==========================================
            ПОТОК 2: "Я УЧАСТНИК" (ИНСТРУКЦИЯ И ПОДГОТОВКА)
            ========================================== */}
        <KayakingTabContent value="participant">
           <PackingList />
           <KayakRules />
           <VideoGuide />
           <SafetyRegulations />
           <PreparationCTA />
        </KayakingTabContent>
        
      </KayakingTabProvider>
    </div>
  );
}