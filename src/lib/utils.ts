import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// 1. Утилита cn — стандарт для объединения классов в Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 2. Транслитерация и генерация slug
export function slugify(str: string): string {
  if (!str) return "";

  const ru: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return str
    .toLowerCase()
    .split('')
    .map(char => ru[char] || char)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 3. Валидация
export const ValidationUtils = {
  validateRegistration: (
    data: { name: string; phone: string; tickets: number },
    maxSpots: number,
    t: { validation?: Record<string, string> } | null
  ) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = t?.validation?.nameRequired || "Укажите имя";
    }

    if (!data.phone?.trim()) {
      errors.phone = t?.validation?.phoneRequired || "Укажите телефон";
    }

    if (data.tickets < 1) {
      errors.tickets = "Минимум 1 место";
    } else if (data.tickets > maxSpots) {
      errors.tickets = `Доступно только ${maxSpots} мест`;
    }

    return errors;
  }
};