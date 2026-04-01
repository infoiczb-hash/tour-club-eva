// src/features/admin/components/TourForm/schema.ts
import { z } from 'zod';

export const tourFormSchema = z.object({
  id: z.string().optional(),

  // === СТАТУС ===
  isActive: z.boolean().default(false),

  // === ОСНОВНОЕ ===
  title: z.string().min(3, 'Название обязательно (минимум 3 символа)'),
  subtitle: z.string().optional().nullable(),
  slug: z.string().min(3, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Только латинские буквы, цифры и дефис'),

  // === МАРКЕТИНГ ===
  type: z.string().default('hiking'),
  categoryId: z.string().uuid('Неверный формат ID категории').optional().nullable(),
  difficulty: z.string().default('medium'),
  label: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),

  // ✅ НОВЫЕ ПОЛЯ ХАРАКТЕРИСТИК (ФАЗА 1)
  tourFormat: z.string().optional().nullable(),
  accommodation: z.string().optional().nullable(),
  groupInfo: z.string().optional().nullable(),
  importantInfo: z.string().optional().nullable(),

  // === ЛОГИСТИКА ===
  location: z.string().min(1, 'Локация обязательна'),
  route: z.string().optional().nullable(),
  distance: z.string().optional().nullable(),
  duration: z.string().min(1, "Укажите длительность (например '3 дня')"),
  meetingPoint: z.string().optional().nullable(),

  // === ДАТЫ И ВЫЕЗДЫ (Теперь связаны с таблицей TourDate) ===
  dates: z.array(z.object({
    id: z.string().optional(), // ID существующего выезда (для обновления)
    start: z.string().min(1, 'Дата старта обязательна'),
    end: z.string().optional().nullable(),
    time: z.string().optional().nullable(),
    guide_id: z.string().uuid().optional().nullable(),
    groupChatUrl: z.string().optional().nullable(), 
    
    // ✅ Лимиты для конкретной даты
    spots: z.coerce.number().optional(),
    spotsLeft: z.coerce.number().optional(),

    // ✅ Динамические цены для даты (Early Bird / Last Minute)
    basePrice: z.coerce.number().optional().nullable(),
    discountEarlyBird: z.coerce.number().optional().nullable(),
    earlyBirdDeadline: z.coerce.number().optional().nullable(),
    surchargeLastMinute: z.coerce.number().optional().nullable(),
    lastMinuteTrigger: z.coerce.number().optional().nullable(),
  })).default([]),

  // === ДЕНЬГИ (Глобальные дефолты тура) ===
  currency: z.string().default('RUB'),
  price: z.coerce.number().min(0, 'Цена не может быть отрицательной'),
  priceOld: z.coerce.number().optional().nullable(),
  priceChild: z.coerce.number().optional().nullable(),
  priceFamily: z.coerce.number().optional().nullable(),
  priceMember: z.coerce.number().optional().nullable(),
  biletpmrLink: z.string().optional().nullable(),
  apbQrLink: z.string().optional().nullable(),
  apbQrImage: z.string().optional().nullable(),
  spots: z.coerce.number().default(15),
  spotsLeft: z.coerce.number().default(15),

  // === МЕДИА ===
  coverImage: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),

  // === КОНТЕНТ ===
  description: z.string().optional().nullable(),

  highlights: z.array(z.object({
    title: z.string(),
    desc: z.string(),
    icon: z.string().optional(),
  })).default([]),

  program: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
  })).default([]),

  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),

  checklist: z.array(z.object({
    title: z.string(),
    items: z.string().default(''),
  })).default([]),

  documents: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
  })).default([]),

  // Старые плоские массивы оставляем для обратной совместимости
  included: z.array(z.string()).default([]),
  additionalExpenses: z.array(z.string()).default([]),

  // ✅ НОВЫЕ: Детализированные списки (Аккордеоны)
  includedDetailed: z.any().optional().nullable(),
  excludedDetailed: z.any().optional().nullable(),

  // === SEO ===
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
});

export type TourFormValues = z.infer<typeof tourFormSchema>;