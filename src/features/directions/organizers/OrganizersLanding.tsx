// Импортируем все готовые модули страницы
import OrgHero from '@features/directions/organizers/OrgHero';
import OrgEmpathy from '@features/directions/organizers/OrgEmpathy';
import OrgFormats from '@features/directions/organizers/OrgFormats';
import OrgWorkflow from '@features/directions/organizers/OrgWorkflow';
import OrgContact from '@features/directions/organizers/OrgContact';

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