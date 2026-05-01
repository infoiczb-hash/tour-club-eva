// src/utils/date.test.ts
import { describe, it, expect } from '@jest/globals'
import { formatTourDate, getTourDuration } from './date'

describe('formatTourDate', () => {
  it('возвращает "Дата уточняется" если дата не передана', () => {
    expect(formatTourDate('')).toBe('Дата уточняется')
  })

  it('форматирует одну дату без конечной', () => {
    const result = formatTourDate('2024-02-20')
    expect(result).toContain('февраля')
    expect(result).toContain('20')
  })

  it('форматирует даты в одном месяце (20 — 25 февраля)', () => {
    const result = formatTourDate('2024-02-20', '2024-02-25')
    expect(result).toContain('20')
    expect(result).toContain('25')
    expect(result).toContain('февраля')
  })

  it('форматирует даты в разных месяцах (28 февраля — 2 марта)', () => {
    const result = formatTourDate('2024-02-28', '2024-03-02')
    expect(result).toContain('февраля')
    expect(result).toContain('марта')
  })

  // ✅ ДОБАВЛЕНО: Обработка перехода года
  it('корректно обрабатывает даты в разных годах (Новогодние туры)', () => {
    const result = formatTourDate('2024-12-31', '2025-01-02')
    expect(result).toContain('декабря')
    expect(result).toContain('января')
  })

  it('возвращает "Дата уточняется" при невалидной дате', () => {
    expect(formatTourDate('invalid-date', 'invalid-date')).toBe('Дата уточняется')
  })
})

describe('getTourDuration', () => {
  it('возвращает duration если он задан вручную', () => {
    expect(getTourDuration({ duration: '5 дней' })).toBe('5 дней')
  })

  it('считает длительность по датам', () => {
    const result = getTourDuration({
      date: '2024-02-20',
      endDate: '2024-02-25',
    })
    expect(result).toBe('6 дн.')
  })

  // ✅ ДОБАВЛЕНО: Точная проверка разницы ровно в 1 день (с ночевкой)
  it('считает дни правильно при startDate и endDate в разнице 1 день (с ночевкой)', () => {
    const tour = { date: '2024-02-20', endDate: '2024-02-21' }
    // 20 число (1 день) + 21 число (2 день) = 2 дня
    expect(getTourDuration(tour)).toBe('2 дн.')
  })

  it('возвращает 1 день если даты совпадают (без ночевки)', () => {
    const result = getTourDuration({
      date: '2024-02-20',
      endDate: '2024-02-20',
    })
    expect(result).toBe('1 день')
  })

  it('возвращает "1 день" если нет дат и duration', () => {
    expect(getTourDuration({})).toBe('1 день')
  })
})