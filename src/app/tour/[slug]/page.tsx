import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTourBySlug } from '@/features/tours/api'; 
import TourDetailsWrapper from '@/features/tours/components/TourDetails/TourDetailsWrapper'; 


// Базовый URL сайта (из env или фолбек на прод)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const tour = await getTourBySlug(decodedSlug);

  if (!tour) {
    return { 
      title: 'Тур не найден | Турклуб ЭВА',
      robots: { index: false } 
    };
  }

  const url = `${BASE_URL}/tours/${tour.slug}`; // Убедись, что тут правильный путь (/tours/ или /tour/)
  
  // 1. Бронебойная логика картинки (Абсолютный URL)
  // Если у тура нет картинки, ставим красивую общую обложку сайта (создай файл og-default.jpg в папке public)
  let imageUrl = tour.image || `${BASE_URL}/og-default.jpg`;
  
  // Если картинка лежит у нас на сервере (начинается с /), приклеиваем домен
  if (imageUrl.startsWith('/')) {
    imageUrl = `${BASE_URL}${imageUrl}`;
  }

  // 2. Чистое описание (без возможных HTML тегов)
  const cleanDescription = tour.subtitle || 'Отправьтесь в туры вместе с турклубом ЭВА!';

  return {
    title: `${tour.title} | Турклуб ЭВА`,
    description: cleanDescription,
    alternates: {
      canonical: url, 
    },
    openGraph: {
      title: `${tour.title} | Турклуб ЭВА`,
      description: cleanDescription,
      url: url,
      siteName: 'Турклуб ЭВА',
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
    // 3. ДОБАВЛЕНО: Twitter Card (Обязательно для больших картинок в Telegram)
    twitter: {
      card: 'summary_large_image', // Эта строчка делает картинку БОЛЬШОЙ, а не маленьким квадратиком
      title: tour.title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}
// --- 2. СТРАНИЦА ТУРА ---
export default async function TourPage({ params }: Props) {
  const { slug } = await params;
  
  // 1. Декодируем slug перед запросом в БД
  const decodedSlug = decodeURIComponent(slug);
  
  // 2. Получаем данные (уже очищенные и типизированные через API адаптер)
  const tour = await getTourBySlug(decodedSlug);

  if (!tour) {
    notFound(); 
  }

  // 3. Собираем картинки для микроразметки (Обложка + Галерея)
  const schemaImages = [
    tour.image,
    ...(tour.gallery || [])
  ].filter(Boolean) as string[];

  // 4. JSON-LD (Structured Data для Google)
  // Это помогает поисковикам понять цену, даты и наличие мест
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: tour.title,
    description: tour.subtitle || tour.description,
    image: schemaImages,
    // API возвращает date (ISO) первого заезда. Если даты нет — ставим текущую (фолбек)
    startDate: tour.date || new Date().toISOString(), 
    endDate: tour.endDate || tour.date || new Date().toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: tour.location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'MD', // Или брать из локации, если там есть страна
        addressLocality: tour.location
      }
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/tour/${tour.slug}`,
      price: tour.price, // Используем основную цену
      priceCurrency: tour.currency || 'RUB',
      availability: (tour.spotsLeft || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      validFrom: new Date().toISOString(),
    },
    organizer: {
      '@type': 'Organization',
      name: 'Турклуб ЭВА',
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png` // Убедитесь, что логотип доступен по этому адресу
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
      {/* Передаем тур в интерактивный клиентский компонент.
         Типы данных Tour полностью совпадают.
      */}
      <TourDetailsWrapper tour={tour} />
    </main>
  );
}