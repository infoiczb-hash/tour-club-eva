import KidsHero from './KidsHero';
import KidsParents from './KidsParents';
import KidsTransformation from './KidsTransformation';
import KidsFormats from './KidsFormats';
import KidsFAQ from './KidsFAQ';
import KidsCatalog from './KidsCatalog';

// ✅ Убрали "use client"
export default function KidsLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-white">
      
      {/* 1. Эмоция и Главный экран */}
      <KidsHero />
      
      {/* 2. Для родителей (Боли и безопасность) */}
      <KidsParents />
      
      {/* 3. Трансформация */}
      <KidsTransformation />

      {/* ✅ Добавили id="formats" для нативного якорного скролла */}
      <div id="formats" className="scroll-mt-20">
        <KidsFormats />
      </div>

      <KidsFAQ />
      <KidsCatalog />
          
    </main>
  );
}