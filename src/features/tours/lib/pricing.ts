// src/features/tours/lib/pricing.ts

export const SPOTS_PER_FAMILY = 3;

// ─────────────────────────────────────────────────────────────────────────────
// V1: СТАРЫЕ ИНТЕРФЕЙСЫ (Legacy) — НЕ УДАЛЯТЬ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketsCount {
  ticketsAdult: number;
  ticketsChild: number;
  ticketsMember: number;
  ticketsFamily: number;
}

export interface TourPrices {
  priceAdult: number;
  priceChild: number;
  priceMember: number;
  priceFamily: number;
}

/**
 * Подсчитывает общее количество посадочных мест по старой схеме.
 * Семейный билет (ticketsFamily) дает 3 места.
 */
export function calculateTotalSpots(tickets: TicketsCount): number {
  return (
    (tickets.ticketsAdult || 0) +
    (tickets.ticketsChild || 0) +
    (tickets.ticketsMember || 0) +
    ((tickets.ticketsFamily || 0) * SPOTS_PER_FAMILY)
  );
}

/**
 * Рассчитывает базовую стоимость по старой схеме.
 */
export function calculateBasePrice(tickets: TicketsCount, prices: TourPrices): number {
  return (
    ((tickets.ticketsAdult || 0) * (prices.priceAdult || 0)) +
    ((tickets.ticketsChild || 0) * (prices.priceChild || 0)) +
    ((tickets.ticketsMember || 0) * (prices.priceMember || 0)) +
    ((tickets.ticketsFamily || 0) * (prices.priceFamily || 0))
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// V2.1: УПРАВЛЯЕМЫЕ КАТЕГОРИИ ЦЕН (TourPriceCategory)
// Заменяет фиксированные поля на полиморфную корзину
// ─────────────────────────────────────────────────────────────────────────────

export interface PriceCategoryLike {
  id: string;
  key: string;
  label: string;
  price: number;
  spotsPerUnit: number;
}

export interface TicketSelection {
  categoryId: string;
  qty: number;
}

export interface TicketBreakdownItem {
  categoryId: string;
  key: string;
  label: string;
  qty: number;
  unitPrice: number;
  spotsPerUnit: number;
}

/**
 * ЗАЩИТА ОТ ПОДМЕНЫ ЦЕН (Anti-Spoofing):
 * Собирает разбивку бронирования из справочника категорий тура (БД) и выбора пользователя.
 * Категории с qty <= 0 или отсутствующие в справочнике молча отбрасываются.
 */
export function buildTicketBreakdown(
  categories: PriceCategoryLike[],
  selections: TicketSelection[]
): TicketBreakdownItem[] {
  const qtyByCategory = new Map<string, number>();
  for (const s of selections) {
    if (s.qty > 0) qtyByCategory.set(s.categoryId, (qtyByCategory.get(s.categoryId) || 0) + s.qty);
  }

  return categories
    .filter((c) => qtyByCategory.has(c.id))
    .map((c) => ({
      categoryId: c.id,
      key: c.key,
      label: c.label,
      qty: qtyByCategory.get(c.id)!,
      unitPrice: c.price,
      spotsPerUnit: c.spotsPerUnit,
    }));
}

/** Общее число посадочных мест по новой разбивке. */
export function calculateTotalSpotsFromBreakdown(
  breakdown: Array<{ qty: number; spotsPerUnit: number }>
): number {
  return breakdown.reduce((sum, item) => sum + item.qty * item.spotsPerUnit, 0);
}

/** Итоговая базовая сумма по новой разбивке. */
export function calculateBasePriceFromBreakdown(
  breakdown: Array<{ qty: number; unitPrice: number }>
): number {
  return breakdown.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

/**
 * Проверяет соблюдение minQuantity для каждой активной категории тура.
 * Возвращает null если всё ок, иначе — объект категории-нарушителя для текста ошибки.
 */
export function findViolatedMinQuantity(
  activeCategories: Array<{ id: string; label: string; minQuantity: number }>,
  selections: TicketSelection[]
): { id: string; label: string; minQuantity: number } | null {
  const qtyByCategory = new Map<string, number>();
  for (const s of selections) {
    qtyByCategory.set(s.categoryId, (qtyByCategory.get(s.categoryId) || 0) + s.qty);
  }
  for (const cat of activeCategories) {
    const selectedQty = qtyByCategory.get(cat.id) || 0;
    if (selectedQty < cat.minQuantity) return cat;
  }
  return null;
}

/**
 * LEGACY FALLBACK (ЗАЩИТА ОТ ОВЕРБУКИНГА):
 * Best-effort маппинг новой разбивки в старые 4 legacy-колонки Booking —
 * ТОЛЬКО для того, чтобы старые SQL-запросы агрегации мест не показывали нули.
 */
export function mapBreakdownToLegacyTickets(breakdown: TicketBreakdownItem[]): TicketsCount {
  const legacy: TicketsCount = { ticketsAdult: 0, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0 };
  for (const item of breakdown) {
    switch (item.key) {
      case 'adult':
        legacy.ticketsAdult += item.qty;
        break;
      case 'child':
        legacy.ticketsChild += item.qty;
        break;
      case 'family':
        legacy.ticketsFamily += item.qty;
        break;
      case 'member':
        legacy.ticketsMember += item.qty;
        break;
      default:
        // ИСПРАВЛЕНА ОШИБКА: Для кастомных (байдарки и др.) берем не кол-во билетов, 
        // а реальное количество мест, и кидаем во взрослых.
        legacy.ticketsAdult += (item.qty * item.spotsPerUnit);
    }
  }
  return legacy;
}

// ─────────────────────────────────────────────────────────────────────────────
// НОВАЯ ЛОГИКА: ДИНАМИЧЕСКИЕ И МАРКЕТИНГОВЫЕ ЦЕНЫ (Для витрины: Сайдбар и Даты)
// ─────────────────────────────────────────────────────────────────────────────

export type PricingType = 'DEFAULT' | 'EARLY_BIRD' | 'LAST_MINUTE';

export interface DynamicPriceResult {
  price: number;
  oldPrice: number | null;
  type: PricingType;
}

// Строгая типизация для объекта даты вместо `any`
export interface TourDatePricingContext {
  basePrice?: number | null;
  startDate?: string | Date | null;
  start?: string | Date | null;
  date?: string | Date | null;
  earlyBirdDeadline?: number | null;
  discountEarlyBird?: number | null;
  lastMinuteTrigger?: number | null;
  surchargeLastMinute?: number | null;
}

/**
 * Рассчитывает актуальную стоимость тура на конкретную дату с учетом 
 * раннего бронирования (Early Bird) и горящих туров (Last Minute).
 */
export function calculateDynamicPrice(
  baseTourPrice: number, 
  tourDate: TourDatePricingContext | null | undefined
): DynamicPriceResult {
  if (!tourDate) return { price: baseTourPrice, oldPrice: null, type: 'DEFAULT' };
  
  // 1. Если для конкретной даты задана своя жесткая цена (basePrice), берем её, иначе общую цену тура
  let currentPrice = tourDate.basePrice ? Number(tourDate.basePrice) : baseTourPrice;
  let oldPrice = null;
  let type: PricingType = 'DEFAULT';

  const dateVal = tourDate.startDate || tourDate.start || tourDate.date;
  if (!dateVal) return { price: currentPrice, oldPrice, type };

  // 2. Считаем количество дней до старта тура
  const now = new Date();
  const startDate = new Date(dateVal);
  const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 3. Логика "Раннее бронирование" (Скидка)
  if (tourDate.earlyBirdDeadline && tourDate.discountEarlyBird && daysUntil >= tourDate.earlyBirdDeadline) {
    oldPrice = currentPrice;
    currentPrice -= Number(tourDate.discountEarlyBird);
    type = 'EARLY_BIRD';
  } 
  // 4. Логика "Горящий тур" (Наценка)
  else if (tourDate.lastMinuteTrigger && tourDate.surchargeLastMinute && daysUntil <= tourDate.lastMinuteTrigger) {
    // Наценка просто увеличивает цену (старую цену не зачеркиваем)
    currentPrice += Number(tourDate.surchargeLastMinute);
    type = 'LAST_MINUTE';
  }

  return { price: currentPrice, oldPrice, type };
}