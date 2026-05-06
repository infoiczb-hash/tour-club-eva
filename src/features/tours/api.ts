// src/features/tours/api.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Tour, TourPreview } from './types';
import { cache } from 'react';
import { unstable_cache } from 'next/cache'; // ✅ ДОБАВЛЕНО для Data Cache

// ─────────────────────────────────────────────
// Строгий тип для данных из Prisma с релейшенами
// ─────────────────────────────────────────────
type PrismaTourWithRelations = Prisma.TourGetPayload<{
  include: { guide: true; category: true; tourDates: true };
}>;

// ─────────────────────────────────────────────
// Вспомогательные утилиты
// ─────────────────────────────────────────────
const ensureArray = (val: unknown): any[] =>
  Array.isArray(val) ? val : [];

const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Находит ближайшую дату тура, которая ещё не закончилась.
function getNearestFutureDate(
  dates: { start?: string | Date; startDate?: string | Date; end?: string | Date; endDate?: string | Date }[]
): any | null {
  if (!dates || dates.length === 0) return null;

  const now = today();
  const future = dates.filter(d => {
    const endDateVal = d.endDate || d.end || d.startDate || d.start;
    if (!endDateVal) return false;
    const end = new Date(endDateVal);
    end.setHours(0, 0, 0, 0);
    return end >= now;
  });
  
  if (future.length > 0) {
    return future.sort((a, b) => {
      const startA = a.startDate || a.start;
      const startB = b.startDate || b.start;
      return new Date(startA as string).getTime() - new Date(startB as string).getTime();
    })[0];
  }
  
  return [...dates].sort((a, b) => {
    const startA = a.startDate || a.start;
    const startB = b.startDate || b.start;
    return new Date(startB as string).getTime() - new Date(startA as string).getTime();
  })[0];
}

