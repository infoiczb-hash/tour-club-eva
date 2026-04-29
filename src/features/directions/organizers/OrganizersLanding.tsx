// Первый экран — синхронно (клиентский только из-за useModalStore в кнопке)
import OrgHero from '@features/directions/organizers/OrgHero';
import dynamic from 'next/dynamic';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

// Всё ниже фолда — lazy
const OrgFormats = dynamic(() => import('@features/directions/organizers/OrgFormats'), {
  loading: () => <div className="min-h-[500px] bg-slate-950" />,
});

const OrgEmpathy = dynamic(() => import('@features/directions/organizers/OrgEmpathy'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const OrgWorkflow = dynamic(() => import('@features/directions/organizers/OrgWorkflow'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

const OrgContact = dynamic(() => import('@features/directions/organizers/OrgContact'), {
  loading: () => <div className="min-h-[400px] bg-slate-950" />,
});

export default function OrganizersLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* 1. Главный экран (LCP - без обертки) */}
      <OrgHero />
      
      {/* 3. Форматы (Тимбилдинг, Ретриты, Стратсессии) */}
      <SectionErrorBoundary label="Форматы" minHeight="500px">
        <OrgFormats />
      </SectionErrorBoundary>
      
      {/* 2. Боли организатора (Эмпатия) */}
      <SectionErrorBoundary label="Для организаторов" minHeight="400px">
        <OrgEmpathy />
      </SectionErrorBoundary>
      
      {/* 4. Как мы работаем (Шаги) */}
      <SectionErrorBoundary label="Как мы работаем" minHeight="400px">
        <OrgWorkflow />
      </SectionErrorBoundary>

      {/* 5. Контактный центр B2B */}
      {/* ✅ Якорь снаружи для корректного скролла, граница внутри */}
      <div id="contact" className="scroll-mt-10">
        <SectionErrorBoundary label="Контакты B2B" minHeight="400px">
          <OrgContact />
        </SectionErrorBoundary>
      </div>

    </main>
  );
}