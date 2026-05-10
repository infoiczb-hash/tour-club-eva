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
// Компонент загрузится только если slug совпадет, экономя сотни килобайт JS
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
  tripName: string;         // Краткое название (для JSON-LD и хлебных крошек)
  title: string;            // Расширенный SEO-Title страницы
  description: string;      // SEO-Description страницы
  touristType: string[];    // Для микроразметки
  place: string;            // Для микроразметки
  price: string;            // Для микроразметки
  breadcrumbName: string;   // Название в хлебных крошках
  ogImage?: string;         // Кастомная картинка для репостов (опционально)
  twitterTitle?: string;    // Кастомный заголовок для Twitter (опционально)
  twitterDesc?: string;     // Кастомное описание для Twitter (опционально)
};

const DIRECTION_META: Record<string, DirectionMetaType> = {
  hiking: {
    tripName: "Туры в горы",
    title: "Приключенческие туры в горы из Приднестровья и Молдовы",
    description: "Многодневные треки в горы Румынии и не только с гидами. Маршруты для начинающих и опытных. Выезды из Тирасполя/Кишинев. Группы 6–20 человек.",
    touristType: ["Hiking tourism", "Ecotourism"],
    place: "Румыния и мир",
    price: "100",
    breadcrumbName: "Горные туры",
    ogImage: "/og-default.jpg",
    twitterTitle: "Туры в горы | Эва",
    twitterDesc: "Пешие и горные походы с гидами. Маршруты для начинающих и опытных.",
  },
  kayaking: {
    tripName: "Сплав на байдарках по Днестру",
    title: "Сплавы на байдарках по Днестру", // Заполнишь своими крутыми SEO-тайтлами
    description: "Однодневные и многодневные сплавы по реке Днестр. Снаряжение, гид и трансфер включены.",
    touristType: ["Adventure tourism", "Water tourism"],
    place: "Река Днестр, Приднестровье",
    price: "150",
    breadcrumbName: "Байдарки",
  },
  sup: {
    tripName: "SUP-прогулки и Sup-сплавы",
    title: "SUP-серфинг и прогулки на сапбордах",
    description: "Прогулки на сапборде. Доска, весло, инструктор — всё включено.",
    touristType: ["Water tourism", "Active tourism"],
    place: "Река Днестр, Приднестровье",
    price: "100",
    breadcrumbName: "SUP-серфинг",
  },
  kids: {
    tripName: "Детские туры и лагеря",
    title: "Детские туры и туристические лагеря в Приднестровье",
    description: "Приключения для детей с опытными инструкторами.",
    touristType: ["Family tourism", "Adventure tourism"],
    place: "Приднестровье",
    price: "150",
    breadcrumbName: "Детский туризм",
  },
  local: {
    tripName: "Приключения в Приднестровье и Молдове",
    title: "Местный туризм: Приднестровье и Молдова",
    description: "Однодневные туры природным местам Приднестровья и Молдовы.",
    touristType: ["Cultural tourism", "Ecotourism"],
    place: "Приднестровье",
    price: "100",
    breadcrumbName: "Местный туризм",
  },
  organizers: {
    tripName: "Корпоративный и групповой туризм",
    title: "Корпоративный отдых и тимбилдинги на природе",
    description: "Тимбилдинг, сплавы, школьные группы от Турклуба Эва.",
    touristType: ["Corporate tourism", "Group tourism"],
    place: "Приднестровье",
    price: "200",
    breadcrumbName: "Организаторам",
  },
};

//   ИСПРАВЛЕНО: Типизация params как Promise
type Props = {
  params: Promise<{ slug: string }>;
};
// ==========================================
// SEO: generateMetadata
// ==========================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = DIRECTION_META[slug]; // твой существующий объект
  if (!meta) return {};

  const url = `${BASE_URL}/directions/${slug}`;

  return {
    title: `${meta.title} | Турклуб «Эва»`,
    description: meta.description,
    keywords: [`${meta.tripName} Приднестровье`, `${meta.tripName} Молдова`, ...meta.touristType],
    alternates: {
      canonical: url,
      languages: {
        'ru': url,
        'ro': `${url}?lang=ro`,
        'en': `${url}?lang=en`,
      },
    },
    openGraph: {
      title: `${meta.title} | Турклуб «Эва»`,
      description: meta.description,
      url,
      siteName: 'Турклуб «Эва»',
      images: [{ url: `${BASE_URL}${meta.ogImage || '/og-default.jpg'}`, width: 1200, height: 630 }],
      locale: 'ru_RU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.twitterTitle || `${meta.title} | Турклуб «Эва»`,
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
// СТРАНИЦА
// ==========================================
export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(DIRECTION_META).map((slug) => ({ slug }));
}

export default async function DirectionPage({ params }: Props) {
  // 1. Получаем slug из Promise-параметров
  const { slug } = await params;

  // 2. Определяем, нужны ли нам туры для этого направления
  const noToursNeeded = slug === 'sup' || slug === 'organizers';

  // 3. Получаем данные из базы (API возвращает тип Tour[])
  const rawTours: TourPreview[] = noToursNeeded ? [] : await getToursByCategory(slug, 6);

  // 4. Оптимизируем: создаем TourPreview[], отсекая тяжелые поля
  // Мы явно указываем тип (tour: any), чтобы TS не ругался на отсутствие полей в финальном типе
  const tours: TourPreview[] = rawTours.map((tour: any) => {
    const { 
      program, faq, checklist, documents, included, additionalExpenses, 
      ...lightTour 
    } = tour;
    return lightTour as TourPreview;
  });
  switch (slug) {
    case 'kayaking':
      return (
        <main className="min-h-screen bg-slate-950">
          <DirectionJsonLd slug={slug} />
          <KayakingLanding tours={tours} />
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
          <KidsLanding tours={tours} /> {/*   Теперь туры пошли на клиент! */}
        </main>
      );

    case 'local':
      return (
        <main className="min-h-screen bg-slate-950">
          <DirectionJsonLd slug={slug} />
          <LocalLanding tours={tours} />
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
          <HikesLanding tours={tours} />
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