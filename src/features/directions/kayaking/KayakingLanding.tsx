"use client";

import { useState } from "react";
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


import ToursBrowser from "@/features/tours/components/ToursBrowser";
import { Tour } from "@/features/tours/types";

// Тип для наших двух потоков
export type FlowTab = "newbie" | "participant";

export default function KayakingLanding({ tours }: { tours: Tour[] }) {
  // Состояние переключателя (по умолчанию "Хочу на сплав")
  const [activeTab, setActiveTab] = useState<FlowTab>("newbie");

  return (
    <div className="bg-slate-950 min-h-screen selection:bg-teal-500/30">
      
      {/* 1. Главный экран передаем ему состояние и функцию переключения */}
      <Hero activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* ==========================================
          ПОТОК 1: "ХОЧУ НА СПЛАВ" (ПРОДАЖА И ЭМОЦИИ)
          ========================================== */}
      {activeTab === "newbie" && (
        <div className="animate-in fade-in duration-700">
          <Benefits />
          <Fleet />
          <PopularRoutes />
           <Timeline /> {/* На следующем шаге мы сделаем его горизонтальным */}
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
        </div>
      )}

      {/* ==========================================
          ПОТОК 2: "Я УЧАСТНИК" (ИНСТРУКЦИЯ И ПОДГОТОВКА)
          ========================================== */}
      {activeTab === "participant" && (
        <div className="animate-in fade-in duration-700">
          {/* Сюда позже добавим компонент KayakVideoGuide (адаптированный из Sup) */}
           <PackingList />
           <KayakRules />
           <VideoGuide />
           <SafetyRegulations />
           <PreparationCTA onNavigateToRoutes={() => setActiveTab('newbie')} />
          {/* Сюда позже можно будет добавить специфичный FAQ для участников */}
        </div>
      )}
      
    </div>
  );
}