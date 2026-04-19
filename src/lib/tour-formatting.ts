// src/lib/tour-formatting.ts
import type { Tour, TourProgramDay } from '@/features/tours/types';

// -----------------------------------------------------------------------------
// ПРОГРАММА ТУРА
// -----------------------------------------------------------------------------
export function formatProgramForSlide(program: Tour['program']): string {
  if (!program) return 'Программа уточняется';

  // Старый формат: обычная строка
  if (typeof program === 'string') {
    return String(program).trim() || 'Программа уточняется';
  }

  // Массив дней (новый формат)
  if (Array.isArray(program)) {
    return formatDaysArray(program);
  }

  // Объект с полем days
  if (typeof program === 'object' && 'days' in program && Array.isArray((program as any).days)) {
    return formatDaysArray((program as any).days);
  }

  return 'Программа уточняется';
}

function formatDaysArray(days: TourProgramDay[]): string {
  if (days.length === 0) return 'Программа уточняется';

  const lines: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dayNumber = day.day ?? i + 1;
    const dayTitle = day.title || `День ${dayNumber}`;
    lines.push(`День ${dayNumber}. ${dayTitle}`);

    if (day.activities && day.activities.length > 0) {
      for (const act of day.activities) {
        const time = act.time ? `${act.time} — ` : '';
        lines.push(`  ${time}${act.title || ''}`);
      }
    } else if (day.description) {
      lines.push(`  ${day.description}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

// -----------------------------------------------------------------------------
// ЧЕК-ЛИСТ (Что взять с собой)
// -----------------------------------------------------------------------------
export function formatChecklistForSlide(checklist: Tour['checklist']): string {
  if (!checklist || !Array.isArray(checklist) || checklist.length === 0) {
    return 'Список вещей уточняется';
  }

  const lines: string[] = [];
  for (const category of checklist) {
    if (typeof category === 'string') {
      lines.push(`• ${category}`);
    } else if (category && typeof category === 'object') {
      const title = category.title || 'Категория';
      lines.push(`• ${title}:`);
      const items = typeof category.items === 'string'
        ? category.items.split('\n').filter(Boolean)
        : Array.isArray(category.items) ? category.items : [];
      for (const item of items) {
        lines.push(`  - ${item}`);
      }
    }
  }
  return lines.join('\n').trim() || 'Список вещей уточняется';
}

// -----------------------------------------------------------------------------
// ЧТО ВКЛЮЧЕНО В СТОИМОСТЬ
// -----------------------------------------------------------------------------
export function formatIncludedForSlide(
  includedDetailed: Tour['includedDetailed'],
  included: Tour['included']
): string {
  // Новый детализированный формат
  if (includedDetailed && Array.isArray(includedDetailed) && includedDetailed.length > 0) {
    const lines: string[] = [];
    for (const cat of includedDetailed) {
      if (cat && typeof cat === 'object') {
        lines.push(`• ${cat.title || 'Включено'}:`);
        if (cat.items && Array.isArray(cat.items)) {
          for (const item of cat.items) {
            const label = item.label || '';
            const price = item.price ? ` (${item.price})` : '';
            lines.push(`  - ${label}${price}`);
          }
        }
      }
    }
    return lines.join('\n').trim();
  }

  // Старый массив строк
  if (included && Array.isArray(included) && included.length > 0) {
    return included.map(item => `• ${item}`).join('\n');
  }

  return 'Информация уточняется';
}

// -----------------------------------------------------------------------------
// ЛОГИСТИКА
// -----------------------------------------------------------------------------
export function formatLogisticsForSlide(tour: Pick<Tour, 'meetingPoint' | 'location' | 'duration' | 'route' | 'guide'>): string {
  const lines: string[] = [];

  if (tour.meetingPoint) {
    lines.push(`📍 Место сбора: ${tour.meetingPoint}`);
  } else if (tour.location) {
    lines.push(`📍 Локация: ${tour.location}`);
  }

  if (tour.duration) lines.push(`⏱ Длительность: ${tour.duration}`);
  if (tour.route) lines.push(`🧭 Маршрут: ${tour.route}`);

  if (tour.guide) {
    const guideName = typeof tour.guide === 'string' ? tour.guide : tour.guide.name;
    lines.push(`👤 Гид: ${guideName}`);
  }

  return lines.join('\n').trim() || 'Детали уточняются';
}