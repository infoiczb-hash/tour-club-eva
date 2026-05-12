// src/app/tour/[slug]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTourBySlug, getTours, getSimilarTours } from '@/features/tours/api'; 
import TourDetailsWrapper from '@/features/tours/components/TourDetails/TourDetailsWrapper';
import { getMyProfileAction } from '@/features/account/actions/getProfile';
import { buildTourSchema, buildTourEventSchema } from '@/lib/seo/tourSchema';
import { prisma } from '@/lib/prisma';

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

// ─── SEO МЕТАДАННЫЕ ──────────────────────────────────────────────────
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
  
  const rawDesc = String(tour.description || tour.subtitle || '').replace(/<[^>]+>/g, '');
  const description = rawDesc.slice(0, 155).trim();
  const ogDesc = rawDesc.slice(0, 120).trim();

  const ogImageUrl = new URL(`${BASE_URL}/api/og`);
  
  ogImageUrl.searchParams.set('title', tour.title);
  ogImageUrl.searchParams.set('type', 'tour');
  ogImageUrl.searchParams.set('format', 'event');

  if (tour.image) ogImageUrl.searchParams.set('image', tour.image);
  if (tour.price) ogImageUrl.searchParams.set('price', String(tour.price));
  if (tour.currency) ogImageUrl.searchParams.set('currency', tour.currency);
  if (tour.category?.title) ogImageUrl.searchParams.set('categoryTitle', tour.category.title);
  if (tour.category?.color) ogImageUrl.searchParams.set('categoryColor', tour.category.color);
  if (tour.location) ogImageUrl.searchParams.set('location', tour.location);
  if (tour.duration) ogImageUrl.searchParams.set('duration', tour.duration);
  if (tour.date) ogImageUrl.searchParams.set('date', String(tour.date));

  return {
    title: `${tour.title} — тур из Тирасполя | Турклуб Эва`,
    description,
    keywords: [
      tour.title,
      tour.location ?? '',
      tour.category?.title ?? '',
      'активный отдых Тирасполь',
      'туры Приднестровье',
      'турклуб Эва',
    ].filter(Boolean),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tour.title} — тур из Тирасполя`,
      description: ogDesc,
      url: url,
      siteName: "Турклуб «Эва»",
      locale: 'ru_RU',
      type: 'website',
      images: [{
        url: ogImageUrl.toString(),
        width: 1200, 
        height: 630,
        alt: `${tour.title} — Турклуб Эва`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: tour.title,
      description: ogDesc,
      images: [ogImageUrl.toString()],
    },
  };
}

// ─── СТРАНИЦА ────────────────────────────────────────────────────────
export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const tour = await getTourBySlug(decodedSlug);

  if (!tour) {
    notFound();
  }

  const similarToursPromise = getSimilarTours(tour.id, tour.category?.id ?? '');

  const seoReviews = await prisma.review.findMany({
    where: { 
      tourId: tour.id, 
      isActive: true 
    },
    select: { 
      rating: true, 
      name: true, 
      text: true 
    },
    take: 20
  });

  const schemaObj = buildTourSchema({
    ...tour,
    reviews: seoReviews
  } as any);

  // Генерируем Event схему, извлекая нужные поля из tourDates
  // Обратите внимание: Мы преобразуем tourDates в нужный формат dates
  const eventSchemaObj = buildTourEventSchema({
    slug: tour.slug,
    title: tour.title,
    description: tour.description,
    image: tour.image,
    price: tour.price,
    currency: tour.currency,
    location: tour.location,
    dates: tour.tourDates ? tour.tourDates.map(td => ({
        startDate: td.startDate,
        spotsLeft: td.spotsLeft
    })) : []
  });

  return (
    <main className="bg-slate-950 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(schemaObj).replace(/</g, '\\u003c') 
        }}
      />
      
      {/* Рендерим скрипт только если eventSchemaObj вернул данные */}
      {eventSchemaObj && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(eventSchemaObj).replace(/</g, '\\u003c') 
          }}
        />
      )}

      <TourDetailsWrapper 
        tour={tour} 
        similarToursPromise={similarToursPromise}
        isWished={false}
      />

      <div className="hidden lg:block h-0 w-0 invisible opacity-0 pointer-events-none select-none">
      </div>
    </main>
  );
}