import React from 'react';
import ReactDOM from 'react-dom';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTourBySlug, getTours, getSimilarTours } from '@/features/tours/api'; 
import TourDetailsWrapper from '@/features/tours/components/TourDetails/TourDetailsWrapper';

// Базовый URL сайта (из env или фолбек на прод)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

export async function generateStaticParams() {
  const tours = await getTours();
  return tours.map((tour) => ({
    slug: tour.slug,
  }));
}

// ✅ ТЕПЕРЬ ЭТО РАБОТАЕТ НА 100%. Страница кэшируется на час.
export const revalidate = 3600;

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

  const url = `${BASE_URL}/tour/${tour.slug}`; 
  
 let imageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(tour.title)}&subtitle=${encodeURIComponent(tour.subtitle || 'Турклуб Эва')}`;
  if (imageUrl.startsWith('/')) imageUrl = `${BASE_URL}${imageUrl}`;

  const cleanDescription = tour.subtitle || `Тур «${tour.title}» от турклуба «Эва» — активный отдых в Приднестровье. Подробности и запись →`;

  return {
    title: `${tour.title} | Турклуб «Эва»`,
    description: cleanDescription,
     alternates: { canonical: url },
    openGraph: {
      title: `${tour.title} | Турклуб «Эва»`,
      description: cleanDescription,
      url: url,
      siteName: 'Турклуб «Эва»',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: tour.title }],
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

  const tour = await getTourBySlug(decodedSlug);
  if (!tour) notFound();
  
  if (tour.image) ReactDOM.preload(tour.image, { as: 'image', fetchPriority: 'high' });

  // ✅ ИЗМЕНЕНО: Убрали чтение кук. Запрашиваем только похожие туры (теперь это TourPreview)
  const similarTours = await getSimilarTours(tour.categoryId ?? null, tour.id, 3);

  const schemaImages = [tour.image, ...(tour.gallery || [])].filter(Boolean) as string[];
  // ✅ ИЗМЕНЕНО: Не ставим сегодняшнюю дату для туров-анонсов (без дат)
  const startDate = tour.date ? new Date(tour.date).toISOString() : undefined;

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': ['Event', 'TouristTrip'],
    name: tour.title,
    description: tour.subtitle || tour.description,
    image: schemaImages,
    touristType: ["Любители природы", "Активный отдых"],
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
    },
    organizer: {
      '@type': 'Organization',
      name: 'Турклуб «Эва»',
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png` 
    }
  };

  if (startDate) {
    jsonLd.startDate = startDate;
    jsonLd.endDate = tour.endDate ? new Date(tour.endDate).toISOString() : startDate;
  }

  if (typeof tour.guide === 'object' && tour.guide) {
    jsonLd.performer = { '@type': 'Person', name: tour.guide.name };
  }

  return (
    <main className="print:bg-white print:text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ✅ isWished теперь всегда false при рендере на сервере. Кнопка вишлиста должна сама проверять статус на клиенте */}
      <TourDetailsWrapper tour={tour} similarTours={similarTours} isWished={false} />
    </main>
  );
}