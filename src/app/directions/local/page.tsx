import React from 'react';
import { Metadata } from 'next';
import { getTours } from '@/features/tours/api'; // Проверьте путь к вашему API
import LocalProgram from '@/features/directions/local/LocalLanding';

export const revalidate = 60; // Страница будет кэшироваться на 60 секунд

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
    canonical: '/directions/local', // Защита от дублей
  },
  openGraph: {
    title: 'Приключения в Приднестровье | Турклуб «Эва»',
    description: 'Куда поехать в Приднестровье: маршруты Цыпово, Рашков, Ягорлык, Строенцы, Валя Адынкэ. Однодневные и двухдневные программы.',
    url: 'https://evatur.club/directions/local',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', // Подтянется красивая обложка при репосте
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
  // 1. Получаем все туры
  const allTours = await getTours();

  // 2. Фильтруем: Ищем тег "local", "moldova" или категорию
  // Логику фильтрации можно адаптировать под вашу базу данных
  const localTours = allTours.filter(tour => 
    tour.type === 'hiking' || // Часто локальные - это хайкинг
    tour.title.toLowerCase().includes('молдова') ||
    tour.title.toLowerCase().includes('днестр') ||
    tour.title.toLowerCase().includes('строенцы')
  );

  return (
    <main className="bg-slate-950 min-h-screen selection:bg-emerald-500/30">
      <LocalProgram tours={localTours} />
    </main>
  );
}