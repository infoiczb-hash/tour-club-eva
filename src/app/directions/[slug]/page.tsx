// src/app/directions/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// --- УНИВЕРСАЛЬНЫЙ ДВИЖОК (Фолбэк) ---
import { getDirectionBySlug } from '@/data/directionsData';
import DirectionHero from '@/components/directions/DirectionHero';
import DirectionBento from '@/components/directions/DirectionBento';
import DirectionShowcase from '@/components/directions/DirectionShowcase';
import DirectionLeadMagnet from '@/components/directions/DirectionLeadMagnet';

import { TourPreview } from '@/features/tours/types';
import { getToursByCategory } from '@/features/tours/api';
import dynamic from 'next/dynamic';

// --- VIP-НАПРАВЛЕНИЯ (Ленивая загрузка) ---
const KayakingLanding = dynamic(() => import('@/features/directions/kayaking/KayakingLanding'));
const SupLanding = dynamic(() => import('@/features/directions/sup/SupLanding'));
const KidsLanding = dynamic(() => import('@/features/directions/kids/KidsLanding'));
const LocalLanding = dynamic(() => import('@/features/directions/local/LocalLanding'));
const OrganizersLanding = dynamic(() => import('@/features/directions/organizers/OrganizersLanding'));
const HikesLanding = dynamic(() => import('@/features/directions/hiking/HikesLanding'));

// ==========================================
// SEO: РАСШИРЕННЫЙ КОНФИГ НАПРАВЛЕНИЙ
// ==========================================

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evatur.club";

type DirectionMetaType = {
  tripName: string;
  title: string;
  description: string;
  touristType: string[];
  place: string;
  price: string;
  breadcrumbName: string;
  keywords: string[]; // НОВОЕ: Строгая типизация семантического ядра
  ogImage?: string;
  twitterTitle?: string;
  twitterDesc?: string;
};

