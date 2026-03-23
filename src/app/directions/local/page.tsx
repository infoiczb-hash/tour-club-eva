import React from 'react';
import { Metadata } from 'next';
import { getToursByCategory } from '@/features/tours/api';
import LocalProgram from '@/features/directions/local/LocalLanding';

export const revalidate = 3600; 

export const metadata: Metadata = {
  title: 'Маршруты по Приднестровью | Турклуб Эва',
  description: 'Куда поехать в Приднестровье? Однодневные программы по Приднестровью.',
  keywords: [
    'куда поехать Приднестровье',
    'север Приднестровья',
    'Рашков туристический',
    'Ягорлык природа',
    'Строенцы отдых',
    "Валя Адынкэ",
    'активный отдых в Приднестровье',
    "куда поехать на выходные Тирасполь",
    "маршрут Цыпово с гидом",
    "экскурсия Рашков Строенцы",
    "Ягорлык заповедник",
    "активный отдых Приднестровье",
    "Кицканский лес поход",
    "однодневный тур Тирасполь",
  ],
  alternates: {
    canonical: '/directions/local', 
  },
  openGraph: {
    title: 'Приключения в Приднестровье | Турклуб «Эва»',
    description: 'Куда поехать в Приднестровье: маршруты Цыпово, Рашков, Ягорлык, Строенцы, Валя Адынкэ. Однодневные и двухдневные программы.',
    url: 'https://evatur.club/directions/local',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', 
        width: 1200,
        height: 630,
        alt: 'Маршруты по Приднестровью с турклубом Эва',
      }
    ],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Приключения по Приднестровью | Турклуб Эва',
    description: 'Куда поехать на выходные: Цыпово, Рашков, Строенцы и Валя Адынкэ.',
    images: ['/og-default.jpg'],
  }
};

export default async function LocalPage() {
  const localTours = await getToursByCategory('local', 6);

  return (
    <main className="bg-slate-950 min-h-screen selection:bg-emerald-500/30">
      <LocalProgram tours={localTours} />
    </main>
  );
}