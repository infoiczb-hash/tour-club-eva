import React from 'react';
import { Metadata } from 'next';
import { getToursByCategory } from '@/features/tours/api';
import KayakingLanding from '@/features/directions/kayaking/KayakingLanding';

export const revalidate = 3600; 

export const metadata: Metadata = {
  title: 'Сплав на байдарках по Днестру в Приднестровье | Турклуб «Эва»',
  description: 'Сплавы по Днестру каждые выходные. Для новичков, команд, семей с детьми.',
  keywords: [
    'сплав байдарки Днестр',
    'сплав байдарки Тирасполь',
    'байдарки Днестр Приднестровье',
    'каяки Приднестровье',
    'водный поход Тирасполь',
    'байдарки Молдова',
    'сплав по Днестру цена',
    'сплав с детьми Днестр',
    'водный поход выходные',
    'сплав для начинающих Днестр',
  ],
  alternates: {
    canonical: '/directions/kayaking', 
  },
  openGraph: {
    title: 'Сплав на байдарках по Днестру | Турклуб «Эва»',
    description: 'Маршруты по Днестру для новичков и семей и для команд',
    url: 'https://evatur.club/directions/kayaking',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', 
        width: 1200,
        height: 630,
        alt: 'Сплав на байдарках по Днестру с турклубом Эва',
      }
    ],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Сплав на байдарках по Днестру | Турклуб Эва',
    description: 'Маршруты по Днестру для новичков и семей и для команд',
    images: ['/og-default.jpg'],
  }
};

// ✅ ВОЗВРАЩЕН async ДЛЯ СЕРВЕРНОГО КОМПОНЕНТА
export default async function KayakingLandingPage() {
  const kayakingTours = await getToursByCategory('kayaking', 6);

  return (
    <main>
      <KayakingLanding tours={kayakingTours} />
    </main>
  );
}