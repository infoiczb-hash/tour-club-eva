'use client';

import { useRef } from 'react';
import KidsHero from './KidsHero';
import KidsParents from './KidsParents';
import KidsTransformation from './KidsTransformation';
import KidsFormats from './KidsFormats';
import KidsFAQ from './KidsFAQ';
import KidsCatalog from './KidsCatalog';


export default function KidsLanding() {
  // Реф для плавного скролла к форматам (как мы делали в SUP)
  const formatsRef = useRef<HTMLDivElement>(null);

  const scrollToFormats = () => {
    formatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-white">
      
      {/* 1. Эмоция и Главный экран */}
      <KidsHero onScrollDown={scrollToFormats} />
      
      {/* 2. Для родителей (Боли и безопасность) */}
      <KidsParents />
      
      {/* 3. Трансформация */}
      <KidsTransformation />
      <KidsFormats />
      <KidsFAQ />
      <KidsCatalog />
          
    </main>
  );
}