// ─────────────────────────────────────────────
// Маппер Prisma → фронтенд Tour (Полный объект) - Для страницы тура и Админки
// ─────────────────────────────────────────────
export function mapPrismaTourToFrontend(item: PrismaTourWithRelations): Tour {
const relationalDates = item.tourDates?.map(td => ({
    id: td.id, 
    start: td.startDate.toISOString(),
    startDate: td.startDate.toISOString(),
    end: td.endDate ? td.endDate.toISOString() : undefined,
    endDate: td.endDate ? td.endDate.toISOString() : undefined,
    time: td.time || undefined,
    capacity: td.spots || 0,
    spots: td.spots,
    spotsLeft: td.spotsLeft,
    guide_id: td.guideId || undefined,
    
    // ✅ ДОБАВЛЕНЫ НОВЫЕ ПОЛЯ ИЗ БД:
    basePrice: td.basePrice ?? null,
    discountEarlyBird: td.discountEarlyBird ?? null,
    earlyBirdDeadline: td.earlyBirdDeadline ?? null,
    surchargeLastMinute: td.surchargeLastMinute ?? null,
    lastMinuteTrigger: td.lastMinuteTrigger ?? null,
    
    _count: (td as any)._count, // Опционально
  })) || [];

  const legacyDates = ensureArray(item.dates as any);
  const datesToUse = relationalDates.length > 0 ? relationalDates : legacyDates;
  const nearestDate = getNearestFutureDate(datesToUse) ?? datesToUse[0] ?? null;

  const nearestSpots = nearestDate?.capacity ?? nearestDate?.spots ?? item.spots ?? 15;
  const nearestSpotsLeft = nearestDate?.spotsLeft ?? nearestSpots;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle ?? null,
    description: item.description ?? '',

    categoryId: item.categoryId ?? null,
    category: item.category
      ? {
          id: item.category.id,
          title: item.category.title,
          slug: item.category.slug,
          icon: item.category.icon,
          color: item.category.color ?? 'slate',
        }
      : null,

    difficulty: item.difficulty ?? 'medium',
    label: item.label ?? null,
    tags: item.tags ?? [],
    location: item.location,

    date: nearestDate?.startDate || nearestDate?.start || '',
    endDate: nearestDate?.endDate || nearestDate?.end || null,
    dates: datesToUse,

    duration: item.duration ?? null,
    distance: item.distance ?? null,
    meetingPoint: item.meetingPoint ?? null,
    route: item.route ?? null,

    tourFormat: item.tourFormat ?? null,
    accommodation: item.accommodation ?? null,
    groupInfo: item.groupInfo ?? null,
    importantInfo: item.importantInfo ?? null,
    includedDetailed: item.includedDetailed ?? null,
    excludedDetailed: item.excludedDetailed ?? null,

    metaTitle: item.metaTitle ?? null,
    metaDesc: item.metaDesc ?? null,

    price: Number(item.price) || 0,
    currency: item.currency ?? 'RUB',
    priceOld: item.priceOld ? Number(item.priceOld) : null,
    priceChild: item.priceChild ? Number(item.priceChild) : null,
    priceFamily: item.priceFamily ? Number(item.priceFamily) : null,
    priceMember: item.priceMember ? Number(item.priceMember) : null,

    spots: nearestSpots,
    spotsLeft: nearestSpotsLeft,

    image: item.coverImage ?? null,
    gallery: item.gallery ?? [],

    program: ensureArray(item.program),
    faq: ensureArray(item.faq),
    highlights: ensureArray(item.highlights),
    checklist: ensureArray(item.checklist),
    documents: ensureArray(item.documents),

    included: item.included ?? [],
    additionalExpenses: item.additionalExpenses ?? [],

    guide: item.guide
      ? {
          id: item.guide.id,
          name: item.guide.name,
          slug: item.guide.slug, 
          image: item.guide.image,
          role: item.guide.role,
          instagram: item.guide.instagram,
          bio: item.guide.bio,
          telegram: item.guide.telegram,
        }
      : null,

    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ─────────────────────────────────────────────
// ✅ ОПТИМИЗИРОВАННЫЙ МАППЕР ДЛЯ ПРЕВЬЮ
// ─────────────────────────────────────────────
function mapToPreview(item: any): TourPreview {
  const dates = item.tourDates?.map((td: any) => ({
    id: td.id,
    startDate: td.startDate,
    endDate: td.endDate,
    start: td.startDate, // legacy support
    capacity: td.spots || 0,
    spotsLeft: td.spotsLeft,
    _count: td._count
  })) || ensureArray(item.dates);

  const nearestDate = getNearestFutureDate(dates) ?? dates[0] ?? null;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle ?? null,
    price: Number(item.price) || 0,
    currency: item.currency ?? 'RUB',
    priceOld: item.priceOld ? Number(item.priceOld) : null,
    priceMember: item.priceMember ? Number(item.priceMember) : null,
    priceChild: item.priceChild ? Number(item.priceChild) : null,
    tags: item.tags ?? [],
    date: nearestDate?.startDate || nearestDate?.start || item.date || '',
    endDate: nearestDate?.endDate || nearestDate?.end || item.endDate || null,
    dates: dates,
    image: item.coverImage ?? null,
    label: item.label ?? null,
    categoryId: item.categoryId ?? null,
    category: item.category,
    difficulty: item.difficulty ?? 'medium',
    location: item.location,
    duration: item.duration ?? null,
    spots: nearestDate?.capacity ?? nearestDate?.spots ?? item.spots ?? 15,
    spotsLeft: nearestDate?.spotsLeft ?? item.spotsLeft ?? item.spots,
    isActive: item.isActive,
    guide: item.guide,
  };
}

// ✅ СЕЛЕКТОР (Выбираем из БД только 20% веса объекта)
const tourPreviewSelect: Prisma.TourSelect = {
  id: true, slug: true, title: true, subtitle: true,
  price: true, currency: true, priceOld: true, priceMember: true, priceChild: true,
  tags: true, coverImage: true, label: true,
  categoryId: true, difficulty: true, location: true, duration: true, spots: true, spotsLeft: true, isActive: true,
  category: { select: { id: true, title: true, slug: true, icon: true, color: true } },
  guide: { select: { id: true, name: true, role: true, image: true, instagram: true } },
tourDates: {
    orderBy: { startDate: 'asc' as const },
    take: 3,
    select: { 
      id: true, 
      startDate: true, 
      endDate: true, 
      time: true, 
      spots: true, 
      spotsLeft: true, 
      basePrice: true,
      discountEarlyBird: true,
      earlyBirdDeadline: true,
      surchargeLastMinute: true,
      lastMinuteTrigger: true,
      _count: { select: { bookings: true } } 
    }
  }
  };

