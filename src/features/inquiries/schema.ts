import { z } from 'zod';

// ==========================================
// 1. КОНСТАНТЫ (Важно для Zod + TypeScript)
// ==========================================
// Выносим массивы отдельно и замораживаем их через "as const"
const HR_ROLES = ["guide", "cook", "driver", "tech", "photo", "other"] as const;
const BLOG_FORMATS = ["idea", "text"] as const;

// ==========================================
// 2. БАЗОВАЯ СТРУКТУРА (Без .refine)
// ==========================================
const BaseFields = z.object({
  name: z.string().min(2, "Имя обязательно"),
  phone: z.string().optional(),
  social: z.string().optional(),
  honeypot: z.string().optional(),
});

// ==========================================
// 3. СХЕМЫ ПО ТИПАМ
// ==========================================

const TourInquirySchema = BaseFields.extend({
  type: z.literal('TOUR'),
  tourTitle: z.string().optional(),
  message: z.string().min(5, "Напишите ваш вопрос"),
});

const HrInquirySchema = BaseFields.extend({
  type: z.literal('HR'),
  //   ИСПРАВЛЕНО: Передаем только массив. 
  // Если нужно кастомное сообщение об ошибке, Zod сам скажет "Invalid enum value",
  // либо это обрабатывается на уровне формы (React Hook Form).
  role: z.enum(HR_ROLES), 
  experience: z.string().min(5, "Расскажите кратко об опыте"),
  motivation: z.string().min(5, "Почему вы хотите к нам?"),
});

const BlogInquirySchema = BaseFields.extend({
  type: z.literal('BLOG'),
  //   ИСПРАВЛЕНО: Передаем только массив
  format: z.enum(BLOG_FORMATS),
  message: z.string().min(5, "Опишите тему или идею"),
});

const B2BInquirySchema = BaseFields.extend({
  type: z.literal('B2B'),
  company: z.string().optional(),
  message: z.string().min(5, "Опишите предложение"),
});

const HelpInquirySchema = BaseFields.extend({
  type: z.literal('HELP'),
  message: z.string().min(5, "Чем можете помочь?"),
});

const ReviewInquirySchema = BaseFields.extend({
  type: z.literal('REVIEW'),
  rating: z.coerce.number().min(1).max(5),
  message: z.string().min(5, "Напишите отзыв"),
});

// ==========================================
// 4. ОБЪЕДИНЕНИЕ (UNION)
// ==========================================
const BaseInquirySchema = z.discriminatedUnion("type", [
  TourInquirySchema,
  HrInquirySchema,
  BlogInquirySchema,
  B2BInquirySchema,
  HelpInquirySchema,
  ReviewInquirySchema,
]);

// ==========================================
// 5. ФИНАЛЬНАЯ ПРОВЕРКА И ЭКСПОРТ
// ==========================================
export const InquirySchema = BaseInquirySchema.refine(
  (data) => data.phone || data.social, 
  {
    message: "Укажите телефон или Telegram/Instagram",
    path: ["phone"],
  }
);

export type InquiryInput = z.infer<typeof InquirySchema>;

// Экспорт констант, если понадобятся во фронтенде для <select>
export { HR_ROLES, BLOG_FORMATS };