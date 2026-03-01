import { z } from 'zod';

// Zod-схема для туров (Единый источник правды)
export const tourFormSchema = z.object({
  id: z.string().optional(),
  
  // === СТАТУС ===
  isActive: z.boolean().default(false), // Используем camelCase

  // === ОСНОВНОЕ ===
  title: z.string().min(3, "Название обязательно (минимум 3 символа)"),
  subtitle: z.string().optional().nullable(),
  slug: z.string().min(3, "Slug обязателен").regex(/^[a-z0-9-]+$/, "Только латинские буквы, цифры и дефис"),
  
  // === МАРКЕТИНГ ===
  type: z.string().default("hiking"),
  category_id: z.string().optional(),
  difficulty: z.string().default("medium"),
  label: z.string().optional().nullable(), // "Хит", "New"
  tags: z.array(z.string()).default([]),   // Теги: ["Горы", "Семья"]

  // === ЛОГИСТИКА ===
  location: z.string().min(1, "Локация обязательна"),
  route: z.string().optional().nullable(), // 👈 ВОТ ОНО, было потеряно
  distance: z.string().optional().nullable(),
  duration: z.string().min(1, "Укажите длительность (например '3 дня')"),
  meetingPoint: z.string().optional().nullable(),

  // === ДАТЫ И ГИД ===
  // Важно: гид привязывается внутри даты или глобально. 
  // Мы будем брать guideId из первой даты для простоты, как решили.
  dates: z.array(z.object({
    start: z.string().min(1, "Дата старта обязательна"),
    end: z.string().optional(),
    time: z.string().optional(),
    guide_id: z.string().optional().nullable(), // ID гида для конкретной даты
  })).default([]),

  // === ДЕНЬГИ (Все числа, camelCase) ===
  currency: z.string().default("RUB"),
  price: z.coerce.number().min(0, "Цена не может быть отрицательной"),
  priceOld: z.coerce.number().optional().nullable(),
  priceChild: z.coerce.number().optional().nullable(),
  priceFamily: z.coerce.number().optional().nullable(),
  priceMember: z.coerce.number().optional().nullable(),

  spots: z.coerce.number().default(15),
  spotsLeft: z.coerce.number().default(15),

  // === МЕДИА ===
  coverImage: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),

  // === КОНТЕНТ (JSON массивы) ===
  description: z.string().optional().nullable(), // HTML текст
  
  // Массивы объектов для UI билдеров
  highlights: z.array(z.object({
    title: z.string(),
    desc: z.string(),
    icon: z.string().optional()
  })).default([]),
  
  program: z.array(z.any()).default([]),  // Сложная структура, пока any
  faq: z.array(z.object({                 // 👈 ВОТ ОНО, было потеряно
    question: z.string(),
    answer: z.string()
  })).default([]),
  
  checklist: z.array(z.any()).default([]),
  documents: z.array(z.any()).default([]),

  // Списки строк
  included: z.array(z.string()).default([]),
  additionalExpenses: z.array(z.string()).default([]),

  // === SEO ===
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
});

// Тип для TypeScript, выведенный из схемы
export type TourFormValues = z.infer<typeof tourFormSchema>;