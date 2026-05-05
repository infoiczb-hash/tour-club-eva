// src/app/fun/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import FunClient from './FunClient';
import { Sparkles } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Фан-сектор: Тесты, квизы и подбор туров | Турклуб «Эва»',
  description: 'Интерактивные тесты для туристов. Узнай свой психотип в походе, пройди тест на выживание, собери идеальный рюкзак и позволь AI подобрать тебе маршрут.',
  keywords: [
    'тесты для туристов', 'какой ты турист', 'подобрать тур',
    'квиз выживание в лесу', 'туристические игры', 'турклуб Эва'
  ],
  alternates: { canonical: '/fun' },
  openGraph: {
    title: 'Фан-сектор: Тесты и квизы | Турклуб «Эва»',
    description: 'Интерактивные тесты для туристов. Пройди квиз и позволь AI подобрать тебе идеальный маршрут.',
    url: 'https://evatur.club/fun',
    siteName: 'Турклуб «Эва»',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Фан-сектор: Тесты и интерактивы от Турклуба Эва' }],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Фан-сектор: Тесты и квизы | Турклуб Эва',
    description: 'Узнай свой психотип в походе и собери виртуальный рюкзак.',
    images: ['/og-default.jpg'],
  }
};

export default async function FunSectorPage() {
  const tests = await prisma.funTest.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  const firstImage = tests[0]?.image;
  
  // Оптимизация Cloudinary для LCP
  const imageSrcSet = firstImage 
    ? `/_next/image?url=${encodeURIComponent(firstImage)}&w=640&q=65 640w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=750&q=65 750w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=828&q=65 828w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=1080&q=65 1080w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=1200&q=65 1200w`
    : undefined;

  const serializedTests = JSON.parse(JSON.stringify(tests));

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden relative">
      {/* 1. СТАТИЧНЫЙ ФОН: Теперь рендерится на сервере */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 md:blur-[150px] rounded-full opacity-40" />
        <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-teal-900/10 md:blur-[150px] rounded-full opacity-30" />
      </div>

      {/* 2. HERO HEADER: Перенесен из клиентского компонента для мгновенной отрисовки H1 */}
      <section className="relative pt-32 pb-12 px-4 container mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md">
          <Sparkles size={16} className="text-teal-400" />
          <span className="text-xs font-black uppercase tracking-widest text-teal-300">Психология & Игры</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]">
          Твои <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">Тесты и квизы</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
          Узнай какой ты турист, проработай страхи, кто ты в туристической группе и подбери идеальное приключение. Осторожно: вызывает желание уйти в поход!
        </p>
      </section>

      {/* 3. ДИНАМИЧЕСКАЯ ЧАСТЬ: Загружаем только сетку тестов и модалки */}
      <div className="container mx-auto px-4 pb-24 relative z-10">
        <Suspense fallback={<div className="min-h-[400px] animate-pulse bg-white/5 rounded-3xl" />}>
          <FunClient activeTests={serializedTests} />
        </Suspense>
      </div>
    </main>
  );
}