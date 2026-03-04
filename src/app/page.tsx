import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

// Оставляем статичными блоки с высокой SEO-ценностью (первый экран и текст)
import { getBlogPosts } from '@/features/blog/api';
import { getTours } from '@/features/tours/api'; 
import { getReviews } from '@/features/reviews/actions';

import Hero from '@/features/landing/components/Hero';
import Philosophy from '@/features/landing/components/Philosophy';
import BlogList from '@/features/blog/components/BlogSection';
import LazySocialGrid from '@/features/landing/components/LazySocialGrid';
import LazyFunSector from '@/features/fun/components/LazyFunSector';
import { TourSkeleton } from '@/features/tours/components/TourSkeleton';
import dynamic from 'next/dynamic';

const ToursBrowser = dynamic(() => import('@/features/tours/components/ToursBrowser'), {
  ssr: false,
});

const LazyGuidesList = dynamic(() => import('@/features/guides/components/GuidesList'), {
  loading: () => <section className="min-h-[400px] w-full bg-slate-50 dark:bg-slate-950 animate-pulse" />
});

const LazyReviewsMarquee = dynamic(() => import('@/features/reviews/components/ReviewsMarquee'), {
  loading: () => <section className="min-h-[300px] w-full bg-slate-50 dark:bg-slate-950 animate-pulse" />
});

export const revalidate = 60; 

export const metadata: Metadata = {
  title: "Турклуб «Эва» — Активный отдых в Приднестровье",
  description: "Сплавы по Днестру, походы в Карпаты, SUP и детские лагеря. Туры с гидами из Тирасполя. Расписание 2026 — смотри сейчас.",
  keywords: [
  "турклуб Приднестровье",
  "активный отдых Тирасполь",
  "сплав на байдарках Днестр",
  "поход выходного дня Тирасполь",
  "туризм Приднестровье",
  "отдых на природе Молдова",
  "туры с гидом Тирасполь",
  "SUP Днестр",

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
  const [rawGuides, posts, tours, allReviews] = await Promise.all([
    prisma.guide.findMany({ 
      where: { isActive: true },
      orderBy: { order: 'asc' } 
    }),
    getBlogPosts(),
    getTours(),
    getReviews(),
  ]);

  const activeReviews = allReviews.filter(r => r.isActive).map(r => ({
    id: r.id,
    name: r.name,
    text: r.text,
    source: r.source,
    category: r.category,
    createdAt: r.createdAt.toISOString(), 
    avatar: r.avatar
  }));
  
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
    stats: guide.stats, 
    instagram: guide.instagram,
    telegram: guide.telegram,
    contact: guide.contact,       
    order: guide.order,
    isActive: guide.isActive
  }));

  return (
    <>
      <Hero />
      
      <Suspense fallback={<TourSkeleton />}>
        <ToursBrowser tours={tours} limit={8} title="Афиша Приключений" />
      </Suspense>
      
      <Philosophy />
      <LazyGuidesList guides={guides} />
      
      {/* Ленивая загрузка видео-сетки */}
      <LazySocialGrid />

    <LazyReviewsMarquee reviews={activeReviews} />
      <BlogList posts={posts} />
      
      {/* Ленивая загрузка виджетов Фан-сектора */}
      <LazyFunSector />
    </>
  );
}