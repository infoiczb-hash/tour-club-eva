// src/features/tours/components/TourDetails/booking.schema.ts
import { z } from 'zod';

// Схема для одного гостя (Пассажира)
export const guestSchema = z.object({
  id: z.string(),
  isMain: z.boolean(),
  type: z.string(),
  categoryId: z.string().optional(),
  unitIndex: z.number().optional(),
  groupLabel: z.string().optional(),
  
  // Валидация полей, которые заполняет клиент
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  phone: z.string().optional(),
  age: z.string().optional(),
  jacket: z.string().optional(),
});

// Главная схема всей формы бронирования
export const bookingFormSchema = z.object({
  tourDateId: z.string().nullable(),
  tourDateStr: z.string(),

  // Корзина V1 (Legacy)
  ticketsAdult: z.number().min(0).default(1),
  ticketsChild: z.number().min(0).default(0),
  ticketsMember: z.number().min(0).default(0),
  ticketsFamily: z.number().min(0).default(0),

  // Корзина V2 (Динамическая: categoryId -> quantity)
  cartV2: z.record(z.string(), z.number()).default({}),

  // Шаг 2: Гости и специфика каякинга
  guests: z.array(guestSchema).default([]),
  comment: z.string().optional(),
  hasChildUnder7: z.boolean().default(false),
  hasDog: z.boolean().default(false),

  // Шаг 3: Оплата и согласия
  paymentMethod: z.enum(['online_card', 'foreign', 'cash', 'biletpmr']).default('online_card'),
  useBonuses: z.boolean().default(false),
  promoCode: z.string().optional(),

  // Согласия (Обязательны для тру)
  agreedOffer: z.boolean().refine(val => val === true, 'Обязательное поле'),
  agreedPrivacy: z.boolean().refine(val => val === true, 'Обязательное поле'),
  agreedRules: z.boolean().default(false), // Валидируется вручную, так как нужно не для всех туров
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type GuestFormValue = z.infer<typeof guestSchema>;