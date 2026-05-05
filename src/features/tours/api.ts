// src/features/tours/api.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Tour, TourPreview } from './types'; //   ДОБАВЛЕНО: TourPreview
import { cache } from 'react';

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
// Используется и для маппинга (date/endDate карточки),
// и для фильтрации прошедших туров.
function getNearestFutureDate(
  dates: { start: string; end?: string }[]
): { start: string; end?: string } | null {
  if (!dates || dates.length === 0) return null;

  const now = today();
  const future = dates.filter(d => {
    const end = d.end ? new Date(d.end) : new Date(d.start);
    end.setHours(0, 0, 0, 0);
    return end >= now;
  });
  
  if (future.length > 0) {
    return future.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )[0];
  }
  
  // Если будущих дат нет, возвращаем самую "свежую" прошедшую
  return [...dates].sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  )[0];
}

// ─────────────────────────────────────────────
// Маппер Prisma → фронтенд Tour (Полный объект)
// ─────────────────────────────────────────────
export function mapPrismaTourToFrontend(item: PrismaTourWithRelations): Tour {
  const relationalDates = item.tourDates?.map(td => ({
    id: td.id, 
    start: td.startDate.toISOString(),
    end: td.endDate ? td.endDate.toISOString() : undefined,
    time: td.time || undefined,
    spots: td.spots,
    spotsLeft: td.spotsLeft,
    guide_id: td.guideId || undefined,
    basePrice: td.basePrice,
    discountEarlyBird: td.discountEarlyBird,
    earlyBirdDeadline: td.earlyBirdDeadline,
    surchargeLastMinute: td.surchargeLastMinute,
    lastMinuteTrigger: td.lastMinuteTrigger,
  })) || [];

  const datesToUse = relationalDates;
  const nearestDate = getNearestFutureDate(datesToUse) ?? datesToUse[0] ?? null;

  const nearestSpots = nearestDate && (nearestDate as any).spots != null
    ? (nearestDate as any).spots
    : item.spots ?? 15;
  const nearestSpotsLeft = nearestDate && (nearestDate as any).spotsLeft != null
    ? (nearestDate as any).spotsLeft
    : item.spotsLeft ?? nearestSpots;

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

    date: nearestDate?.start
      ? new Date(nearestDate.start).toISOString()
      : '',
    endDate: nearestDate?.end
      ? new Date(nearestDate.end).toISOString()
      : null,
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
//   ДОБАВЛЕНО: Маппер Prisma → TourPreview (DTO для карточек)
// ─────────────────────────────────────────────
function mapPrismaTourToPreview(item: PrismaTourWithRelations): TourPreview {
  const full = mapPrismaTourToFrontend(item);
  return {
    id: full.id,
    slug: full.slug,
    title: full.title,
    subtitle: full.subtitle,
    price: full.price,
    currency: full.currency,
    priceOld: full.priceOld,
    priceMember: full.priceMember, 
    priceChild: full.priceChild,  
    tags: full.tags,
    date: full.date,
    endDate: full.endDate,
    dates: full.dates,
    image: full.image,
    label: full.label,
    categoryId: full.categoryId,
    category: full.category,
    difficulty: full.difficulty,
    location: full.location,
    duration: full.duration,
    spots: full.spots,
    spotsLeft: full.spotsLeft,
    isActive: full.isActive,
    guide: full.guide,
  };
}

// ─────────────────────────────────────────────
// Фильтр: убирает туры у которых все даты прошли.
// ─────────────────────────────────────────────
function isTourRelevant(tour: Tour): boolean {
  const hasDatesArray = Array.isArray(tour.dates) && tour.dates.length > 0;
  const hasLegacyDate =
    typeof tour.date === 'string' ? tour.date.length > 0 : !!tour.date;

  if (!hasDatesArray && !hasLegacyDate) return true;

  const now = today();

  if (hasDatesArray) {
    return tour.dates!.some((d: any) => {
        const end = d.end ? new Date(d.end) : new Date(d.start);
        end.setHours(0, 0, 0, 0);
        return end >= now;
    });
  }

  const d = new Date(tour.date);
  d.setHours(0, 0, 0, 0);
  return d >= now;
}

// ─────────────────────────────────────────────
// Публичные функции
// ─────────────────────────────────────────────

//   ИЗМЕНЕНО: Возвращает TourPreview[], фильтрация в БД
export const getTours = cache(async (cursor?: string): Promise<TourPreview[]> => {
  try {
    const now = today();
    const tours = await prisma.tour.findMany({
      where: { 
        isActive: true, 
        deletedAt: null,
        OR: [
          { tourDates: { some: { startDate: { gte: now } } } },
          { tourDates: { some: { endDate: { gte: now } } } },
          { tourDates: { none: {} } }
        ]
      },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
     include: { 
        guide: true, 
        category: true,
        tourDates: { 
          where: {
            OR: [
              { startDate: { gte: now } },
              { endDate: { gte: now } }
            ]
          },
          orderBy: { startDate: 'asc' }, 
          take: 3 
        }
      },
    });
    return tours.map(mapPrismaTourToPreview).filter(t => isTourRelevant(t as unknown as Tour));
  } catch (error) {
    console.error('Ошибка получения туров:', error);
    return [];
  }
});

//   ИЗМЕНЕНО: Возвращает TourPreview[], фильтрация в БД
export const getToursByCategory = cache(async (
  categorySlug: string,
  take: number = 6
): Promise<TourPreview[]> => {
  try {
    const now = today();
    const tours = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        category: { slug: categorySlug },
        OR: [
          { tourDates: { some: { startDate: { gte: now } } } },
          { tourDates: { some: { endDate: { gte: now } } } },
          { tourDates: { none: {} } }
        ]
      },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        guide: true,
        category: true,
        tourDates: { orderBy: { startDate: 'asc' }, take: 3 },
      },
    });
    return tours.map(mapPrismaTourToPreview).filter(t => isTourRelevant(t as unknown as Tour));
  } catch (error) {
    console.error(`Ошибка получения туров категории ${categorySlug}:`, error);
    return [];
  }
});

// Полный запрос одного тура для страницы (Остается без изменений)
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

//   ИЗМЕНЕНО: Возвращает TourPreview[], фильтрация актуальных дат в БД
export const getSimilarTours = cache(async (
  categoryId: string | null,
  excludeId: string,
  limit: number = 3
): Promise<TourPreview[]> => {
  if (!categoryId) return [];
  try {
    const now = today();
    const tours = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        categoryId: categoryId,
        id: { not: excludeId },
        OR: [
          { tourDates: { some: { startDate: { gte: now } } } },
          { tourDates: { some: { endDate: { gte: now } } } },
          { tourDates: { none: {} } }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { 
        guide: true, 
        category: true,
        tourDates: { orderBy: { startDate: 'asc' }, take: 3 } 
      }
    });
    return tours.map(mapPrismaTourToPreview).filter(t => isTourRelevant(t as unknown as Tour));
  } catch (error) {
    console.error('Ошибка получения похожих туров:', error);
    return [];
  }
});

// Админка — все туры без фильтрации по датам и isActive (Остается без изменений)
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