// src/app/tour/[slug]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTourBySlug, getTours, getSimilarTours } from '@/features/tours/api'; 
import TourDetailsWrapper from '@/features/tours/components/TourDetails/TourDetailsWrapper';
//   ИМПОРТ: Используем твою существующую функцию получения профиля
import { getMyProfileAction } from '@/features/account/actions/getProfile';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

export async function generateStaticParams() {
  const tours = await getTours();
  return tours.map((tour) => ({
    slug: tour.slug,
  }));
}

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

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
  
  return {
    title: `${tour.title} | Турклуб «Эва»`,
    description: tour.subtitle || 'Присоединяйтесь к нашему путешествию',
    openGraph: {
      title: tour.title,
      description: tour.subtitle || '',
      url,
      images: tour.image ? [{ url: tour.image }] : [],
      type: 'article',
    },
    alternates: {
      canonical: url,
    }
  };
}

export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
 // Оставляем только тур. Профиль подтянем на клиенте!
  const tour = await getTourBySlug(decodedSlug);

  if (!tour) {
    notFound();
  }

  // Для похожих туров используем Promise (Suspense внутри Wrapper его обработает)
 const similarToursPromise = getSimilarTours(tour.id, tour.category?.id ?? '');

  // Формируем JSON-LD для SEO (оставляем твою логику без изменений)
  const startDate = tour.dates?.[0]?.start ? new Date(tour.dates[0].start).toISOString() : null;
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: tour.title,
    description: tour.subtitle,
    image: tour.image,
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
      priceCurrency: tour.currency || 'RUB',
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
    <main className="bg-slate-950 min-h-screen">
      {/* Скрипт JSON-LD для поисковиков */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/*   ПЕРЕДАЕМ: Теперь profile летит во Wrapper, а оттуда в Sidebar и BottomActions */}
    <TourDetailsWrapper 
        tour={tour} 
        similarToursPromise={similarToursPromise}
        isWished={false}
      />
    </main>
  );
}