import { Tour } from '@/features/tours/types';
import dynamic from 'next/dynamic';

// Первый экран — синхронно, это LCP (с изображением Cloudinary + priority)
import KidsHero from './KidsHero';

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