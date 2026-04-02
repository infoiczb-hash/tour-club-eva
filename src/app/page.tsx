// src/app/page.tsx
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

// Оставляем статичными блоки с высокой SEO-ценностью (первый экран и текст)
import { getBlogPosts } from '@/features/blog/api';
import { getReviews } from '@/features/reviews/actions';
// ✅ ДОБАВИЛИ ИМПОРТ КАТЕГОРИЙ БЛОГА
import { getTourCategoriesAction, getBlogCategoriesAction } from '@/features/admin/actions/categories';
// ✅ ДОБАВЛЕНО: Экшен для тестов (чтобы убрать Waterfall-фетч с клиента)
import { getFunTestsAction } from '@/features/admin/actions/fun';
import { getGuidesForLanding } from '@/features/guides/api';

import Hero from '@/features/landing/components/Hero';
import LazySocialGrid from '@/features/landing/components/LazySocialGrid';
import LazyFunSector from '@/features/fun/components/LazyFunSector';
import { TourSkeleton } from '@/features/tours/components/TourSkeleton';
import dynamic from 'next/dynamic';
import ToursBrowserWrapper from '@/components/ToursBrowserWrapper';

// ✅ Philosophy — клиентский компонент с drag-логикой и 6 изображениями,
// не в первом экране — грузим лениво, скелетон цвет совпадает с фоном (нет CLS)
const Philosophy = dynamic(() => import('@/features/landing/components/Philosophy'), {
  loading: () => <section className="min-h-[600px] bg-slate-950 w-full" />,
});

// ✅ BlogList — клиентский компонент с фильтрацией и useState,
// стоит в конце страницы — грузим лениво
const BlogList = dynamic(() => import('@/features/blog/components/BlogSection'), {
  loading: () => <section className="min-h-[500px] bg-slate-50 w-full animate-pulse" />,
});

const LazyGuidesList = dynamic(() => import('@/features/guides/components/GuidesList'), {
  loading: () => <section className="min-h-[400px] w-full bg-slate-50 dark:bg-slate-950 animate-pulse" />
});

const LazyReviewsMarquee = dynamic(() => import('@/features/reviews/components/ReviewsMarquee'), {
  loading: () => <section className="min-h-[300px] w-full bg-slate-50 dark:bg-slate-950 animate-pulse" />
});

export const revalidate = 3600; 

export const metadata: Metadata = {
  title: "Турклуб «Эва» — Активный отдых в Приднестровье",
  description: "Сплавы по Днестру, туры в горы, SUP. Приключения в Приднестровье и Молдове.",
  // ❌ УДАЛЕНО: keywords (Google их игнорирует, код стал чище)
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Турклуб «Эва» — Приключения каждые выходные",
    description: "Сплавы, походы и SUP в Приднестровье и Молдове.",
    url: "https://evatur.club",
    siteName: "Турклуб «Эва»",
    locale: "ru_RU",
    type: "website",
    images: [
      { 
        url: "/og-default.jpg", 
        width: 1200, 
        height: 630,
        alt: "Турклуб Эва — сплавы и походы"
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: "Турклуб «Эва» — Активный отдых",
    description: "Сплавы, походы и SUP в Приднестровье и Молдове.",
    images: ["/og-default.jpg"],
  }
};

export default async function Home() {
  // ✅ ДОБАВИЛИ ЗАПРОС КАТЕГОРИЙ БЛОГА В PROMISE.ALL
const [guides, posts, allReviews, bCatRes, funRes] = await Promise.all([
    getGuidesForLanding(),
    getBlogPosts(),
    getReviews(),
    getBlogCategoriesAction(),
    getFunTestsAction(),
  ]);

  // ✅ ИЗВЛЕКАЕМ КАТЕГОРИИ БЛОГА
  const blogCategories = bCatRes.success ? bCatRes.data : [];
  const activeTests = funRes?.success && funRes.data ? funRes.data.filter(t => t.isActive) : [];

  const activeReviews = allReviews
    .filter(r => r.isActive)
    .slice(0, 12) // ✅ ИСПРАВЛЕНО: Ограничили до 12 отзывов для спасения DOM и снижения TBT
    .map(r => ({
      id: r.id,
      name: r.name,
      text: r.text,
      source: r.source,
      category: r.category,
      createdAt: r.createdAt.toISOString(), 
      avatar: r.avatar
  }));
  
  // ✅ ДОБАВЛЕНО: Микроразметка WebSite + SearchAction для Google
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Турклуб «Эва»',
    'url': process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club'}/tour?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
      {/* ✅ ДОБАВЛЕНО: Инжектим JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <Hero />
       <Suspense fallback={<TourSkeleton />}>
        <ToursBrowserWrapper limit={8} title="Афиша Приключений" />
      </Suspense>
      
      <Philosophy />
      <LazyGuidesList guides={guides} /> 
      
      <LazySocialGrid />

      <LazyReviewsMarquee reviews={activeReviews} />
      
      {/* ✅ ПЕРЕДАЕМ КАТЕГОРИИ В БЛОГ */}
      <BlogList posts={posts} categories={blogCategories} />
      
      {/* ✅ ПЕРЕДАЕМ ТЕСТЫ С СЕРВЕРА */}
      <LazyFunSector activeTests={activeTests} />
    </>
  );
}