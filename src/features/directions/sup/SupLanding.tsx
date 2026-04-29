import dynamic from 'next/dynamic';

// Первый экран — синхронно, это LCP
import SuperHero from './components/SuperHero';

// Второй блок — сразу виден под Hero на большинстве экранов, синхронно
import SupBenefits from './components/SupBenefits';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

// Всё ниже — lazy, грузится после первого рендера
// min-h вместо h- — скелетон не меньше этого значения,
// но не режет контент если реальный блок выше → нет CLS
const SupFormats = dynamic(() => import('./components/SupFormats'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const SupSafety = dynamic(() => import('./components/SupSafety'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

// SupCatalog — якорный блок (#catalog). div с id остаётся в DOM,
// сам компонент грузится лениво — якорная ссылка работает корректно
const SupCatalog = dynamic(() => import('./components/SupCatalog'), {
  loading: () => <div className="min-h-[600px] bg-slate-950" />,
});

const SupEquipment = dynamic(() => import('./components/SupEquipment'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

// ProLogistics — серверный компонент, dynamic() тоже работает
const ProLogistics = dynamic(() => import('./components/ProLogistics'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const SupGallery = dynamic(() => import('./components/SupGallery'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const SupVideo = dynamic(() => import('./components/SupVideo'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const SupFAQ = dynamic(() => import('./components/SupFAQ'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

export default function SupLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 selection:text-white">

      {/* 1. Главный экран (LCP — без обертки) */}
      <SuperHero />

      {/* 2. Выгоды — виден сразу под Hero (Синхронный — без обертки) */}
      <SupBenefits />

      {/* 3. Форматы */}
      <SectionErrorBoundary label="SUP-форматы" minHeight="500px">
        <SupFormats />
      </SectionErrorBoundary>

      {/* 4. Безопасность */}
      <SectionErrorBoundary label="SUP-безопасность" minHeight="500px">
        <SupSafety />
      </SectionErrorBoundary>

      {/* 5. Каталог — id сохраняется на div, якорь работает */}
      <div id="catalog" className="scroll-mt-10">
        <SectionErrorBoundary label="SUP-каталог" minHeight="600px">
          <SupCatalog />
        </SectionErrorBoundary>
      </div>

      {/* 6. Арсенал */}
      <SectionErrorBoundary label="SUP-снаряжение" minHeight="500px">
        <SupEquipment />
      </SectionErrorBoundary>

      {/* 7. Организационные детали */}
      <SectionErrorBoundary label="Логистика" minHeight="400px">
        <ProLogistics />
      </SectionErrorBoundary>

      {/* 8. Галерея */}
      <SectionErrorBoundary label="SUP-галерея" minHeight="500px">
        <SupGallery />
      </SectionErrorBoundary>

      {/* 9. Видео-гид */}
      <SectionErrorBoundary label="SUP-видео" minHeight="400px">
        <SupVideo />
      </SectionErrorBoundary>

      {/* 10. FAQ */}
      <SectionErrorBoundary label="SUP FAQ" minHeight="400px">
        <SupFAQ />
      </SectionErrorBoundary>

    </main>
  );
}