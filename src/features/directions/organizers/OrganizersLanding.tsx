// Первый экран — синхронно (клиентский только из-за useModalStore в кнопке)
import OrgHero from '@features/directions/organizers/OrgHero';
import dynamic from 'next/dynamic';

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
      
      {/* 1. Главный экран */}
      <OrgHero />
      
      {/* 3. Форматы (Тимбилдинг, Ретриты, Стратсессии) */}
      <OrgFormats />
      
      {/* 2. Боли организатора (Эмпатия) */}
      <OrgEmpathy />
      
      {/* 4. Как мы работаем (Шаги) */}
      <OrgWorkflow />

      {/* 5. Контактный центр B2B */}
      {/* ✅ Добавили id="contact" для нативного якорного скролла */}
      <div id="contact" className="scroll-mt-10">
         <OrgContact />
      </div>

    </main>
  );
}