// ИНТЕГРАЦИЯ ЛОКАЛЬНОГО СЕМАНТИЧЕСКОГО ЯДРА (ПМР/Молдова)
const DIRECTION_META: Record<string, DirectionMetaType> = {
  hiking: {
    tripName: "Туры в горы",
    title: "Горные походы и треккинг в Румынию и не только | Турклуб Эва",
    description: "Пешие походы Приднестровье, Молдовы. Карпаты, Буковина, нацпарки и в горы Румынии. Маршруты для любого уровня. Группы из Тирасполя и Кишинёва.",
    touristType: ["Hiking tourism", "Ecotourism"],
    place: "Приднестровье и мир",
    price: "100",
    breadcrumbName: "Горные туры",
    keywords: ["поход в горы Румыния", "треккинг в горы  из Молдовы", "горный поход из Тирасполя", "тур в Карпаты из Тирасполя", "поход выходного дня Молдова и Приднестровье"],
    ogImage: "/og-default.jpg",
    twitterTitle: "Горные походы | Эва",
    twitterDesc: "Пешие и горные походы с гидами. Маршруты для начинающих и опытных.",
  },
  kayaking: {
    tripName: "Сплав на байдарках по Днестру",
    title: "Сплавы на байдарках по Днестру | Турклуб Эва — Тирасполь",
    description: "Сплавы на байдарках по реке Днестр из Тирасполя. Однодневные и многодневные маршруты каждые выходные для начинающих и опытных. Снаряжение включено. Безопасно, весело, незабываемо.",
    touristType: ["Adventure tourism", "Water tourism"],
    place: "Река Днестр, Приднестровье",
    price: "150",
    breadcrumbName: "Байдарки",
    keywords: ["сплав на байдарках Тирасполь", "байдарки Днестр", "сплав по Днестру", "водный туризм Молдова", "каяк Приднестровье", "аренда байдарок Тирасполь"],
  },
  sup: {
    tripName: "SUP-прогулки и Sup-сплавы",
    title: "SUP-прогулки и туры на сапах — Турклуб Эва | Тирасполь",
    description: "SUP-прогулки (сапсёрфинг) по Днестру. Обучение с нуля, групповые туры выходного дня из Тирасполя.",
    touristType: ["Water tourism", "Active tourism"],
    place: "Река Днестр, Приднестровье",
    price: "100",
    breadcrumbName: "SUP-серфинг",
    keywords: ["SUP Тирасполь аренда", "сапсёрфинг Молдова", "SUP-туры ПМР", "доска для SUP аренда Тирасполь"],
  },
  kids: {
    tripName: "Детские туры и лагеря",
    title: "Детские туры и лагеря в Приднестровье | Турклуб Эва",
    description: "Безопасные приключения для детей с опытными инструкторами. Активный отдых с детьми ПМР, детские походы из Тирасполя.",
    touristType: ["Family tourism", "Adventure tourism"],
    place: "Приднестровье",
    price: "150",
    breadcrumbName: "Детский туризм",
    keywords: ["детский поход Тирасполь", "активный отдых с детьми ПМР", "детские туры Приднестровье", "семейный туризм Молдова"],
  },
  local: {
    tripName: "Приключения в Приднестровье и Молдове",
    title: "Местные вылазки и пикники — Турклуб Эва | ПМР и Молдова",
    description: "Туры, пикники и однодневные вылазки по Приднестровью и Молдове. Природа, история, атмосферные места рядом с Тирасполем.",
    touristType: ["Cultural tourism", "Ecotourism"],
    place: "Приднестровье",
    price: "100",
    breadcrumbName: "Местный туризм",
    keywords: ["активный отдых Тирасполь", "туры ПМР", "приключенческие туры Молдова", "Transnistria tours", "пикник Тирасполь", "экскурсии Приднестровье"],
  },
  organizers: {
    tripName: "Корпоративный и групповой туризм",
    title: "Корпоративный отдых и тимбилдинги на природе | Турклуб Эва",
    description: "Тимбилдинг, сплавы, школьные группы от Турклуба Эва. Комплексная организация активного корпоративного отдыха в Молдове и ПМР.",
    touristType: ["Corporate tourism", "Group tourism"],
    place: "Приднестровье",
    price: "200",
    breadcrumbName: "Организаторам",
    keywords: ["корпоративный отдых Тирасполь", "тимбилдинг на природе Молдова", "групповой туризм ПМР", "туры для компаний Тирасполь"],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

// ==========================================
// SEO: generateMetadata
// ==========================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = DIRECTION_META[slug];
  
  if (!meta) return { title: 'Направление | Турклуб «Эва»' };

  const url = `${BASE_URL}/directions/${slug}`;

  return {
    title: meta.title,
    description: meta.description,
    // Используем наше новое семантическое ядро
    keywords: meta.keywords,
    alternates: {
      canonical: url,
      languages: {
        'ru': url,
        'ro': `${url}?lang=ro`,
        'en': `${url}?lang=en`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: 'Турклуб «Эва»',
      images: [{ url: `${BASE_URL}${meta.ogImage || '/og-default.jpg'}`, width: 1200, height: 630 }],
      locale: 'ru_RU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.twitterTitle || meta.title,
      description: meta.twitterDesc || meta.description,
      images: [`${BASE_URL}${meta.ogImage || '/og-default.jpg'}`],
    },
  };
}

// ==========================================
// SEO: JSON-LD КОМПОНЕНТ
// ==========================================

function DirectionJsonLd({ slug }: { slug: string }) {
  const meta = DIRECTION_META[slug];
  if (!meta) return null;

  const url = `${BASE_URL}/directions/${slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: meta.tripName,
    description: meta.description,
    touristType: meta.touristType,
    url,
    provider: {
      "@type": "Organization",
      name: "Турклуб «Эва»",
      url: BASE_URL,
      address: {
        "@type": "PostalAddress",
        addressCountry: "MD",
        addressRegion: "Приднестровье",
      },
    },
    itinerary: {
      "@type": "Place",
      name: meta.place,
      address: { "@type": "PostalAddress", addressCountry: "MD" },
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "MDL",
      price: meta.price,
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Направления", item: `${BASE_URL}/directions` },
      { "@type": "ListItem", position: 3, name: meta.breadcrumbName, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />
    </>
  );
}

// ==========================================
// ХЕЛПЕР: фетч + маппинг туров
// ==========================================

// ИСПРАВЛЕНИЕ: Убрали использование any для безопасной типизации TypeScript
function stripHeavyFields(tour: Record<string, unknown> & TourPreview): TourPreview {
  const { program, faq, checklist, documents, included, additionalExpenses, ...lightTour } = tour;
  return lightTour as unknown as TourPreview;
}

async function fetchTours(slug: string): Promise<TourPreview[]> {
  const rawTours = await getToursByCategory(slug, 6);
  return rawTours.map((t) => stripHeavyFields(t as unknown as Record<string, unknown> & TourPreview));
}

// ==========================================
// СТРАНИЦА
// ==========================================
export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(DIRECTION_META).map((slug) => ({ slug }));
}

export default async function DirectionPage({ params }: Props) {
  const { slug } = await params;

  const noToursNeeded = slug === 'sup' || slug === 'organizers';

  // Убрали await — Promise стартует немедленно,
  // не блокирует рендер Hero и остального контента выше фолда.
  // Каждый лендинг сам резолвит его через Suspense внутри себя.
  const toursPromise: Promise<TourPreview[]> = noToursNeeded
    ? Promise.resolve([])
    : fetchTours(slug);

  switch (slug) {
    case 'kayaking':
      return (
        <main className="min-h-screen bg-slate-950">
          <DirectionJsonLd slug={slug} />
          <KayakingLanding toursPromise={toursPromise} />
        </main>
      );

    case 'sup':
      return (
        <main className="min-h-screen bg-slate-950">
          <DirectionJsonLd slug={slug} />
          <SupLanding />
        </main>
      );

    case 'kids':
      return (
        <main className="min-h-screen bg-slate-950">
          <DirectionJsonLd slug={slug} />
          <KidsLanding toursPromise={toursPromise} />
        </main>
      );

    case 'local':
      return (
        <main className="min-h-screen bg-slate-950">
          <DirectionJsonLd slug={slug} />
          <LocalLanding toursPromise={toursPromise} />
        </main>
      );

    case 'organizers':
      return (
        <main className="min-h-screen bg-slate-950">
          <DirectionJsonLd slug={slug} />
          <OrganizersLanding />
        </main>
      );

    case 'hiking':
      return (
        <main className="min-h-screen bg-stone-950">
          <DirectionJsonLd slug={slug} />
          <HikesLanding toursPromise={toursPromise} />
        </main>
      );
  }

  // Универсальный фолбэк
  const data = getDirectionBySlug(slug);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-slate-950">
      <DirectionHero data={data} />
      <DirectionBento data={data} />
      <DirectionShowcase data={data} />
      <DirectionLeadMagnet data={data} />
    </main>
  );
}