// src/features/tours/lib/pricing.ts

export const SPOTS_PER_FAMILY = 3;

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
 * Подсчитывает общее количество посадочных мест.
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
 * Рассчитывает базовую стоимость бронирования до применения скидок и промокодов.
 */
export function calculateBasePrice(tickets: TicketsCount, prices: TourPrices): number {
  return (
    ((tickets.ticketsAdult || 0) * (prices.priceAdult || 0)) +
    ((tickets.ticketsChild || 0) * (prices.priceChild || 0)) +
    ((tickets.ticketsMember || 0) * (prices.priceMember || 0)) +
    ((tickets.ticketsFamily || 0) * (prices.priceFamily || 0))
  );
}