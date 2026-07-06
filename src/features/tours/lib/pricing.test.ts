// src/features/tours/lib/pricing.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  calculateTotalSpots,
  calculateBasePrice,
  SPOTS_PER_FAMILY,
  buildTicketBreakdown,
  calculateTotalSpotsFromBreakdown,
  calculateBasePriceFromBreakdown,
  findViolatedMinQuantity,
  mapBreakdownToLegacyTickets,
} from './pricing';

describe('Pricing Utilities', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // V1: ТЕСТЫ ДЛЯ СТАРЫХ ФУНКЦИЙ (Legacy)
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // V2: ТЕСТЫ ДЛЯ НОВЫХ ФУНКЦИЙ (TourPriceCategory)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Управляемые категории цен (TourPriceCategory)', () => {
    const categories = [
      { id: 'cat-adult', key: 'adult', label: 'Стандарт', price: 1000, spotsPerUnit: 1 },
      { id: 'cat-k2', key: 'kayak_2', label: 'Байдарка 2-местная', price: 1800, spotsPerUnit: 2 },
      { id: 'cat-k3', key: 'kayak_3', label: 'Байдарка 3-местная', price: 2400, spotsPerUnit: 3 },
    ];

    describe('buildTicketBreakdown', () => {
      it('собирает разбивку только по выбранным категориям с qty > 0', () => {
        const breakdown = buildTicketBreakdown(categories, [
          { categoryId: 'cat-adult', qty: 0 },
          { categoryId: 'cat-k2', qty: 2 },
        ]);
        expect(breakdown).toHaveLength(1);
        expect(breakdown[0]).toMatchObject({ categoryId: 'cat-k2', key: 'kayak_2', qty: 2, unitPrice: 1800, spotsPerUnit: 2 });
      });

      it('игнорирует категории, которых нет в справочнике (защита от подмены id)', () => {
        const breakdown = buildTicketBreakdown(categories, [{ categoryId: 'unknown-id', qty: 3 }]);
        expect(breakdown).toHaveLength(0);
      });
    });

    describe('calculateTotalSpotsFromBreakdown / calculateBasePriceFromBreakdown', () => {
      it('без принудительного "1 взрослый" — можно бронировать только байдарки', () => {
        const breakdown = buildTicketBreakdown(categories, [{ categoryId: 'cat-k2', qty: 2 }]);
        // 2 лодки по 2 места = 4 места, без единого "взрослого" билета
        expect(calculateTotalSpotsFromBreakdown(breakdown)).toBe(4);
        expect(calculateBasePriceFromBreakdown(breakdown)).toBe(3600);
      });

      it('корректно считает смешанный набор из нескольких категорий', () => {
        const breakdown = buildTicketBreakdown(categories, [
          { categoryId: 'cat-k2', qty: 1 },
          { categoryId: 'cat-k3', qty: 1 },
        ]);
        expect(calculateTotalSpotsFromBreakdown(breakdown)).toBe(2 + 3);
        expect(calculateBasePriceFromBreakdown(breakdown)).toBe(1800 + 2400);
      });
    });

    describe('findViolatedMinQuantity', () => {
      const activeCategories = [
        { id: 'cat-adult', label: 'Взрослый', minQuantity: 0 },
        { id: 'cat-required', label: 'Обязательный сбор', minQuantity: 1 },
      ];

      it('возвращает null, если минимумы соблюдены', () => {
        const violated = findViolatedMinQuantity(activeCategories, [
          { categoryId: 'cat-required', qty: 1 },
        ]);
        expect(violated).toBeNull();
      });

      it('находит категорию с нарушенным минимумом', () => {
        const violated = findViolatedMinQuantity(activeCategories, [
          { categoryId: 'cat-adult', qty: 5 },
        ]);
        expect(violated?.id).toBe('cat-required');
      });
    });

    describe('mapBreakdownToLegacyTickets', () => {
      it('маппит известные ключи в старые колонки', () => {
        const breakdown = buildTicketBreakdown(
          [
            { id: '1', key: 'adult', label: 'Взрослый', price: 1000, spotsPerUnit: 1 },
            { id: '2', key: 'child', label: 'Детский', price: 500, spotsPerUnit: 1 },
            { id: '3', key: 'family', label: 'Семейный', price: 2500, spotsPerUnit: 3 },
            { id: '4', key: 'member', label: 'Клубный', price: 800, spotsPerUnit: 1 },
          ],
          [
            { categoryId: '1', qty: 2 },
            { categoryId: '2', qty: 1 },
            { categoryId: '3', qty: 1 },
            { categoryId: '4', qty: 3 },
          ]
        );
        expect(mapBreakdownToLegacyTickets(breakdown)).toEqual({
          ticketsAdult: 2,
          ticketsChild: 1,
          ticketsFamily: 1,
          ticketsMember: 3,
        });
      });

      it('нестандартные категории (например, байдарки) складывает в ticketsAdult С УЧЕТОМ ЗАНИМАЕМЫХ МЕСТ', () => {
        const breakdown = buildTicketBreakdown(categories, [
          { categoryId: 'cat-k2', qty: 2 }, // 2 билета * 2 места = 4 места
          { categoryId: 'cat-k3', qty: 1 }, // 1 билет * 3 места = 3 места
        ]);
        expect(mapBreakdownToLegacyTickets(breakdown)).toEqual({
          // ИСПРАВЛЕНО: ожидаем 4 + 3 = 7 мест (защита от овербукинга)
          ticketsAdult: 7, 
          ticketsChild: 0,
          ticketsFamily: 0,
          ticketsMember: 0,
        });
      });
    });
  });

});