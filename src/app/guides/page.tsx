// src/app/guides/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getGuidesForLanding } from '@/features/guides/api';

// ЛЕНИВАЯ ЗАГРУЗКА БЛОКА С ГИДАМИ (HTML рендерится на сервере, JS загрузится позже)
const GuidesEditorialList = dynamic(
  () => import('@/features/guides/components/GuidesEditorialList'),
  { ssr: true }
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

export const metadata: Metadata = {
  title: 'Команда гидов и инструкторов | Турклуб Эва',
  description: 'Познакомьтесь с профессиональными гидами и инструкторами турклуба «Эва». Опытные лидеры, которые делают каждое ваше приключение безопасным и незабываемым.',
  keywords: ['гиды', 'инструкторы', 'команда турклуб эва', 'походы', 'сопровождение в горах'],
  alternates: { canonical: `${BASE_URL}/guides` },
  openGraph: {
    title: 'Наша команда — Турклуб «Эва»',
    description: 'Надежные лидеры ваших приключений.',
    url: `${BASE_URL}/guides`,
    siteName: 'Турклуб «Эва»',
    type: 'website',
    locale: 'ru_RU',
  }
};

export default async function AllGuidesPage() {
  // ✅ ИСПОЛЬЗУЕМ КЭШИРОВАННУЮ API-ФУНКЦИЮ
  const guides = await getGuidesForLanding();

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30 overflow-hidden">
      
      {/* --- PREMIUM HERO SECTION --- */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-teal-500/10 md:blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center flex flex-col items-center">
          <div className="animate-hero-subtitle inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6">
             <Users size={14} className="text-teal-400" />
             <span className="text-[12px] font-bold uppercase tracking-widest text-teal-400">
               Лица клуба
             </span>
          </div>
          
          <h1 className="animate-hero-title text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
            <span className="font-light text-slate-300 block md:inline">Команда </span>
            <span className="font-black text-white">Клуба</span>
            <span className="text-teal-500">.</span>
          </h1>
          
          <p className="animate-hero-subtitle text-base md:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed">
            Наши гиды — это не просто проводники. Это люди, влюбленные в природу, с которыми безопасно, весело и душевно.
          </p>
        </div>
      </section>

      {/* --- СПИСОК ГИДОВ --- */}
      <section className="relative z-10 pb-24">
        {guides.length > 0 ? (
          <GuidesEditorialList guides={guides} />
        ) : (
          <div className="text-center text-slate-300 py-20">
            Информация о команде обновляется...
          </div>
        )}
      </section>
    </main>
  );
}