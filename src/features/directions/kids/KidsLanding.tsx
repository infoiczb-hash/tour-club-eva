import KidsHero from './KidsHero';
import KidsParents from './KidsParents';
import KidsTransformation from './KidsTransformation';
import KidsFormats from './KidsFormats';
import KidsFAQ from './KidsFAQ';
import KidsCatalog from './KidsCatalog';
import { Tour } from '@/features/tours/types'; // ✅ Тип тура

// ✅ Ожидаем массив туров из page.tsx
export default function KidsLanding({ tours = [] }: { tours?: Tour[] }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-white">
      
      {/* 1. Эмоция и Главный экран */}
      <KidsHero />
      
      {/* 2. Для родителей (Боли и безопасность) */}
      <KidsParents />
      
      {/* 3. Трансформация */}
      <KidsTransformation />

      <div id="formats" className="scroll-mt-20">
        <KidsFormats />
      </div>

      <KidsFAQ />
      
      {/* ✅ Прокидываем туры в каталог, чтобы они отрендерились! */}
      <KidsCatalog tours={tours} />
          
    </main>
  );
}