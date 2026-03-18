// src/features/tours/api.ts
"use server";

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Tour } from './types';
import { cache } from 'react';

// ─────────────────────────────────────────────
// Строгий тип для данных из Prisma с релейшенами
// ─────────────────────────────────────────────
type PrismaTourWithRelations = Prisma.TourGetPayload<{
  include: { guide: true; category: true; tourDates: true }; // ✅ ДОБАВЛЕНО: tourDates
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
// Маппер Prisma → фронтенд Tour
// ─────────────────────────────────────────────
function mapPrismaTourToFrontend(item: PrismaTourWithRelations): Tour {
  // ✅ 1. Читаем новые реляционные даты из базы
  const relationalDates = item.tourDates?.map(td => ({
    id: td.id, 
    start: td.startDate.toISOString(),
    end: td.endDate ? td.endDate.toISOString() : undefined,
    time: td.time || undefined,
    spots: td.spots,
    spotsLeft: td.spotsLeft,
    guide_id: td.guideId || undefined,
    basePrice: td.basePrice,
    // 👇 ВОССТАНОВИЛИ ПОЛЯ ДЛЯ ФОРМЫ (Динамические цены)
    discountEarlyBird: td.discountEarlyBird,
    earlyBirdDeadline: td.earlyBirdDeadline,
    surchargeLastMinute: td.surchargeLastMinute,
    lastMinuteTrigger: td.lastMinuteTrigger,
  })) || [];

  // ✅ 2. Фолбэк на старые JSON-даты (для обратной совместимости)
  const legacyDates = ensureArray(item.dates as any);

  // Сливаем, если нужны обе, но лучше брать реляционные, если они есть
  const datesToUse = relationalDates.length > 0 ? relationalDates : legacyDates;

  // Ближайшая актуальная дата — используется в карточке, Hero и календаре.
  // Фолбэк на первую дату если все прошли (страница тура должна быть доступна).
  const nearestDate = getNearestFutureDate(datesToUse) ?? datesToUse[0] ?? null;

  // Места берём с ближайшей актуальной даты если она есть,
  // иначе — глобальное поле тура.
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

    // Всегда ближайшая актуальная дата — карточка, Hero, календарь
    date: nearestDate?.start
      ? new Date(nearestDate.start).toISOString()
      : '',
    endDate: nearestDate?.end
      ? new Date(nearestDate.end).toISOString()
      : null,
    // Полный массив дат — для TourDates (бронирование)
    dates: datesToUse,

    duration: item.duration ?? null,
    distance: item.distance ?? null,
    meetingPoint: item.meetingPoint ?? null,
    route: item.route ?? null,

    // ✅ ДОБАВЛЕНЫ НОВЫЕ ХАРАКТЕРИСТИКИ С ФОЛБЭКОМ НА NULL
    tourFormat: item.tourFormat ?? null,
    accommodation: item.accommodation ?? null,
    groupInfo: item.groupInfo ?? null,
    importantInfo: item.importantInfo ?? null,
    includedDetailed: item.includedDetailed ?? null,
    excludedDetailed: item.excludedDetailed ?? null,

    // 👇 ВОССТАНОВИЛИ SEO-ПОЛЯ
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

    // ensureArray защищает от null/undefined при .map() в компонентах
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

// ─────────────────────────────────────────────
// Фильтр: убирает туры у которых все даты прошли.
// Анонс без дат (dates: [], date: '') — пропускаем.
// ─────────────────────────────────────────────
function isTourRelevant(tour: Tour): boolean {
  const hasDatesArray = Array.isArray(tour.dates) && tour.dates.length > 0;
  const hasLegacyDate =
    typeof tour.date === 'string' ? tour.date.length > 0 : !!tour.date;

  // Анонс без дат — показываем
  if (!hasDatesArray && !hasLegacyDate) return true;

  const now = today();

  // Есть массив dates — хотя бы одна должна быть в будущем
  if (hasDatesArray) {
    return tour.dates!.some((d: any) => {
        const end = d.end ? new Date(d.end) : new Date(d.start);
        end.setHours(0, 0, 0, 0);
        return end >= now;
    });
  }

  // Фолбэк на legacy поле date
  const d = new Date(tour.date);
  d.setHours(0, 0, 0, 0);
  return d >= now;
}

// ─────────────────────────────────────────────
// Публичные функции
// ─────────────────────────────────────────────

// Публичный каталог — только активные туры с актуальными датами
export async function getTours(): Promise<Tour[]> {
  try {
    const tours = await prisma.tour.findMany({
      where: { isActive: true, deletedAt: null }, // ✅ ДОБАВЛЕНО: Soft Delete
      orderBy: { createdAt: 'desc' },
      include: { 
        guide: true, 
        category: true,
        tourDates: { orderBy: { startDate: 'asc' } } // ✅ ДОБАВЛЕНО: Даты
      },
    });
    return tours.map(mapPrismaTourToFrontend).filter(isTourRelevant);
  } catch (error) {
    console.error('Ошибка получения туров:', error);
    return [];
  }
}

// ✅ ИСПРАВЛЕНИЕ: Обернули в cache() для дедупликации запросов между metadata и page
export const getTourBySlug = cache(async (slug: string): Promise<Tour | null> => {
  try {
    const tour = await prisma.tour.findFirst({ // ✅ ИСПРАВЛЕНО: findFirst вместо findUnique (из-за deletedAt)
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

// ✅ ИСПРАВЛЕНИЕ: Точечный и быстрый запрос похожих туров на уровне БД
export async function getSimilarTours(categoryId: string | null, excludeId: string, limit: number = 3): Promise<Tour[]> {
  if (!categoryId) return [];
  try {
    const tours = await prisma.tour.findMany({
      where: {
        isActive: true,
        deletedAt: null, // ✅ ДОБАВЛЕНО: Soft Delete
        categoryId: categoryId,
        id: { not: excludeId }
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { 
        guide: true, 
        category: true,
        tourDates: { orderBy: { startDate: 'asc' } } 
      }
    });
    return tours.map(mapPrismaTourToFrontend).filter(isTourRelevant);
  } catch (error) {
    console.error('Ошибка получения похожих туров:', error);
    return [];
  }
}

// Админка — все туры без фильтрации по датам и isActive
export async function getAllTours(): Promise<Tour[]> {
  try {
    const tours = await prisma.tour.findMany({
      where: { deletedAt: null }, // ✅ ДОБАВЛЕНО: Скрываем из админки Soft Delete туры
      orderBy: { createdAt: 'desc' },
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

// ✅ Старый экшен для бронирования (оставлен для совместимости, но адаптирован к плоским полям)
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