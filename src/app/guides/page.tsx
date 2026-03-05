import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';
// Импортируем твой готовый компонент со списком
import GuidesList from '@/features/guides/components/GuidesList';

// Базовый URL
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

// 1. SEO МЕТАТЕГИ ДЛЯ ОБЩЕЙ СТРАНИЦЫ КОМАНДЫ
export const metadata: Metadata = {
  title: 'Команда гидов и инструкторов | Турклуб Эва',
  description: 'Познакомьтесь с профессиональными гидами и инструкторами турклуба «Эва». Опытные лидеры, которые делают каждое ваше приключение безопасным и незабываемым.',
  keywords: ['гиды', 'инструкторы', 'команда турклуб эва', 'походы', 'сопровождение в горах'],
  alternates: {
    canonical: `${BASE_URL}/guides`,
  },
  openGraph: {
    title: 'Наша команда — Турклуб «Эва»',
    description: 'Надежные лидеры ваших приключений.',
    url: `${BASE_URL}/guides`,
    siteName: 'Турклуб «Эва»',
    type: 'website',
    locale: 'ru_RU',
  }
};

// 2. СЕРВЕРНАЯ СТРАНИЦА (Быстрая загрузка, отличный LCP)
export default async function AllGuidesPage() {
  // Получаем всех активных гидов из базы, сортируем по полю order
  const rawGuides = await prisma.guide.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  // Парсим данные точно так же, как ты делал на главной странице
  const guides = rawGuides.map((guide) => ({
    id: String(guide.id),
    slug: guide.slug || "",
    name: guide.name,
    role: guide.role,
    image: guide.image,           
    actionImage: guide.actionImage, 
    bio: guide.bio, 
    fullBio: guide.fullBio,
    superpower: guide.superpower, 
    experience: guide.experience,
    achievements: guide.achievements || [],
    tags: guide.tags || [],
    quotes: guide.quotes || [],
    stats: guide.stats ? (typeof guide.stats === 'string' ? JSON.parse(guide.stats) : guide.stats) : [], 
    instagram: guide.instagram,
    telegram: guide.telegram,
    contact: guide.contact,       
    order: guide.order,
    isActive: guide.isActive
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30 overflow-hidden">
      
      {/* --- PREMIUM HERO SECTION --- */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-20 px-4">
        {/* Фоновые свечения */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-teal-500/10 md:blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl relative z-10 text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Users size={14} className="text-teal-400" />
             <span className="text-[12px] font-bold uppercase tracking-widest text-teal-400">
               Лица клуба
             </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6 animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both drop-shadow-xl">
            Команда <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Приключений</span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-400 font-medium max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            Наши гиды — это не просто проводники. Это люди, влюбленные в природу, с которыми безопасно, весело и душевно.
          </p>
        </div>
      </section>

      {/* --- СПИСОК ГИДОВ --- */}
      <section className="relative z-10 pb-24">
        {guides.length > 0 ? (
          // Переиспользуем твой компонент списка гидов!
          <GuidesList guides={guides} />
        ) : (
          <div className="text-center text-slate-500 py-20">
            Информация о команде обновляется...
          </div>
        )}
      </section>
      
    </main>
  );
}