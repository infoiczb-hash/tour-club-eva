import React from 'react';
import { Metadata } from 'next';
import OrganizersLanding from '@/features/directions/organizers/OrganizersLanding';

export const revalidate = 3600; // Страница будет кэшироваться на 60 секунд

export const metadata: Metadata = {
  title: 'Тимбилдинг и Корпоративный отдых в Приднестровье',
  description: 'Корпоративные выезды на природу в Приднестровье. Сплавы, верёвочные курсы, ретриты. Группы от 10 чел.',
  keywords: [
    'корпоративный отдых Приднестровье',
    'тимбилдинг Тирасполь',
    'ретрит Молдова',
    'корпоратив на природе',
    'групповые туры Приднестровье'
  ],
  alternates: {
    canonical: '/directions/organizers', // Защита от дублей в поиске
  },
  openGraph: {
    title: 'Корпоративный Отдых и Тимбилдинг в Приднестровье | Турклуб «Эва»',
    description: 'Организация корпоративных выездов и тимбилдинга в Приднестровье и Молдове. Сплавы, походы, ретриты, стратегические сессии на природе. ',
    url: 'https://evatur.club/directions/organizers',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', // Обложка для репостов в Telegram/Viber
        width: 1200,
        height: 630,
        alt: 'Корпоративный отдых с турклубом Эва',
      }
    ],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Корпоративный Отдых и Тимбилдинг | Турклуб Эва',
    description: 'Организация корпоративных выездов в Приднестровье и Молдове.',
    images: ['/og-default.jpg'],
  }
};

export default function OrganizersPage() {
  // Просто возвращаем компонент. Тег <main> и классы фона уже зашиты внутри него.
  return <OrganizersLanding />;
}