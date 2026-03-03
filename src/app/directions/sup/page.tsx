import React from 'react';
import { Metadata } from 'next';
import { getTours } from '@/features/tours/api';
import SupLandingClient from '@/features/directions/sup/SupLanding';

export const revalidate = 60; // Страница будет кэшироваться на 60 секунд

export const metadata: Metadata = {
  title: 'SUP-прогулки на Днестре — Приднестровье и Молдова | Турклуб «Эва»',
  description: 'SUP-прогулки по реке Днестр в Приднестровье. Обучение с нуля за 15 минут, йога на воде, рассветы и закаты на воде. Для новичков и продвинутых.',
  keywords: [
    'SUP Приднестровье',
    'сапборд Тирасполь',
    'SUP Днестр',
    'сплавы на SUP',
    'SUP йога Приднестровье'
  ],
  alternates: {
    canonical: '/directions/sup', // Защита от дублей
  },
  openGraph: {
    title: 'SUP-прогулки на Днестре — Приднестровье и Молдова | Турклуб «Эва»',
    description: 'SUP-прогулки по реке Днестр в Приднестровье. Обучение с нуля за 15 минут, йога на sup, рассветы и закаты на воде. Для новичков и продвинутых.',
    url: 'https://evatur.club/directions/sup',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg', // Красивая обложка в соцсетях
        width: 1200,
        height: 630,
        alt: 'SUP-прогулки по Днестру с турклубом Эва',
      }
    ],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SUP-прогулки на Днестре | Турклуб Эва',
    description: 'Обучение с нуля за 15 минут, рассветы и закаты на воде. Для новичков и продвинутых.',
    images: ['/og-default.jpg'],
  }
};

export default function SupPage() {
  return (
    <main className="bg-slate-950 min-h-screen">
      <SupLandingClient />
    </main>
  );
}