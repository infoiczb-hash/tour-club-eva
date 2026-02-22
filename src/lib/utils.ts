import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// 1. Утилита cn — стандарт для объединения классов в Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 2. Валидация
export const ValidationUtils = {
  validateRegistration: (
    data: { name: string; phone: string; tickets: number }, 
    maxSpots: number, 
    // ✅ ИСПРАВЛЕНО: Добавлен строгий тип вместо пропуска
    // Мы говорим, что t — это объект, у которого может быть поле validation (тоже объект строк)
    t: { validation?: Record<string, string> } | null
  ) => {
    const errors: Record<string, string> = {};

    // Проверка имени
    if (!data.name?.trim()) {
      errors.name = t?.validation?.nameRequired || "Укажите имя";
    }

    // Проверка телефона
    if (!data.phone?.trim()) {
      errors.phone = t?.validation?.phoneRequired || "Укажите телефон";
    }

    // Проверка билетов
    if (data.tickets < 1) {
      errors.tickets = "Минимум 1 место";
    } else if (data.tickets > maxSpots) {
      errors.tickets = `Доступно только ${maxSpots} мест`;
    }

    return errors;
  }
};