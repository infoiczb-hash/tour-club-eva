// src/utils/date.ts

/**
 * Форматирует даты тура в красивую строку.
 * @example "20 февраля" или "20 — 25 февраля" или "28 февраля — 2 марта"
 */
export function formatTourDate(date: string | Date, endDate?: string | Date | null): string {
  if (!date) return 'Дата уточняется';

  const start = new Date(date);
  
  // Форматтеры
  const ruDateFull = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const ruDayOnly = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });

  // Если нет конечной даты или она совпадает с начальной
  if (!endDate) {
    return ruDateFull.format(start);
  }

  const end = new Date(endDate);

  // Проверка на валидность дат
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Дата уточняется';

  // Если месяцы совпадают (20 — 25 февраля)
  if (start.getMonth() === end.getMonth()) {
    return `${ruDayOnly.format(start)} — ${ruDateFull.format(end)}`;
  }

  // Если месяцы разные (28 февраля — 2 марта)
  return `${ruDateFull.format(start)} — ${ruDateFull.format(end)}`;
}

/**
 * Вычисляет длительность тура, если она не задана вручную.
 * @example "3 дня"
 */
export function getTourDuration(tour: any): string {
  // 1. Если длительность уже прописана в админке текстом — возвращаем её
  if (tour.duration) return tour.duration;

  // 2. Если есть даты, считаем математически
  if (tour.date && tour.endDate) {
    const start = new Date(tour.date).getTime();
    const end = new Date(tour.endDate).getTime();
    
    // Разница в миллисекундах -> дни
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Если разница 0 (один день), пишем 1 день. Иначе +1 (включительно)
    const totalDays = diffDays < 1 ? 1 : diffDays + 1;
    
    return `${totalDays} дн.`;
  }

  return '1 день';
}