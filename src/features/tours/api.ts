// src/features/tours/api.ts
"use server";

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Tour } from './types';
import { cache } from 'react';

type PrismaTourWithRelations = Prisma.TourGetPayload<{
  include: { guide: true; category: true; tourDates: true };
}>;

const ensureArray = (val: unknown): any[] =>
  Array.isArray(val) ? val : [];

// ─── ИСПРАВЛЕНИЕ 1: today() вычисляется один раз, не на каждый тур ───────────
function getTodayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getNearestFutureDate(
  dates: { start: string; end?: string }[],
  now: Date
): { start: string; end?: string } | null {
  if (!dates || dates.length === 0) return null;

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

  return [...dates].sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  )[0];
}

// ─── ИСПРАВЛЕНИЕ 2: now передаётся снаружи — не создаётся N раз ─────────────
function mapPrismaTourToFrontend(item: PrismaTourWithRelations, now: Date): Tour {
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

  const legacyDates = ensureArray(item.dates as any);
  const datesToUse = relationalDates.length > 0 ? relationalDates : legacyDates;

  const nearestDate = getNearestFutureDate(datesToUse, now) ?? datesToUse[0] ?? null;

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

// ─────────────────────────────────────────────────────────────────────────────
// ИСПРАВЛЕНИЕ 3: Фильтрация прошедших туров перенесена в WHERE — не в JS
// ИСПРАВЛЕНИЕ 4: take: 100 — защита от полного скана при росте каталога
// isTourRelevant больше не нужен — база возвращает только актуальные туры
// ─────────────────────────────────────────────────────────────────────────────
export const getTours = cache(async (): Promise<Tour[]> => {
  try {
    const now = getTodayDate();

    const tours = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        // Туры без дат (анонсы) ИЛИ туры с хотя бы одной будущей датой
        OR: [
          { tourDates: { none: {} } },
          { tourDates: { some: { endDate: { gte: now } } } },
          { tourDates: { some: { startDate: { gte: now } } } },
        ],
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        guide: true,
        category: true,
        tourDates: { orderBy: { startDate: 'asc' } }
      },
    });

    return tours.map(t => mapPrismaTourToFrontend(t, now));
  } catch (error) {
    console.error('Ошибка получения туров:', error);
    return [];
  }
});

export const getToursByCategory = cache(async (
  categorySlug: string,
  take: number = 6
): Promise<Tour[]> => {
  try {
    const now = getTodayDate();

    const tours = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        category: { slug: categorySlug },
        OR: [
          { tourDates: { none: {} } },
          { tourDates: { some: { endDate: { gte: now } } } },
          { tourDates: { some: { startDate: { gte: now } } } },
        ],
      },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        guide: true,
        category: true,
        tourDates: { orderBy: { startDate: 'asc' }, take: 3 },
      },
    });

    return tours.map(t => mapPrismaTourToFrontend(t, now));
  } catch (error) {
    console.error(`Ошибка получения туров категории ${categorySlug}:`, error);
    return [];
  }
});

export const getTourBySlug = cache(async (slug: string): Promise<Tour | null> => {
  try {
    const now = getTodayDate();
    const tour = await prisma.tour.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: {
        guide: true,
        category: true,
        tourDates: { orderBy: { startDate: 'asc' } }
      },
    });
    if (!tour) return null;
    return mapPrismaTourToFrontend(tour, now);
  } catch (error) {
    console.error(`Ошибка получения тура ${slug}:`, error);
    return null;
  }
});

// ИСПРАВЛЕНИЕ 5: getSimilarTours обёрнут в cache() — дедупликация на странице тура
export const getSimilarTours = cache(async (
  categoryId: string | null,
  excludeId: string,
  limit: number = 3
): Promise<Tour[]> => {
  if (!categoryId) return [];
  try {
    const now = getTodayDate();
    const tours = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        categoryId,
        id: { not: excludeId },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        guide: true,
        category: true,
        // ИСПРАВЛЕНИЕ 6: берём только ближайшие 3 даты — достаточно для карточки
        tourDates: { orderBy: { startDate: 'asc' }, take: 3 },
      }
    });
    return tours.map(t => mapPrismaTourToFrontend(t, now));
  } catch (error) {
    console.error('Ошибка получения похожих туров:', error);
    return [];
  }
});

// Админка — без фильтрации по датам и isActive
export async function getAllTours(): Promise<Tour[]> {
  try {
    const now = getTodayDate();
    const tours = await prisma.tour.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        guide: true,
        category: true,
        tourDates: { orderBy: { startDate: 'asc' } }
      },
    });
    return tours.map(t => mapPrismaTourToFrontend(t, now));
  } catch (error) {
    console.error('Ошибка получения всех туров для админки:', error);
    return [];
  }
}

export async function createBookingAction(params: {
  eventId: string;
  name: string;
  phone: string;
  tickets: { adult: number; child: number; family?: number };
  totalPrice: number;
  bookedDate?: Date | null;
}) {
  try {
    const booking = await prisma.booking.create({
      data: {
        tourId: params.eventId,
        name: params.name,
        phone: params.phone,
        ticketsAdult: params.tickets.adult,
        ticketsChild: params.tickets.child,
        ticketsFamily: params.tickets.family || 0,
        totalPrice: params.totalPrice,
        status: 'pending',
        bookedDate: params.bookedDate,
      },
    });
    return { success: true, data: booking };
  } catch (error: any) {
    console.error('❌ Ошибка бронирования:', error.message);
    return { success: false, error: 'Не удалось создать бронь' };
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