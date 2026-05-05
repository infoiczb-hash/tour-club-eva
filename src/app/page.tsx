// src/app/page.tsx
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma'; // Сохранил, хотя он не используется в компоненте
import { Metadata } from 'next';

//   ИЗМЕНЕНО: Импортируем только нужные функции
import { getBlogPreviews } from '@/features/blog/api'; // Облегченная версия
import { getReviews } from '@/features/reviews/actions';
import { getBlogCategoriesAction } from '@/features/admin/actions/categories';
import { getFunTestsAction } from '@/features/admin/actions/fun';
import { getGuidesForLanding } from '@/features/guides/api'; // Полные профили

import Hero from '@/features/landing/components/Hero';
import LazySocialGrid from '@/features/landing/components/LazySocialGrid';
import LazyFunSector from '@/features/fun/components/LazyFunSector';
import { TourSkeleton } from '@/features/tours/components/TourSkeleton';
import dynamic from 'next/dynamic';
import ToursBrowserWrapper from '@/components/ToursBrowserWrapper';

// (Динамические импорты Philosophy, BlogList, LazyGuidesList, LazyReviewsMarquee остаются без изменений)
const Philosophy = dynamic(() => import('@/features/landing/components/Philosophy'), {
  loading: () => <section className="min-h-[600px] bg-slate-950 w-full" />,
});

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
  alternates: { canonical: '/' },
  openGraph: {
    title: "Турклуб «Эва» — Приключения каждые выходные",
    description: "Сплавы, походы и SUP в Приднестровье и Молдове.",
    url: "https://evatur.club",
    siteName: "Турклуб «Эва»",
    locale: "ru_RU",
    type: "website",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Турклуб Эва — сплавы и походы" }]
  },
  twitter: {
    card: 'summary_large_image',
    title: "Турклуб «Эва» — Активный отдых",
    description: "Сплавы, походы и SUP в Приднестровье и Молдове.",
    images: ["/og-default.jpg"],
  }
};

/**
 *   ВЫНЕСЕНО В ОТДЕЛЬНЫЙ КОМПОНЕНТ ДЛЯ STREAMING
 * Это позволяет Hero отрисоваться мгновенно, не дожидаясь этих тяжелых запросов.
 */
async function DeferredLandingContent() {
  const [guides, posts, fetchedReviews, bCatRes, funRes] = await Promise.all([
    getGuidesForLanding(),
    getBlogPreviews(),
    getReviews(true),
    getBlogCategoriesAction(),
    getFunTestsAction(),
  ]);

  const blogCategories = bCatRes.success ? bCatRes.data : [];
  const activeTests = funRes?.success && funRes.data ? funRes.data.filter(t => t.isActive) : [];

  //   ИСПРАВЛЕНО: Обработка отзывов (ISO строки для дат обязательны для клиентских компонентов)
  const limitedReviews = fetchedReviews
    .slice(0, 12) // Ограничение для производительности DOM
    .map(r => ({
      id: r.id,
      name: r.name,
      text: r.text,
      source: r.source,
      category: r.category,
      createdAt: r.createdAt.toISOString(), 
      avatar: r.avatar
  }));

  return (
    <>
      <LazyGuidesList guides={guides} /> 
      <LazySocialGrid />
      <LazyReviewsMarquee reviews={limitedReviews} />
      <BlogList posts={posts} categories={blogCategories} />
      <LazyFunSector activeTests={activeTests} />
    </>
  );
}

export default function Home() {
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
      <script
        type="application/ld+json"
        //   ИСПРАВЛЕНО
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c') 
        }}
      />

      {/*   LCP ЭЛЕМЕНТ: Рендерится сразу! */}
      <Hero />
      
      <Suspense fallback={<TourSkeleton />}>
        <ToursBrowserWrapper limit={8} title="Афиша Приключений" />
      </Suspense>
      
      <Philosophy />

      {/*   ВСЁ ОСТАЛЬНОЕ: Подгружается стримингом (Suspense) */}
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-teal-500 animate-pulse font-bold uppercase tracking-widest">Собираем рюкзак...</div>}>
        <DeferredLandingContent />
      </Suspense>
    </>
  );
}