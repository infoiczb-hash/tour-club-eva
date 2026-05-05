// src/lib/tour-formatting.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  formatProgramForSlide,
  formatChecklistForSlide,
  formatIncludedForSlide,
  formatLogisticsForSlide,
} from './tour-formatting';

describe('tour-formatting utilities', () => {
  
  describe('formatProgramForSlide', () => {
    it('возвращает строку из сложного массива дней', () => {
      // Подстраиваем мок под ожидаемый тип
      const program = [
        { day: 1, title: 'Прибытие', activities: [{ time: '09:00', title: 'Заезд' }] },
        { day: 2, title: 'Восхождение', activities: [{ title: 'Треккинг' }] },
      ];
      // Используем as any, если в твоем типе TourProgramDay есть дополнительные обязательные поля
      const result = formatProgramForSlide(program as any);
      expect(result).toContain('День 1. Прибытие');
      expect(result).toContain('09:00 — Заезд');
      expect(result).toContain('День 2. Восхождение');
      expect(result).toContain('Треккинг');
    });

    it('обрабатывает старый формат данных (просто строка)', () => {
      // TS ругается на строку, но мы проверяем рантайм-защиту, поэтому ставим as any
      const result = formatProgramForSlide('Старая программа без массива' as any);
      expect(result).toBe('Старая программа без массива');
    });

    it('возвращает fallback-текст, если программа пуста или null', () => {
      expect(formatProgramForSlide(null as any)).toBe('Программа уточняется');
      expect(formatProgramForSlide([] as any)).toBe('Программа уточняется');
    });
  });

  describe('formatChecklistForSlide', () => {
    it('форматирует детальный массив категорий', () => {
      // Ошибка TS говорила, что items должен быть string, а не string[].
      // Исправляем мок, чтобы он соответствовал твоей схеме:
      const checklist = [
        { title: 'Одежда', items: 'Куртка\nШтаны' },
        { title: 'Обувь', items: 'Ботинки' },
      ];
      const result = formatChecklistForSlide(checklist as any);
      // Проверяем, что функция корректно склеивает это в текст
      expect(result).toContain('Одежда');
      expect(result).toContain('Куртка');
      expect(result).toContain('Обувь');
    });

    it('обрабатывает плоский массив строковых элементов (рантайм защита)', () => {
      const checklist = ['Документы', 'Аптечка'];
      const result = formatChecklistForSlide(checklist as any);
      expect(result).toBe('• Документы\n• Аптечка');
    });

    it('возвращает fallback для пустого списка', () => {
      expect(formatChecklistForSlide([] as any)).toBe('Список вещей уточняется');
    });
  });

  describe('formatIncludedForSlide', () => {
    it('форматирует детальную структуру с ценами/статусами', () => {
      const detailed = [
        { title: 'Питание', items: [{ label: 'Завтрак', price: 'вкл' }] },
      ];
      const result = formatIncludedForSlide(detailed as any, []);
      expect(result).toContain('• Питание:');
      expect(result).toContain('- Завтрак (вкл)');
    });

    it('использует старый плоский массив как fallback', () => {
      const result = formatIncludedForSlide(null as any, ['Трансфер', 'Страховка']);
      expect(result).toBe('• Трансфер\n• Страховка');
    });
  });

  describe('formatLogisticsForSlide', () => {
    it('корректно собирает поля из объекта тура в иконки', () => {
      const tour = {
        meetingPoint: 'Цирк, Кишинёв',
        location: 'Кишинёв',
        duration: '3 дня',
        route: 'Кишинёв – Орхей',
        guide: { name: 'Роман' },
      };
      const result = formatLogisticsForSlide(tour as any);
      expect(result).toContain('Место сбора: Цирк, Кишинёв');
      expect(result).toContain('Длительность: 3 дня');
      expect(result).toContain('Маршрут: Кишинёв – Орхей');
      expect(result).toContain('Гид: Роман');
    });
  });
});