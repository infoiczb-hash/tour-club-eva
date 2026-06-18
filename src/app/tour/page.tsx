import { Metadata } from 'next';
import { Suspense } from 'react';
import ToursBrowserWrapper from '@/components/ToursBrowserWrapper';
import { TourSkeleton } from '@/features/tours/components/TourSkeleton';

/**
 * Страница каталога всех туров.
 * Использует ISR (Incremental Static Regeneration).
 * Страница пересобирается в фоне раз в час, обеспечивая мгновенную загрузку для SEO.
 */
export const revalidate = 3600; 

// 🔥 СУПЕР-SEO ДЛЯ КАТАЛОГА ТУРОВ (Приднестровье/Молдова)
export const metadata: Metadata = {
  title: 'Расписание Туров 2026 — Сплавы, ТУРЫ и SUP | Турклуб «Эва»',
  description: 'Афиша приключений 2026. Сплавы по Днестру, горные походы, SUP, местная и детская программа.  Бронируй место на ближайший тур.',
  openGraph: {
    title: 'Туры и Походы в Приднестровье 2026 — Расписание | Турклуб «Эва»',
    description: 'Расписание туров 2026: сплавы на байдарках по Днестру, пешие походы, SUP и детские программы. Активный отдых в Приднестровье и Молдове каждые выходные.',
    url: 'https://evatur.club/tour',
    siteName: 'Турклуб Эва',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Расписание туров Турклуба Эва'
      }
    ]
  },
  // ИСПРАВЛЕНО: Абсолютный путь для канонического URL
  alternates: {
    canonical: 'https://evatur.club/tour',
  }
};

export default async function AllToursPage() {
  return (
    <main 
      className="pt-24 pb-8 md:pt-32 md:pb-24 bg-slate-950 min-h-screen relative overflow-hidden" 
      id="tours"
    >
         <Suspense fallback={<TourSkeleton />}>
        <ToursBrowserWrapper
          title="Все Приключения"
          subtitle="Полный каталог 2026"
        />
      </Suspense>
    </main>
  );
}