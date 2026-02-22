import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';

// Импорты API
import { getBlogPosts } from '@/features/blog/api';
import { getTours } from '@/features/tours/api'; 
import { getReviews } from '@/features/reviews/actions'; // Или actions.ts, проверь путь

// Импорты компонентов
import Hero from '@/features/landing/components/Hero';
import Philosophy from '@/features/landing/components/Philosophy';
import ToursBrowser from '@/features/tours/components/ToursBrowser';

// Наши новые загруженные компоненты (пути могут отличаться, ставлю '@/components/...')
import GuidesList from '@/features/guides/components/GuidesList';
import SocialGrid from '@features/landing/components/SocialGrid'; 
import ReviewsMarquee from '@/features/reviews/components/ReviewsMarquee';
import BlogList from '@/features/blog/components/BlogSection';
import FunSectorWidget from '@/features/fun/components/FunSectorWidget';

export const revalidate = 60; 

export default async function Home() {
  // 1. Загрузка данных
  const [rawGuides, posts, tours, allReviews] = await Promise.all([
    prisma.guide.findMany({ orderBy: { createdAt: 'desc' } }),
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
    createdAt: r.createdAt.toISOString(), // Сериализуем дату для клиента
    avatar: r.avatar
  }));
  
  // ✅ Нормализуем гидов согласно новой схеме Prisma
const guides = rawGuides.map((guide) => ({
  id: String(guide.id),
  name: guide.name,
  role: guide.role,
  image: guide.image || "", 
  actionImage: guide.actionImage || "", 
  bio: guide.bio || "", 
  // Заменяем stats на наши новые поля:
  superpower: guide.superpower || "", 
  experience: guide.experience || "",
  achievements: guide.achievements || [], // Это массив строк
  instagram: guide.instagram,
  telegram: guide.telegram
}));

  return (
  <>
    {/* Header и PromoBlock уже в layout.tsx */}
    
    <Hero />
    
    <Suspense fallback={<div className="h-96 bg-slate-100 animate-pulse rounded-3xl container mx-auto mt-12" />}>
        <ToursBrowser 
    tours={tours} 
    limit={8} // 👈 Ограничиваем показ
    title="Афиша Приключений"
    subtitle="Популярные направления"
/>
    </Suspense>
    
    <Philosophy />
    
    <GuidesList guides={guides} />
    
    <SocialGrid />

    <ReviewsMarquee reviews={activeReviews} />
    
    {/* 👇 УБРАЛИ <section>, чтобы блог был на всю ширину (Full Bleed) */}
    <BlogList posts={posts} />
    <FunSectorWidget />
    
    {/* Footer уже в layout.tsx */}
  </>
)}