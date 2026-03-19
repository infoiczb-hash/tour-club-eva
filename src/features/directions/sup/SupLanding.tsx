import dynamic from 'next/dynamic';

// Первый экран — синхронно, это LCP
import SuperHero from './components/SuperHero';

// Второй блок — сразу виден под Hero на большинстве экранов, синхронно
import SupBenefits from './components/SupBenefits';

// Всё ниже — lazy, грузится после первого рендера
// Скелетон высотой примерно равной блоку — нет layout shift при загрузке
const SupFormats = dynamic(() => import('./components/SupFormats'), {
  loading: () => <div className="h-96 bg-slate-950" />,
});

const SupSafety = dynamic(() => import('./components/SupSafety'), {
  loading: () => <div className="h-96 bg-slate-950" />,
});

// SupCatalog — якорный блок (#catalog). div с id остаётся в DOM,
// сам компонент грузится лениво — якорная ссылка работает корректно
const SupCatalog = dynamic(() => import('./components/SupCatalog'), {
  loading: () => <div className="h-[500px] bg-slate-950" />,
});

const SupEquipment = dynamic(() => import('./components/SupEquipment'), {
  loading: () => <div className="h-96 bg-slate-950" />,
});

// ProLogistics — серверный компонент, dynamic() тоже работает
const ProLogistics = dynamic(() => import('./components/ProLogistics'), {
  loading: () => <div className="h-80 bg-slate-950" />,
});

const SupGallery = dynamic(() => import('./components/SupGallery'), {
  loading: () => <div className="h-96 bg-slate-950" />,
});

const SupVideo = dynamic(() => import('./components/SupVideo'), {
  loading: () => <div className="h-80 bg-slate-950" />,
});

const SupFAQ = dynamic(() => import('./components/SupFAQ'), {
  loading: () => <div className="h-80 bg-slate-950" />,
});

export default function SupLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 selection:text-white">

      {/* 1. Главный экран */}
      <SuperHero />

      {/* 2. Выгоды — виден сразу под Hero */}
      <SupBenefits />

      {/* 3. Форматы */}
      <SupFormats />

      {/* 4. Безопасность */}
      <SupSafety />

      {/* 5. Каталог — id сохраняется на div, якорь работает */}
      <div id="catalog" className="scroll-mt-10">
        <SupCatalog />
      </div>

      {/* 6. Арсенал */}
      <SupEquipment />

      {/* 7. Организационные детали */}
      <ProLogistics />

      {/* 8. Галерея */}
      <SupGallery />

      {/* 9. Видео-гид */}
      <SupVideo />

      {/* 10. FAQ */}
      <SupFAQ />

    </main>
  );
}