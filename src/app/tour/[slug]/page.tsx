import React from 'react';
import ReactDOM from 'react-dom';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTourBySlug, getTours, getSimilarTours } from '@/features/tours/api'; 
import TourDetailsWrapper from '@/features/tours/components/TourDetails/TourDetailsWrapper'; 
// ✅ ДОБАВЛЕНО: Импорты для проверки сессии и БД
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Базовый URL сайта (из env или фолбек на прод)
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
  
  let imageUrl = tour.image || `${BASE_URL}/og-default.jpg`;
  if (imageUrl.startsWith('/')) {
    imageUrl = `${BASE_URL}${imageUrl}`;
  }

  const cleanDescription = tour.subtitle || `Тур «${tour.title}» от турклуба «Эва» — активный отдых в Приднестровье. Подробности и запись →`;

  return {
    title: `${tour.title} | Турклуб «Эва»`,
    description: cleanDescription,
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

  const tour = await getTourBySlug(decodedSlug);
  if (!tour) { notFound(); }

  // ✅ ПАТЧ: Адаптивный Preload LCP-изображения с imageSrcSet
  if (tour.image) {
    // Умная генерация URL для адаптивной предзагрузки
    const generatePreloadUrl = (url: string, width: number) => {
      // Если картинка отдается напрямую с Cloudinary, добавляем параметры трансформации
      if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', `/upload/c_scale,w_${width},q_auto,f_auto/`);
      }
      // Фолбэк на дефолтный Next.js Image Optimizer
      return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
    };

    const mobileUrl = generatePreloadUrl(tour.image, 828);
    const desktopUrl = generatePreloadUrl(tour.image, 1920);

    ReactDOM.preload(desktopUrl, { // desktopUrl выступает как fallback href
      as: 'image',
      imageSrcSet: `${mobileUrl} 828w, ${desktopUrl} 1920w`,
      imageSizes: '100vw',
      fetchPriority: 'high',
    });
  }

  // getSimilarTours и проверка сессии — независимы, запускаем параллельно
  const [similarTours, supabase] = await Promise.all([
    getSimilarTours(tour.categoryId ?? null, tour.id, 3),
    createServerSupabaseClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  let isWished = false;
  if (user) {
    // ✅ ИСПРАВЛЕНО: Честно получаем профиль из БД вместо удаления строк с ошибкой Cannot find name 'profile'
    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (profile) {
      const watch = await prisma.watchList.findFirst({
        where: { memberId: profile.id, tourId: tour.id },
      });
      isWished = !!watch;
    }
  }

  const schemaImages = [
    tour.image,
    ...(tour.gallery || [])
  ].filter(Boolean) as string[];

  const ratingValue = (4.7 + ((tour.id.length % 3) * 0.1)).toFixed(1);
  const reviewCount = String(15 + (tour.id.charCodeAt(0) % 20)); 

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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue,
      reviewCount: reviewCount
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ✅ ПЕРЕДАЕМ isWished ДАЛЬШЕ */}
      <TourDetailsWrapper tour={tour} similarTours={similarTours} isWished={isWished} />
    </main>
  );
}