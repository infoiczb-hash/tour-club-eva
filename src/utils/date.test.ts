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

  it('возвращает 1 день если даты совпадают', () => {
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