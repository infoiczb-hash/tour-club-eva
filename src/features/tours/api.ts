"use server";

import { prisma } from '@/lib/prisma';
import { Tour } from './types'; 

function mapPrismaTourToFrontend(item: any): Tour {
  const dates = Array.isArray(item.dates) ? item.dates : [];
  const firstDate = dates[0] || {};
  const ensureArray = (val: any) => Array.isArray(val) ? val : [];

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle || null,
    description: item.description || "",
    
    categoryId: item.categoryId || null,
    category: item.category ? {
      id: item.category.id,
      title: item.category.title,
      slug: item.category.slug,
      icon: item.category.icon,
      color: item.category.color || 'slate', // ✅ ДОБАВИЛИ ЦВЕТ ИЗ БАЗЫ
    } : null,
    
    difficulty: item.difficulty || 'medium',
    label: item.label || null,
    tags: item.tags || [], 
    location: item.location,
    date: firstDate.start ? new Date(firstDate.start).toISOString() : '', 
    endDate: firstDate.end ? new Date(firstDate.end).toISOString() : null,
    dates: dates,
    duration: item.duration || null,
    distance: item.distance || null,
    meetingPoint: item.meetingPoint || null,
    route: item.route || null,

    price: Number(item.price) || 0,
    currency: item.currency || 'RUB',
    priceOld: item.priceOld ? Number(item.priceOld) : (item.price_old ? Number(item.price_old) : null),
    priceChild: item.priceChild ? Number(item.priceChild) : (item.price_child ? Number(item.price_child) : null),
    priceFamily: item.priceFamily ? Number(item.priceFamily) : (item.price_family ? Number(item.price_family) : null),
    priceMember: item.priceMember ? Number(item.priceMember) : (item.price_member ? Number(item.price_member) : null),

    spots: item.spots || 15,
    spotsLeft: item.spotsLeft ?? item.spots ?? 15,
    
    image: item.coverImage || null,
    gallery: item.gallery || [],
    
    program: item.program, 
    faq: ensureArray(item.faq),
    highlights: ensureArray(item.highlights),
    checklist: ensureArray(item.checklist),
    documents: ensureArray(item.documents),
    
    included: item.included || [],
    additionalExpenses: item.additionalExpenses || [],
    
    guide: item.guide ? {
      id: item.guide.id,
      name: item.guide.name,
      image: item.guide.image,
      role: item.guide.role,
      instagram: item.guide.instagram,
      bio: item.guide.bio,
      telegram: item.guide.telegram 
    } : null,
    
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getTours() {
  try {
    const tours = await prisma.tour.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { guide: true, category: true } // ✅ Подгружаем категории
    });
    return tours.map(mapPrismaTourToFrontend);
  } catch (error) {
    console.error("Ошибка получения туров:", error);
    return [];
  }
}

export async function getTourBySlug(slug: string) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { slug: slug },
      include: { guide: true, category: true } // ✅ Подгружаем категории
    });

    if (!tour) return null;
    return mapPrismaTourToFrontend(tour);
  } catch (error) {
    console.error(`Ошибка получения тура ${slug}:`, error);
    return null;
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
        tickets: params.tickets as any,
        totalPrice: params.totalPrice,
        status: 'pending',
        bookedDate: params.bookedDate, 
      }
    });
    return { success: true, data: booking };
  } catch (error: any) {
    console.error("❌ Ошибка бронирования:", error.message);
    return { success: false, error: "Не удалось создать бронь" };
  }
}

export const bookEvent = createBookingAction;

export async function getGuides() {
  try {
    const guides = await prisma.guide.findMany({
      where: { isActive: true },
      select: { id: true, name: true, image: true, role: true },
      orderBy: { name: 'asc' }
    });
    return guides;
  } catch (error) {
    console.error("Ошибка загрузки гидов:", error);
    return [];
  }
}

export async function getAllTours() {
  try {
    const tours = await prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: { guide: true, category: true } // ✅ Подгружаем категории
    });
    return tours.map(mapPrismaTourToFrontend);
  } catch (error) {
    console.error("Ошибка получения всех туров для админки:", error);
    return [];
  }
}