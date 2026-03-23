import React from 'react';
import { Metadata } from 'next';
import { getToursByCategory } from '@/features/tours/api';
import HikesLanding from '@/features/directions/hiking/HikesLanding';

export const revalidate = 3600; 

export const metadata: Metadata = {
  title: 'Приключенческие туры в горы из Приднестровья и Молдовы | Турклуб «Эва»',
  description: 'Многодневные треки в горы Румынии и не только с гидами. Маршруты для начинающих и опытных.Выезды из Тирасполя/Кишинев. Группы 6–20 человек.',
  keywords: [
    'Туры в румынию',
    'поход в горы из Тирасполя',
    'поход в горы из Кишинева',
    'горные маршруты Румыния',
    'горы и хайкинг для новичков',
    'турпоходы Румыния',
    'пеший тур горы с гидом',
    'lets go в Румынию',
    'хочу туда в Румынию'
  ],
  alternates: {
    canonical: '/directions/hiking', 
  },
  openGraph: {
    title: 'Приключенческие туры в горы из Приднестровья и Молдовы | Турклуб «Эва»',
    description: 'Туры с гидами. Многодневные в горы Румынии. Для начинающих и опытных туристов.',
    url: 'https://evatur.club/directions/hiking',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', 
        width: 1200,
        height: 630,
        alt: 'Пешие походы и экспедиции с турклубом Эва',
      }
    ],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Туры в горы | Эва',
    description: 'Пешие и горные походы с гидами. Маршруты для начинающих и опытных.',
    images: ['/og-default.jpg'],
  }
};

// ✅ ВОЗВРАЩЕН async ДЛЯ СЕРВЕРНОГО КОМПОНЕНТА
export default async function HikingPage() {
  const hikingTours = await getToursByCategory('hiking', 6);
  
  return (
      <HikesLanding tours={hikingTours} />
  );
}
