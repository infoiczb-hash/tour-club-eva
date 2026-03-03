import React from 'react';
import { Metadata } from 'next';
import KidsLandingClient from '@/features/directions/kids/KidsLanding'

export const revalidate = 60; // Страница будет кэшироваться на 60 секунд

export const metadata: Metadata = {
  title: 'Детские и подростковые приключения в Приднестровье | Junior Академия «Эва»',
  description: 'Детские  и подростковые туристические программы в Приднестровье для детей 8–16 лет. Безопасно, без гаджетов. Тирасполь.',
  keywords: [
    'детские походы Приднестровье',
    'детский лагерь Тирасполь',
    'школьные каникулы Приднестровье',
    'туризм для детей и подростков',
    'куда отправить детей на каникулы в Приднестровье',
    'SUP и сплавы на байдарках для подростков',
    'Junior Академия Эва'
  ],
  alternates: {
    canonical: '/directions/kids', // Защита от дублей
  },
  openGraph: {
    title: 'Детские и подростковые приключения в Приднестровье | Junior Академия',
    description: 'Детские туристические программы в Приднестровье для детей 8–16 лет. Безопасно, без гаджетов. Тирасполь.',
    url: 'https://evatur.club/directions/kids',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', // Надежный фолбэк вместо несуществующей картинки
        width: 1200,
        height: 630,
        alt: 'Детские походы и лагеря в Приднестровье',
      }
    ],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Детские и подростковые приключения в Приднестровье| Junior Академия',
    description: 'Детские туристические программы. Безопасно, без гаджетов. Тирасполь.',
    images: ['/og-default.jpg'],
  }
};

export default function KidsPage() {
  return (
    <main className="bg-slate-950 min-h-screen selection:bg-amber-500/30">
      <KidsLandingClient />
    </main>
  );
}