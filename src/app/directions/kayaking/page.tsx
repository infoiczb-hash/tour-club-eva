import React from 'react';
import { Metadata } from 'next';
// Закомментировали запрос к БД, пока не разберемся с зависанием
// import { getTours } from '@/features/tours/api'; 
import KayakingLanding from '@/features/directions/kayaking/KayakingLanding';

export const revalidate = 60; // Страница будет кэшироваться на 60 секунд
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
    canonical: '/directions/kayaking', // Защита от дублей
  },
  openGraph: {
    title: 'Сплав на байдарках по Днестру | Турклуб «Эва»',
    description: 'Маршруты по Днестру для новичков и семей и для команд',
    url: 'https://evatur.club/directions/kayaking',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', // Надежный фолбэк для соцсетей
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

// УБРАЛИ async! Это теперь обычный синхронный компонент
export default function KayakingLandingPage() {
  return (
    <main>
      {/* Передаем пустой массив, чтобы ничего не ломалось */}
      <KayakingLanding tours={[]} />
    </main>
  );
}