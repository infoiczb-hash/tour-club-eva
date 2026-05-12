// src/lib/seo/tourSchema.ts
import { BASE_URL } from '@/lib/constants';

// --- ТИПЫ ДАННЫХ ---

interface TourSchemaInput {
  slug: string;
  title: string;
  description?: string | null;
  subtitle?: string | null;
  image?: string | null;
  price?: number | null;
  currency?: string | null;
  location?: string | null;
  category?: { title: string } | null;
  guide?: { 
    name: string; 
    slug?: string | null; 
  } | null; 
  dates?: Array<{ 
    start?: string | Date | null; 
    startDate?: string | Date | null;
  }> | null;
  reviews?: Array<{ rating: number | null; name: string; text: string }>;
}

// Интерфейс для входных данных Event-схемы
interface TourEventSchemaInput {
  slug: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  image?: string | null;
  price?: number | null;
  currency?: string | null;
  location?: string | null;
  dates?: Array<{
    startDate?: string | Date | null;
    spotsLeft?: number;
  }> | null;
}


// --- ФУНКЦИЯ 1: Базовая разметка тура (TouristTrip) ---

export function buildTourSchema(tour: TourSchemaInput) {
  const url = `${BASE_URL}/tour/${tour.slug}`;
  
  const rawDesc = String(tour.description || tour.subtitle || '')
    .replace(/<[^>]+>/g, '')
    .slice(0, 500);

  const ratedReviews = (tour.reviews || []).filter(r => r.rating && r.rating > 0);
  const hasRatings = ratedReviews.length >= 2;
  const avgRating = hasRatings
    ? (ratedReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / ratedReviews.length).toFixed(1)
    : null;

  const nextDate = tour.dates?.find(d => {
    const dateVal = d.start || d.startDate;
    return dateVal && new Date(dateVal) >= new Date();
  });
  
  const finalStartDate = nextDate?.start || nextDate?.startDate;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: rawDesc,
    url,
    image: tour.image ?? `${BASE_URL}/og-default.jpg`,
    touristType: tour.category?.title ?? 'Активный туризм',
    itinerary: {
      '@type': 'ItemList',
      name: `Маршрут тура ${tour.title}`,
    },
  };

  if (tour.location) {
    schema.location = {
      '@type': 'Place',
      name: tour.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: tour.location,
        addressCountry: 'MD',
      },
    };
  }

  if (tour.price) {
    schema.offers = {
      '@type': 'Offer',
      price: tour.price,
      priceCurrency: tour.currency ?? 'RUB',
      availability: 'https://schema.org/InStock',
      url,
      seller: {
        '@type': 'Organization',
        name: 'Турклуб Эва',
      },
    };
  }

  if (tour.guide && typeof tour.guide === 'object' && tour.guide.name) {
    schema.provider = {
      '@type': 'Person',
      name: tour.guide.name,
      url: tour.guide.slug ? `${BASE_URL}/guides/${tour.guide.slug}` : undefined,
    };
  }

  if (finalStartDate) {
    schema.startDate = new Date(finalStartDate).toISOString().split('T')[0];
  }

  if (hasRatings && avgRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: ratedReviews.length,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}


// --- ФУНКЦИЯ 2: Разметка дат как событий (Event) ---

export function buildTourEventSchema(tour: TourEventSchemaInput) {
  if (!tour.dates || tour.dates.length === 0) return null;

  const url = `${BASE_URL}/tour/${tour.slug}`;
  const imageUrl = tour.coverImage || tour.image || `${BASE_URL}/og-default.jpg`;
  const rawDesc = String(tour.description || '').replace(/<[^>]+>/g, '').slice(0, 500);

  const events = tour.dates
    .filter(d => d.startDate && new Date(d.startDate) >= new Date())
    .map(d => {
      const eventStartDate = new Date(d.startDate!).toISOString();
      const inStock = (d.spotsLeft ?? 0) > 0;

      return {
        "@context": "https://schema.org",
        "@type": "Event",
        name: tour.title,
        description: rawDesc || `Присоединяйтесь к туру: ${tour.title}`,
        url: url,
        image: imageUrl,
        startDate: eventStartDate,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        organizer: {
          "@type": "Organization",
          name: "Турклуб «Эва»",
          url: BASE_URL
        },
        location: {
          "@type": "Place",
          name: tour.location || "Приднестровье",
          address: {
            "@type": "PostalAddress",
            addressCountry: "MD"
          }
        },
        offers: {
          "@type": "Offer",
          price: tour.price || 0,
          priceCurrency: tour.currency || "RUB",
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          url: url,
          validFrom: new Date().toISOString().split('T')[0]
        }
      };
    });

  return events.length > 0 ? events : null;
}