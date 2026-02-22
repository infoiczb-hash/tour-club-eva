'use client';

import { useRef } from 'react';

// Импортируем все наши премиальные блоки
import SuperHero from './components/SuperHero';
import SupBenefits from './components/SupBenefits';
import SupFormats from './components/SupFormats';
import SupSafety from './components/SupSafety';
import SupCatalog from './components/SupCatalog';
import SupEquipment from './components/SupEquipment';
import ProLogistics from './components/ProLogistics';
import SupGallery from './components/SupGallery';
import SupVideo from './components/SupVideo';
import SupFAQ from './components/SupFAQ';

export default function SupLanding() {
  // Реф для кнопки на главном экране, чтобы плавно скроллить к каталогу
  const catalogRef = useRef<HTMLDivElement>(null);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 selection:text-white">
      
      {/* 1. Эмоция и Главный экран */}
      <SuperHero onScrollDown={scrollToCatalog} />
      
      {/* 2. Выгоды (Почему мы) */}
      <SupBenefits />
      
      {/* 3. Форматы (С кем разделить) */}
      <SupFormats />
      
      {/* 4. Безопасность (Снимаем страхи) */}
      <SupSafety />
      
      {/* 5. Каталог (Предлагаем продукт) */}
      <div ref={catalogRef} className="scroll-mt-10">
        <SupCatalog />
      </div>

      {/* 6. Арсенал (Техническое превосходство) */}
      <SupEquipment />
      
      {/* 7. Организационные детали (Для профи и Чек-лист) */}
      <ProLogistics />

      {/* 8. Галерея (Живые эмоции и социальное доказательство) */}
      <SupGallery />
      
      {/* 9. Видео-гид (Динамика на воде) */}
      <SupVideo />
      
      {/* 10. FAQ и Финальный призыв к действию */}
      <SupFAQ />

    </main>
  );
}