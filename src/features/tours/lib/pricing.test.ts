// src/features/tours/lib/pricing.test.ts
import { describe, it, expect } from '@jest/globals';
import { calculateTotalSpots, calculateBasePrice, SPOTS_PER_FAMILY } from './pricing';

describe('Pricing Utilities', () => {

  describe('calculateTotalSpots', () => {
    it('считает простые одиночные билеты', () => {
      const tickets = { ticketsAdult: 2, ticketsChild: 1, ticketsMember: 0, ticketsFamily: 0 };
      expect(calculateTotalSpots(tickets)).toBe(3);
    });

    it(`учитывает, что 1 семейный билет дает ${SPOTS_PER_FAMILY} посадочных места`, () => {
      const tickets = { ticketsAdult: 0, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 2 };
      expect(calculateTotalSpots(tickets)).toBe(6);
    });

    it('корректно считает смешанный вариант', () => {
      const tickets = { ticketsAdult: 1, ticketsChild: 1, ticketsMember: 1, ticketsFamily: 1 };
      expect(calculateTotalSpots(tickets)).toBe(1 + 1 + 1 + 3); // 6 мест
    });
  });

  describe('calculateBasePrice', () => {
    const prices = { priceAdult: 1000, priceChild: 500, priceMember: 800, priceFamily: 2500 };

    it('считает сумму по всем выбранным тарифам', () => {
      const tickets = { ticketsAdult: 2, ticketsChild: 1, ticketsMember: 0, ticketsFamily: 1 };
      const total = calculateBasePrice(tickets, prices);
      // (2 * 1000) + (1 * 500) + (0 * 800) + (1 * 2500) = 5000
      expect(total).toBe(5000);
    });

    it('корректно работает, если количество некоторых билетов равно 0', () => {
      const tickets = { ticketsAdult: 0, ticketsChild: 0, ticketsMember: 1, ticketsFamily: 0 };
      const total = calculateBasePrice(tickets, prices);
      expect(total).toBe(800);
    });
  });

});