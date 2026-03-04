import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// --- УНИВЕРСАЛЬНЫЙ ДВИЖОК (Фолбэк) ---
import { getDirectionBySlug } from '@/data/directionsData';
import DirectionHero from '@/components/directions/DirectionHero';
import DirectionBento from '@/components/directions/DirectionBento';
import DirectionShowcase from '@/components/directions/DirectionShowcase';
import DirectionLeadMagnet from '@/components/directions/DirectionLeadMagnet';

// --- VIP-НАПРАВЛЕНИЯ ---
import KayakingLanding from '@/features/directions/kayaking/KayakingLanding';
import SupLanding from '@/features/directions/sup/SupLanding';
import KidsLanding from '@/features/directions/kids/KidsLanding';
import LocalLanding from '@/features/directions/local/LocalLanding';
import OrganizersLanding from '@/features/directions/organizers/OrganizersLanding';
import HikesLanding from '@/features/directions/hiking/HikesLanding';

import { Tour } from '@/features/tours/types';

// ==========================================
// SEO: КОНФИГ НАПРАВЛЕНИЙ
// ==========================================

const BASE_URL = "https://evatur.club";

const DIRECTION_META: Record<string, {
  tripName: string;
  description: string;
  touristType: string[];
  place: string;
  price: string;
  breadcrumbName: string;
}> = {
  kayaking: {
    tripName: "Сплав на байдарках по Днестру",
    description: "Однодневные и многодневные сплавы по реке Днестр. Снаряжение, гид и трансфер включены.",
    touristType: ["Adventure tourism", "Water tourism"],
    place: "Река Днестр, Приднестровье",
    price: "150",
    breadcrumbName: "Байдарки",
  },
  sup: {
    tripName: "SUP-прогулки и Sup-сплавы",
    description: "Прогулки на сапборде. Доска, весло, инструктор — всё включено.",
    touristType: ["Water tourism", "Active tourism"],
    place: "Река Днестр, Приднестровье",
    price: "100",
    breadcrumbName: "SUP-серфинг",
  },
  hiking: {
    tripName: "Туры в горы",
    description: "Многодневные туры в горы. Гид и трансфер включены.",
    touristType: ["Hiking tourism", "Ecotourism"],
    place: "Румыния и мир",
    price: "100",
    breadcrumbName: "Горные туры",
  },
  local: {
    tripName: "Приключения в Приднестровье и Молдове",
    description: "Однодневные туры природным местам Приднестровья и Молдовы.",
    touristType: ["Cultural tourism", "Ecotourism"],
    place: "Приднестровье",
    price: "100",
    breadcrumbName: "Местный туризм",
  },
  kids: {
    tripName: "Детские туры и лагеря Турклуба Эва",
    description: "Приключения для детей с опытными инструкторами.",
    touristType: ["Family tourism", "Adventure tourism"],
    place: "Приднестровье",
    price: "150",
    breadcrumbName: "Детский туризм",
  },
  organizers: {
    tripName: "Корпоративный и групповой туризм от Турклуба Эва",
    description: "Тимбилдинг, сплавы, школьные группы.",
    touristType: ["Corporate tourism", "Group tourism"],
    place: "Приднестровье",
    price: "200",
    breadcrumbName: "Организаторам",
  },
};

// ==========================================
// SEO: generateMetadata
// ==========================================

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const meta = DIRECTION_META[params.slug];
  if (!meta) return {};
  return {
    title: `${meta.tripName} | Турклуб «Эва»`,
    description: meta.description,
    alternates: { canonical: `${BASE_URL}/directions/${params.slug}` },
    openGraph: {
      title: `${meta.tripName} | Турклуб «Эва»`,
      description: meta.description,
      url: `${BASE_URL}/directions/${params.slug}`,
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

  const touristTrip = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": meta.tripName,
    "description": meta.description,
    "touristType": meta.touristType,
    "url": url,
    "provider": {
      "@type": "Organization",
      "name": "Турклуб «Эва»",
      "url": BASE_URL,
    },
    "itinerary": {
      "@type": "Place",
      "name": meta.place,
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "MDL",
      "price": meta.price,
      "availability": "https://schema.org/InStock",
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Главная", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Направления", "item": `${BASE_URL}/directions` },
      { "@type": "ListItem", "position": 3, "name": meta.breadcrumbName, "item": url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristTrip) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}

// ==========================================
// СТРАНИЦА
// ==========================================
export const revalidate = 60;
export async function generateStaticParams() {
  return [
    { slug: 'kayaking' },
    { slug: 'sup' },
    { slug: 'kids' },
    { slug: 'local' },
    { slug: 'organizers' },
    { slug: 'hiking' },
  ];
}
interface PageProps {
  params: { slug: string };
}


export default async function DirectionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = params;
  const tours: Tour[] = [];
 
   

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
          <KidsLanding />
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