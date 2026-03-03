import React from 'react';
import { Metadata } from 'next';
// Закомментировали запрос к БД, пока не разберемся с зависанием
// import { getTours } from '@/features/tours/api'; 
import HikesLanding from '@/features/directions/hiking/HikesLanding';

export const revalidate = 60; // Страница будет кэшироваться на 60 секунд

export const metadata: Metadata = {
  title: 'Приключенческие туры в горы из Приднестровья и Молдовы | Турклуб «Эва»',
  description: 'Туры с гидами. Многодневные в горы Румынии. Для начинающих и опытных туристов.',
  keywords: [
    'Туры в румынию',
    'горные маршруты Румыния',
    'горы и хайкинг для новичков',
    'турпоходы Румыния',
     'lets go в Румынию',
    'хочу туда в Румынию'
  ],
  alternates: {
    canonical: '/directions/hiking', // Защита от дублей
  },
  openGraph: {
    title: 'Приключенческие туры в горы из Приднестровья и Молдовы | Турклуб «Эва»',
    description: 'Туры с гидами. Многодневные в горы Румынии. Для начинающих и опытных туристов.',
    url: 'https://evatur.club/directions/hiking',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', // Подтянется обложка
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

// УБРАЛИ async! Это теперь обычный синхронный компонент
export default function HikingPage() {
  
  // Когда почините запрос к БД, раскомментируйте getTours, 
  // верните async функции и передайте const tours = await getTours()
  
  return (
      <HikesLanding tours={[]} />
  );
}