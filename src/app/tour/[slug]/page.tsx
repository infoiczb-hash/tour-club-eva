import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTourBySlug, getTours} from '@/features/tours/api'; 
import TourDetailsWrapper from '@/features/tours/components/TourDetails/TourDetailsWrapper'; 

// Базовый URL сайта (из env или фолбек на прод)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

export async function generateStaticParams() {
  const tours = await getTours();
  
  return tours.map((tour) => ({
    slug: tour.slug,
  }));
}

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};


// --- 1. SEO МЕТАДАННЫЕ ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const tour = await getTourBySlug(decodedSlug);

  if (!tour) {
    return { 
      title: 'Тур не найден | Турклуб «Эва»',
      robots: { index: false } 
    };
  }

  // ✅ ИСПРАВЛЕНО: Правильный путь (/tour/ вместо /tours/) для защиты от дублей
  const url = `${BASE_URL}/tour/${tour.slug}`; 
  
  // Бронебойная логика картинки (Абсолютный URL)
  let imageUrl = tour.image || `${BASE_URL}/og-default.jpg`;
  if (imageUrl.startsWith('/')) {
    imageUrl = `${BASE_URL}${imageUrl}`;
  }

  // ✅ ИСПРАВЛЕНО: Мощный fallback с гео-привязкой и призывом к действию
  const cleanDescription = tour.subtitle || `Тур «${tour.title}» от турклуба «Эва» — активный отдых в Приднестровье. Подробности и запись →`;

  // ✅ ДОБАВЛЕНО: Динамические ключевые слова (Keywords)
  const typeKeyword = tour.category?.title || 'приключения'; // ✅ Берем название категории
  const keywords = [
    `тур ${tour.title}`,
    `${typeKeyword} Приднестровье`,
    `активный отдых Тирасполь`,
    `Турклуб Эва`,
    `походы Молдова`,
     `горы Румыния`,
    `SUP и сплавы на байдарках на Днестре`
  ];

 return {
    title: `${tour.title} | Турклуб «Эва»`,
    description: cleanDescription,
    keywords: keywords,
    robots: { index: true, follow: true },
    alternates: {
      canonical: url, 
    },
    openGraph: {
      title: `${tour.title} | Турклуб «Эва»`,
      description: cleanDescription,
      url: url,
      siteName: 'Турклуб «Эва»',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: tour.title,
        }
      ],
      type: 'website',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image', 
      title: tour.title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

// --- 2. СТРАНИЦА ТУРА ---
export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  
  const decodedSlug = decodeURIComponent(slug);
  
  // Загружаем одновременно текущий тур и список всех туров
  const [tour, allTours] = await Promise.all([
    getTourBySlug(decodedSlug),
    getTours()
  ]);

  if (!tour) {
    notFound(); 
  }

  // Ищем похожие туры: та же категория, исключаем текущий тур, берем максимум 3
  const similarTours = allTours
    .filter(t => t.categoryId === tour.categoryId && t.id !== tour.id)
    .slice(0, 3);

  // Собираем картинки для микроразметки
  const schemaImages = [
    tour.image,
    ...(tour.gallery || [])
  ].filter(Boolean) as string[];

  // ✅ ИСПРАВЛЕНО: Гибридная Schema.org (Event + TouristTrip)
  // Это дает расширенный сниппет с ценами, датами и статусом наличия мест
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Event', 'TouristTrip'],
    name: tour.title,
    description: tour.subtitle || tour.description,
    image: schemaImages,
    touristType: [
      "Любители природы",
      "Активный отдых"
    ],
    startDate: tour.date || new Date().toISOString(), 
    endDate: tour.endDate || tour.date || new Date().toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: tour.location || 'Приднестровье',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'MD', 
        addressLocality: tour.location || 'Тирасполь'
      }
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/tour/${tour.slug}`,
      price: tour.price, 
      priceCurrency: tour.currency || 'MDL',
      availability: (tour.spotsLeft || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      validFrom: new Date().toISOString(),
    },
    organizer: {
      '@type': 'Organization',
      name: 'Турклуб «Эва»',
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png` 
    },
    performer: (typeof tour.guide === 'object' && tour.guide) ? {
      '@type': 'Person',
      name: tour.guide.name
    } : undefined
  };

  return (
    <main className="print:bg-white print:text-slate-900">
      {/* Скрытый код для поисковых ботов */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Передаем тур и похожие туры в интерактивный клиентский компонент */}
      <TourDetailsWrapper tour={tour} similarTours={similarTours} />
    </main>
  );
}
