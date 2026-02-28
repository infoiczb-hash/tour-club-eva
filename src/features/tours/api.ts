"use server";

import { prisma } from '@/lib/prisma';
import { Tour } from './types'; 

// ==========================================
// 1. АДАПТЕР (Prisma DB -> Frontend Type)
// ==========================================
function mapPrismaTourToFrontend(item: any): Tour {
  // 1. Работаем с датами (защита от null)
  const dates = Array.isArray(item.dates) ? item.dates : [];
  const firstDate = dates[0] || {};

  // 2. Хелпер для JSON полей (гарантирует массив)
  const ensureArray = (val: any) => Array.isArray(val) ? val : [];

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle || null,
    
    // 👇 ВОЗВРАЩАЕМ СЫРОЕ ОПИСАНИЕ
    description: item.description || "",
    
    type: item.type,
    difficulty: item.difficulty || 'medium',
    label: item.label || null,
    tags: item.tags || [], // Prisma возвращает массив строк, всё ок
    
    location: item.location,
    // Формируем строковые даты для карточки
    date: firstDate.start ? new Date(firstDate.start).toISOString() : '', 
    // 👇 БЕРЕМ ДАТУ КОНЦА ИЗ ПЕРВОЙ ДАТЫ МАССИВА
    endDate: firstDate.end ? new Date(firstDate.end).toISOString() : null,
    
    // 👇 ВОЗВРАЩАЕМ ПОЛНЫЙ МАССИВ ДАТ
    dates: dates,

    duration: item.duration || null,
    distance: item.distance || null,
    meetingPoint: item.meetingPoint || null,
    
    // 👇 ДОБАВЛЕНО: Маршрут
    route: item.route || null,

    // === ФИНАНСЫ (Исправлено: везде используем item) ===
   // ...
    // === ФИНАНСЫ ===
    price: Number(item.price) || 0,
    currency: item.currency || 'RUB',
    
    // 🔥 ФИКС: Проверяем оба варианта написания (camelCase и snake_case)
    // Prisma после 'db pull' может вернуть как item.price_old, так и item.priceOld
    priceOld: item.priceOld ? Number(item.priceOld) : (item.price_old ? Number(item.price_old) : null),
    
    priceChild: item.priceChild ? Number(item.priceChild) : (item.price_child ? Number(item.price_child) : null),
    
    priceFamily: item.priceFamily ? Number(item.priceFamily) : (item.price_family ? Number(item.price_family) : null),
    
    priceMember: item.priceMember ? Number(item.priceMember) : (item.price_member ? Number(item.price_member) : null),
    // ...

    // === СТАТИСТИКА ===
    spots: item.spots || 15,
    spotsLeft: item.spotsLeft ?? item.spots ?? 15,
    
    // Медиа
    image: item.coverImage || null, // UI ждет image
    gallery: item.gallery || [],
    
    // 👇 БЕЗОПАСНЫЙ МАППИНГ JSON ПОЛЕЙ
    program: item.program, 
    faq: ensureArray(item.faq),
    highlights: ensureArray(item.highlights),
    checklist: ensureArray(item.checklist),
    documents: ensureArray(item.documents),
    
    included: item.included || [],
    additionalExpenses: item.additionalExpenses || [],
    
    // Гид (привязанный к туру)
    guide: item.guide ? {
      id: item.guide.id,
      name: item.guide.name,
      image: item.guide.image,
      role: item.guide.role,
      instagram: item.guide.instagram,
      bio: item.guide.bio,
      telegram: item.guide.telegram // Добавили телеграм, если есть
    } : null,
    
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ==========================================
// 2. ПОЛУЧИТЬ АКТИВНЫЕ ТУРЫ (Для сайта)
// ==========================================
export async function getTours() {
  try {
    const tours = await prisma.tour.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { guide: true } // 🔥 ВАЖНО: Подгружаем гида
    });
    
    return tours.map(mapPrismaTourToFrontend);
  } catch (error) {
    console.error("Ошибка получения туров:", error);
    return [];
  }
}

// ==========================================
// 3. ПОЛУЧИТЬ ОДИН ТУР (По Slug)
// ==========================================
export async function getTourBySlug(slug: string) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { slug: slug },
      include: { guide: true } // 🔥 ВАЖНО: Подгружаем гида
    });

    if (!tour) return null;
    return mapPrismaTourToFrontend(tour);
  } catch (error) {
    console.error(`Ошибка получения тура ${slug}:`, error);
    return null;
  }
}

// ==========================================
// 4. СОЗДАТЬ БРОНЬ (Booking Action)
// ==========================================
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

// ==========================================
// 5. ПОЛУЧИТЬ СПИСОК ГИДОВ
// ==========================================
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

// ==========================================
// 6. ВСЕ ТУРЫ (Для Админки)
// ==========================================
export async function getAllTours() {
  try {
    const tours = await prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: { guide: true } 
    });
    
    return tours.map(mapPrismaTourToFrontend);
  } catch (error) {
    console.error("Ошибка получения всех туров для админки:", error);
    return [];
  }
}