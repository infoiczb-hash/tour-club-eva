'use client';

import { useRef } from 'react';

// Импортируем все готовые модули страницы
import OrgHero from '@features/directions/organizers/OrgHero';
import OrgEmpathy from '@features/directions/organizers/OrgEmpathy';
import OrgFormats from '@features/directions/organizers/OrgFormats';
import OrgWorkflow from '@features/directions/organizers/OrgWorkflow';
import OrgContact from '@features/directions/organizers/OrgContact';

export default function OrganizersLanding() {
  // Реф для плавного скролла к форме захвата лидов
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* 1. Главный экран */}
      <OrgHero onScrollDown={scrollToContact} />
      
      {/* 3. Форматы (Тимбилдинг, Ретриты, Стратсессии) */}
      <OrgFormats />
      {/* 2. Боли организатора (Эмпатия) */}
      <OrgEmpathy />
      
      {/* 4. Как мы работаем (Шаги) */}
      <OrgWorkflow />

      {/* 5. Контактный центр B2B */}
      <div ref={contactRef} className="scroll-mt-10">
         <OrgContact />
      </div>

    </main>
  );
}