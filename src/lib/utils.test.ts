import { describe, it, expect } from '@jest/globals';
import { slugify, cn, ValidationUtils } from './utils';

describe('utils', () => {
  
  describe('slugify', () => {
    it('транслитерирует русские буквы', () => {
      expect(slugify('Привет мир')).toBe('privet-mir');
      expect(slugify('Ёжик в тумане')).toBe('yozhik-v-tumane');
    });

    it('удаляет спецсимволы и знаки препинания', () => {
      expect(slugify('Hello, world!')).toBe('hello-world');
      expect(slugify('Тур & поход: лучшее (2026)')).toBe('tur-pohod-luchshee-2026');
    });

    it('приводит к нижнему регистру', () => {
      expect(slugify('ТОП Тур В Горы')).toBe('top-tur-v-gory');
    });

    it('схлопывает множественные пробелы и дефисы в один', () => {
      expect(slugify('Тур   в --- горы')).toBe('tur-v-gory');
    });

    it('обрезает дефисы по краям', () => {
      expect(slugify('-Супер тур-')).toBe('super-tur');
    });

    it('обрабатывает пустую или undefined/null строку', () => {
      expect(slugify('')).toBe('');
      // Имитируем передачу некорректных данных (например, из БД пришло null)
      expect(slugify(null as unknown as string)).toBe('');
      expect(slugify(undefined as unknown as string)).toBe('');
    });
  });

  describe('cn', () => {
    it('объединяет простые классы', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
    });

    it('разрешает конфликты Tailwind (twMerge)', () => {
      // px-2 должно быть перезаписано на px-4
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('игнорирует falsy значения (clsx)', () => {
      expect(cn('a', false && 'b', null, 'c', undefined)).toBe('a c');
    });
  });

  describe('ValidationUtils.validateRegistration', () => {
    const mockT = {
      validation: {
        nameRequired: 'Имя обязательно',
        phoneRequired: 'Телефон обязателен'
      }
    };

    it('проходит валидацию при корректных данных', () => {
      const data = { name: 'Иван', phone: '123456789', tickets: 2 };
      const errors = ValidationUtils.validateRegistration(data, 10, mockT);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('возвращает ошибки при пустых строках (name, phone)', () => {
      const data = { name: '   ', phone: '', tickets: 2 };
      const errors = ValidationUtils.validateRegistration(data, 10, mockT);
      expect(errors.name).toBe('Имя обязательно');
      expect(errors.phone).toBe('Телефон обязателен');
    });

    it('возвращает ошибку, если количество билетов меньше 1', () => {
      const data = { name: 'Иван', phone: '123', tickets: 0 };
      const errors = ValidationUtils.validateRegistration(data, 10, mockT);
      expect(errors.tickets).toBe('Минимум 1 место');
    });

    it('возвращает ошибку, если запрошено больше билетов, чем доступно мест', () => {
      const data = { name: 'Иван', phone: '123', tickets: 5 };
      const errors = ValidationUtils.validateRegistration(data, 3, mockT);
      expect(errors.tickets).toBe('Доступно только 3 мест');
    });

    it('использует дефолтные тексты ошибок, если объект перевода (t) не передан', () => {
      const data = { name: '', phone: '', tickets: 2 };
      const errors = ValidationUtils.validateRegistration(data, 10, null);
      expect(errors.name).toBe('Укажите имя');
      expect(errors.phone).toBe('Укажите телефон');
    });
  });

});