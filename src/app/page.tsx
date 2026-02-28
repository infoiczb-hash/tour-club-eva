import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next'; // 🔥 Добавили импорт для метаданных

// Импорты API
import { getBlogPosts } from '@/features/blog/api';
import { getTours } from '@/features/tours/api'; 
import { getReviews } from '@/features/reviews/actions';

// Импорты компонентов
import Hero from '@/features/landing/components/Hero';
import Philosophy from '@/features/landing/components/Philosophy';
import ToursBrowser from '@/features/tours/components/ToursBrowser';
import GuidesList from '@/features/guides/components/GuidesList';
import SocialGrid from '@/features/landing/components/SocialGrid'; // Исправил опечатку в пути
import ReviewsMarquee from '@/features/reviews/components/ReviewsMarquee';
import BlogList from '@/features/blog/components/BlogSection';
import FunSectorWidget from '@/features/fun/components/FunSectorWidget';

export const revalidate = 60; 

// 🔥 НАШИ НОВЫЕ СУПЕР-МЕТАДАННЫЕ ДЛЯ SEO
export const metadata: Metadata = {
  title: "Турклуб «Эва» — Сплавы, Походы и SUP в Приднестровье",
  description: "Турклуб «Эва» — активный отдых в Приднестровье каждые выходные. Сплавы на байдарках по Днестру, пешие походы в горы, SUP, детские программы. Тирасполь и Молдова.",
  keywords: [
    "турклуб Приднестровье", 
    "сплав по Днестру", 
    "байдарки Тирасполь", 
    "активный отдых Приднестровье", 
    "Let's Go на сплав", 
    "Хочу туда в Приднестровье и Румынии",
    "SUP Днестр"
  ],
  openGraph: {
    title: "Турклуб «Эва» — Приключения каждые выходные",
    description: "Сплавы, походы и SUP в Приднестровье и Молдове.",
    images: [
      { 
        url: "/og-default.jpg", 
        width: 1200, 
        height: 630,
        alt: "Турклуб Эва — сплавы и походы"
      }
    ]
  },
};

export default async function Home() {
  // 1. Загрузка данных
  const [rawGuides, posts, tours, allReviews] = await Promise.all([
    prisma.guide.findMany({ 
      where: { isActive: true }, // Сразу отсекаем скрытых гидов
      orderBy: { order: 'asc' }  // Сортируем по новому полю order (Основатели выше)
    }),
    getBlogPosts(),
    getTours(),
    getReviews(),
  ]);

  // 2. Подготовка данных
  // Фильтруем активные отзывы
  const activeReviews = allReviews.filter(r => r.isActive).map(r => ({
    id: r.id,
    name: r.name,
    text: r.text,
    source: r.source,
    category: r.category,
    createdAt: r.createdAt.toISOString(), 
    avatar: r.avatar
  }));
  
  // ✅ Нормализуем гидов согласно новой схеме Prisma
  const guides = rawGuides.map((guide) => ({
    id: String(guide.id),
    slug: guide.slug || "",
    name: guide.name,
    role: guide.role,
    image: guide.image,           // Отдаем как есть (string | null)
    actionImage: guide.actionImage, 
    bio: guide.bio, 
    fullBio: guide.fullBio,
    superpower: guide.superpower, 
    experience: guide.experience,
    achievements: guide.achievements || [],
    tags: guide.tags || [],
    quotes: guide.quotes || [],
    stats: guide.stats, 
    instagram: guide.instagram,
    telegram: guide.telegram,
    contact: guide.contact,       // 🔥 ДОБАВИЛИ ПРОПУЩЕННОЕ ПОЛЕ
    order: guide.order,
    isActive: guide.isActive
  }));

  return (
    <>
      {/* Header и PromoBlock уже в layout.tsx */}
      
      <Hero />
      
      <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl container mx-auto mt-12" />}>
        <ToursBrowser 
          tours={tours} 
          limit={8} 
          title="Афиша Приключений"
        />
      </Suspense>
      
      <Philosophy />
      
      {/* Передаем всех гидов со всеми полями */}
      <GuidesList guides={guides} />
      
      <SocialGrid />

      <ReviewsMarquee reviews={activeReviews} />
      
      {/* Блог на всю ширину (Full Bleed) */}
      <BlogList posts={posts} />
      
      <FunSectorWidget />
      
      {/* Footer уже в layout.tsx */}
    </>
  );
}