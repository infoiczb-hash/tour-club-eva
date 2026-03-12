// src/app/active-rest/page.tsx
// Роль: SEO-хаб «Куда поехать в Приднестровье»
// Архитектура: Server Component (metadata + schema.org) + Client UI

import { Metadata } from 'next';
import { getTours } from '@/features/tours/api';
import ActiveRestClient from './ActiveRestClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.evatur.club';

// ─── METADATA ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Куда поехать в Приднестровье — активный отдых, маршруты, туры | Турклуб «Эва»',
  description:
    'Всё о туризме в Приднестровье: сплавы по Днестру, пешие маршруты, SUP, детские лагеря. Рашков, Цыпово, Строенцы, Ягорлык. Организуем туры из Тирасполя.',
  keywords: [
    'куда поехать в Приднестровье',
    'туризм в Приднестровье',
    'отдых в Приднестровье',
    'активный отдых Тирасполь',
    'маршруты Днестр',
    'сплавы Приднестровье',
    'достопримечательности Приднестровья',
    'что посмотреть в Приднестровье',
    'пешие маршруты ПМР',
    'байдарки Днестр',
  ],
  alternates: { canonical: `${BASE_URL}/active-rest` },
  openGraph: {
    title: 'Куда поехать в Приднестровье | Турклуб «Эва»',
    description:
      'Рашков, Цыпово, Строенцы, заповедник Ягорлык — активный отдых и природные маршруты по ПМР.',
    url: `${BASE_URL}/active-rest`,
    siteName: 'Турклуб «Эва»',
    images: [{ url: `${BASE_URL}/images/og-active-rest.jpg`, width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Куда поехать в Приднестровье | Турклуб «Эва»',
    images: [`${BASE_URL}/images/og-active-rest.jpg`],
  },
};

// ─── SCHEMA.ORG ──────────────────────────────────────────────────────────────
const destinationSchema = {
  '@context': 'https://schema.org',
  '@type': 'TouristDestination',
  name: 'Приднестровье — туризм и активный отдых',
  description:
    'Регион вдоль реки Днестр: каньоны, пещерные монастыри, заповедники, дикие пляжи. Байдарки, SUP, пешие маршруты, детские лагеря.',
  url: `${BASE_URL}/active-rest`,
  image: `${BASE_URL}/images/og-active-rest.jpg`,
  touristType: ['Экотуризм', 'Водный туризм', 'Семейный отдых', 'Активный туризм', 'Культурный туризм'],
  geo: { '@type': 'GeoCoordinates', latitude: 46.8403, longitude: 29.6433 },
  address: { '@type': 'PostalAddress', addressRegion: 'Приднестровье', addressCountry: 'MD' },
  includesAttraction: [
    { '@type': 'TouristAttraction', name: 'Река Днестр — сплавы на байдарках', url: `${BASE_URL}/directions/kayaking` },
    { '@type': 'TouristAttraction', name: 'Рашков — старейшее село, скалы и гроты', url: `${BASE_URL}/directions/hiking` },
    { '@type': 'TouristAttraction', name: 'Цыпово — пещерный монастырь', url: `${BASE_URL}/directions/hiking` },
    { '@type': 'TouristAttraction', name: 'Строенцы — Башня ветров и водопады', url: `${BASE_URL}/directions/hiking` },
    { '@type': 'TouristAttraction', name: 'Заповедник Ягорлык', url: `${BASE_URL}/directions/local` },
    { '@type': 'TouristAttraction', name: 'Турунчук — рукав Днестра', url: `${BASE_URL}/directions/kayaking` },
  ],
  provider: { '@type': 'TravelAgency', name: 'Турклуб «Эва»', url: BASE_URL },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Куда поехать в Приднестровье', item: `${BASE_URL}/active-rest` },
  ],
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export const revalidate = 60;

export default async function ActiveRestPage() {
  const allTours = await getTours();
  const upcomingTours = allTours
    .filter((t) => t.date && new Date(t.date) >= new Date())
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(destinationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ActiveRestClient tours={upcomingTours} />
    </main>
  );
}
