// src/app/active-rest/page.tsx
// Роль: SEO-хаб «Путеводитель по Приднестровью»
// Архитектура: Server Component (metadata + schema.org) + Client UI

import { Metadata } from 'next';
import ActiveRestClient from './ActiveRestClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.evatur.club';

// ─── METADATA ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Путеводитель по Приднестровью — маршруты, места, практическая информация',
  description:
    'Полный гид по Приднестровью: Тирасполь, Рашков, Цыпово, Строенцы, заповедник Ягорлык. Въезд без визы, советская архитектура, дикий Днестр. Для местных и иностранных туристов.',
  keywords: [
    'Приднестровье туризм',
    'что посмотреть в Приднестровье',
    'путеводитель Приднестровье',
    'Тирасполь достопримечательности',
    'Transnistria travel guide',
    'маршруты по ПМР',
    'Рашков Цыпово Строенцы',
    'заповедник Ягорлык',
    'Днестр байдарки пешие маршруты',
    'туризм ПМР иностранцы',
  ],
  alternates: { canonical: `${BASE_URL}/active-rest` },
  openGraph: {
    title: 'Путеводитель по Приднестровью — места, маршруты, практическая информация',
    description:
      'Тирасполь, Рашков, Цыпово, Строенцы, заповедник Ягорлык — всё о туризме в ПМР. Без визы. Для местных и иностранных туристов.',
    url: `${BASE_URL}/active-rest`,
    siteName: 'Турклуб «Эва»',
    images: [{ url: `${BASE_URL}/images/og-active-rest.jpg`, width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Путеводитель по Приднестровью',
    images: [`${BASE_URL}/images/og-active-rest.jpg`],
  },
};

// ─── SCHEMA.ORG ──────────────────────────────────────────────────────────────
const destinationSchema = {
  '@context': 'https://schema.org',
  '@type': 'TouristDestination',
  name: 'Приднестровье — путеводитель для туристов',
  description:
    'Непризнанное государство вдоль реки Днестр: советская архитектура, пещерные монастыри, каньоны, дикие пляжи. Въезд без визы.',
  url: `${BASE_URL}/active-rest`,
  image: `${BASE_URL}/images/og-active-rest.jpg`,
  touristType: ['Экотуризм', 'Водный туризм', 'Семейный отдых', 'Активный туризм', 'Культурный туризм', 'Исторический туризм'],
  geo: { '@type': 'GeoCoordinates', latitude: 46.8403, longitude: 29.6433 },
  address: { '@type': 'PostalAddress', addressRegion: 'Приднестровье', addressCountry: 'MD' },
  includesAttraction: [
    { '@type': 'TouristAttraction', name: 'Тирасполь — столица ПМР', url: `${BASE_URL}/active-rest` },
    { '@type': 'TouristAttraction', name: 'Бендерская крепость (1538)', url: `${BASE_URL}/directions/local` },
    { '@type': 'TouristAttraction', name: 'Рашков — старейшее село ПМР', url: `${BASE_URL}/directions/hiking` },
    { '@type': 'TouristAttraction', name: 'Цыпово — пещерный монастырь XII века', url: `${BASE_URL}/directions/hiking` },
    { '@type': 'TouristAttraction', name: 'Строенцы — Башня ветров и 9 источников', url: `${BASE_URL}/directions/hiking` },
    { '@type': 'TouristAttraction', name: 'Заповедник Ягорлык', url: `${BASE_URL}/directions/local` },
    { '@type': 'TouristAttraction', name: 'Турунчук — рукав Днестра', url: `${BASE_URL}/directions/kayaking` },
    { '@type': 'TouristAttraction', name: 'Завод КВИНТ — коньяки с 1897 года', url: `${BASE_URL}/directions/local` },
  ],
  provider: { '@type': 'TravelAgency', name: 'Турклуб «Эва»', url: BASE_URL },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Путеводитель по Приднестровью', item: `${BASE_URL}/active-rest` },
  ],
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export const revalidate = 3600;

export default function ActiveRestPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(destinationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ActiveRestClient />
    </main>
  );
}