// ─────────────────────────────────────────────
// Публичные функции (Превью)
// ─────────────────────────────────────────────

export const getTours = unstable_cache(
  async (cursor?: string): Promise<TourPreview[]> => {
    try {
      const tours = await prisma.tour.findMany({
        where: { 
          isActive: true, 
          deletedAt: null,
          OR: [
            { tourDates: { some: { endDate: { gte: today() } } } },
            { tourDates: { some: { startDate: { gte: today() } } } },
            { tourDates: { none: {} } }
          ]
        },
        take: 50,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        select: tourPreviewSelect, // ✅ ИСПОЛЬЗУЕМ SELECT
      });
      // ✅ БЕЗ JS-ФИЛЬТРА
      return tours.map(mapToPreview);
    } catch (error) {
      console.error('Ошибка получения туров:', error);
      return [];
    }
  },
  ['all-tours-preview'],
  { revalidate: 3600, tags: ['tours'] }
);

export const getToursByCategory = unstable_cache(
  async (categorySlug: string, take: number = 6): Promise<TourPreview[]> => {
    try {
      const tours = await prisma.tour.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          category: { slug: categorySlug },
          OR: [
            { tourDates: { some: { endDate: { gte: today() } } } },
            { tourDates: { some: { startDate: { gte: today() } } } },
            { tourDates: { none: {} } }
          ]
        },
        take,
        orderBy: { createdAt: 'desc' },
        select: tourPreviewSelect, // ✅ ИСПОЛЬЗУЕМ SELECT
      });
      return tours.map(mapToPreview);
    } catch (error) {
      console.error(`Ошибка получения туров категории ${categorySlug}:`, error);
      return [];
    }
  },
  ['tours-by-category'],
  { revalidate: 3600, tags: ['tours'] }
);

export const getSimilarTours = unstable_cache(
  async (categoryId: string | null, excludeId: string, limit: number = 3): Promise<TourPreview[]> => {
    if (!categoryId) return [];
    try {
      const tours = await prisma.tour.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          categoryId: categoryId,
          id: { not: excludeId },
          OR: [
            { tourDates: { some: { endDate: { gte: today() } } } },
            { tourDates: { some: { startDate: { gte: today() } } } },
            { tourDates: { none: {} } }
          ]
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: tourPreviewSelect, // ✅ ИСПОЛЬЗУЕМ SELECT
      });
      return tours.map(mapToPreview);
    } catch (error) {
      console.error('Ошибка получения похожих туров:', error);
      return [];
    }
  },
  ['similar-tours'],
  { revalidate: 3600, tags: ['tours'] }
);

// ─────────────────────────────────────────────
// Публичные функции (Полные объекты)
// ─────────────────────────────────────────────

// Страница одного тура - оставляем cache, т.к. тут нужен весь объект
export const getTourBySlug = cache(async (slug: string): Promise<Tour | null> => {
  try {
    const tour = await prisma.tour.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: { 
        guide: true, 
        category: true,
        tourDates: { orderBy: { startDate: 'asc' } } 
      },
    });
    if (!tour) return null;
    return mapPrismaTourToFrontend(tour);
  } catch (error) {
    console.error(`Ошибка получения тура ${slug}:`, error);
    return null;
  }
});

// Админка
export async function getAllTours(skip: number = 0, take: number = 50): Promise<Tour[]> {
  try {
    const tours = await prisma.tour.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { 
        guide: true, 
        category: true,
        tourDates: { orderBy: { startDate: 'asc' } } 
      },
    });
    return tours.map(mapPrismaTourToFrontend);
  } catch (error) {
    console.error('Ошибка получения всех туров для админки:', error);
    return [];
  }
}

export async function getGuides() {
  try {
    return await prisma.guide.findMany({
      where: { isActive: true },
      select: { id: true, name: true, image: true, role: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Ошибка загрузки гидов:', error);
    return [];
  }
}