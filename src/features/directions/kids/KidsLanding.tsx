import { TourPreview } from '@/features/tours/types';
import dynamic from 'next/dynamic';

// Первый экран — синхронно, это LCP (с изображением Cloudinary + priority)
import KidsHero from './KidsHero';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

// Всё ниже фолда — lazy
const KidsParents = dynamic(() => import('./KidsParents'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const KidsTransformation = dynamic(() => import('./KidsTransformation'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const KidsFormats = dynamic(() => import('./KidsFormats'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const KidsFAQ = dynamic(() => import('./KidsFAQ'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const KidsCatalog = dynamic(() => import('./KidsCatalog'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

// ✅ Ожидаем массив туров из page.tsx
export default function KidsLanding({ tours }: { tours: TourPreview[] }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-white">
      
      {/* 1. Эмоция и Главный экран (LCP — без обертки) */}
      <KidsHero />
      
      {/* 2. Для родителей (Боли и безопасность) */}
      <SectionErrorBoundary label="Для родителей" minHeight="500px">
        <KidsParents />
      </SectionErrorBoundary>
      
      {/* 3. Трансформация */}
      <SectionErrorBoundary label="Трансформация" minHeight="400px">
        <KidsTransformation />
      </SectionErrorBoundary>

      {/* 4. Форматы детских туров */}
      <div id="formats" className="scroll-mt-20">
        <SectionErrorBoundary label="Форматы детских туров" minHeight="500px">
          <KidsFormats />
        </SectionErrorBoundary>
      </div>

      {/* 5. FAQ */}
      <SectionErrorBoundary label="FAQ детские туры" minHeight="400px">
        <KidsFAQ />
      </SectionErrorBoundary>
      
      {/* 6. Каталог */}
      {/* ✅ Прокидываем туры в каталог, чтобы они отрендерились! */}
      <SectionErrorBoundary label="Каталог детских туров" minHeight="400px">
        <KidsCatalog tours={tours} />
      </SectionErrorBoundary>
          
    </main>
  );
}