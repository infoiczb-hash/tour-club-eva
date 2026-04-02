import React from 'react';
import { Metadata, Viewport } from 'next';
import SupLanding from '@/features/directions/sup/SupLanding';

export const revalidate = 3600; // Страница будет кэшироваться на 1 час

export const viewport: Viewport = {
  themeColor: '#020817',
};

export const metadata: Metadata = {
  title: 'SUP-прогулки на Днестре| Турклуб «Эва»',
  description: 'SUP-прогулки по реке Днестр Приднестровье. Обучение с нуля за 15 минут. Для новичков и продвинутых.',
  keywords: [
    'SUP Приднестровье',
    "SUP Днестр Тирасполь",
    'сапборд Тирасполь',
    "SUP прогулка для начинающих",
    'SUP Днестр',
    'сплавы на SUP',
    'SUP йога Приднестровье',
    "рассвет SUP Тирасполь",
    "Обучение детей и подростков SUP",
  ],
  alternates: {
    canonical: '/directions/sup',
  },
  openGraph: {
    title: 'SUP-прогулки на Днестре — Приднестровье и Молдова | Турклуб «Эва»',
    description: 'SUP-прогулки по реке Днестр в Приднестровье. Обучение с нуля за 15 минут, йога на sup, рассветы и закаты на воде. Для новичков и продвинутых.',
    url: 'https://evatur.club/directions/sup',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg',
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
      {/* Идеальный preload — 100% cache-hit с Cloudinary */}
      <link
        rel="preload"
        as="image"
        href="https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_75,w_828/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg"
        fetchPriority="high"
        imageSrcSet="https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_75,w_640/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg 640w, https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_75,w_1080/v1771609707/photo_2026-02-20_15-28-30_nuci5x.jpg 1080w"
        imageSizes="100vw"
      />
      <SupLanding />
    </main>
  );
}