import { z } from 'zod';

/// ✅ ПОМОЩНИК: JSON Helper
const jsonHelper = z.any() 
  .nullable()
  .optional()
  .transform((val) => {
    if (!val) return []; 
    if (typeof val === 'string') {
      try { 
        const parsed = JSON.parse(val);
        return parsed === null ? [] : parsed;
      } catch { 
        return []; 
      }
    }
    return val; 
  });

// ==========================================
// 1. ТУРЫ (EVENTS)
// ==========================================

// 1.1. Схема "Сырого" тура из БД (соответствует Prisma Model Tour)
export const RawTourSchema = z.object({
  id: z.string().uuid().optional(), // Optional для создания
  slug: z.string().optional(),
  
  // Основное
  title: z.string().min(3, "Название обязательно"),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(), // Prisma: isActive (@map("is_active"))

  // Маркетинг
  type: z.string().default('hiking'),
  label: z.string().nullable().optional(),
  difficulty: z.string().default('medium'),
  tags: z.array(z.string()).optional(), // ✅ Добавлено (было пропущено)
  
  // Логистика
  location: z.string().min(2, "Локация обязательна"),
  meeting_point: z.string().nullable().optional(), // Prisma: meetingPoint
  route: z.string().nullable().optional(),
  duration: z.string().nullable().optional(), // Prisma: String?
  distance: z.string().nullable().optional(), // Prisma: String?
  
  // 📅 ДАТЫ (Исправлено под Prisma JSON)
  // Мы принимаем JSON helper, так как в базе это jsonb column "dates"
  dates: jsonHelper, 
  
  // Поля для обратной совместимости (если фронт шлет их отдельно), делаем optional
  date: z.string().optional(),
  time: z.string().optional(),

  // Контент (JSON поля)
  program: jsonHelper, 
  faq: jsonHelper,
  highlights: jsonHelper, // ✅ Добавлено (было пропущено)
  checklist: jsonHelper,  // ✅ Добавлено (было пропущено)
  documents: jsonHelper,

  // Медиа
  cover_image: z.string().nullable().optional(), // Prisma: coverImage
  image: z.string().nullable().optional(),       // Алиас для удобства
  gallery: z.array(z.string()).nullable().optional(),

  // Цены
  price: z.coerce.number().default(0),        // Prisma: price
  price_old: z.coerce.number().nullable().optional(), // Prisma: priceOld
  price_child: z.coerce.number().nullable().optional(), // Prisma: priceChild
  price_family: z.coerce.number().nullable().optional(), // Prisma: priceFamily
  price_member: z.coerce.number().nullable().optional(), // ✅ Добавлено (Prisma: priceMember)
  currency: z.string().default('RUB'),

  // Места
  spots: z.coerce.number().default(15),
  spots_left: z.coerce.number().optional(), // Prisma: spotsLeft

  // Списки
  included: z.array(z.string()).nullable().optional(),
  additional_expenses: z.array(z.string()).nullable().optional(),

  // SEO (✅ Добавлено)
  meta_title: z.string().nullable().optional(),
  meta_desc: z.string().nullable().optional(),

  // Гид
  guide_id: z.string().nullable().optional(), // Prisma: guideId
  guide: jsonHelper, // Если мы пробрасываем объект гида целиком
}).passthrough(); // passthrough разрешает лишние поля, чтобы не падало, если что-то забыли

// 1.2. Схема "Чистого" тура для фронтенда (Трансформация)
export const TourSchema = RawTourSchema.transform((data) => {
  // Логика вычисления главной даты (для карточки)
  let startDate = '';
  let endDate = null;

  // Если есть массив dates, берем первую
  if (Array.isArray(data.dates) && data.dates.length > 0) {
    startDate = data.dates[0].start || '';
    endDate = data.dates[0].end || null;
  } else if (data.date) {
    // Фолбек на старое поле, если вдруг оно пришло
    startDate = data.date;
  }

  return {
    id: data.id || '',
    slug: data.slug || '',
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    
    type: data.type,
    label: data.label,
    tags: data.tags || [],
    
    location: data.location,
    meetingPoint: data.meeting_point,
    route: data.route,
    
    difficulty: data.difficulty,
    duration: data.duration, // Теперь строка, как в Prisma
    distance: data.distance,
    
    // Даты
    date: startDate,
    endDate: endDate,
    dates: data.dates || [], // Сохраняем полный массив

    // Цены
    price: {
      adult: data.price, // Prisma поле называется просто price
      child: data.price_child || 0,
      family: data.price_family || 0,
      member: data.price_member || 0,
      oldPrice: data.price_old,
      currency: data.currency,
    },
    
    spots: data.spots,
    spotsLeft: data.spots_left ?? data.spots,
    
    image: data.cover_image || data.image || '', 
    gallery: data.gallery || [],
    
    // JSON контент
    program: data.program, 
    faq: data.faq,
    highlights: data.highlights,
    checklist: data.checklist,
    documents: data.documents,
    
    included: data.included || [],
    additionalExpenses: data.additional_expenses || [],
    
    // SEO
    meta_title: data.meta_title,
    meta_desc: data.meta_desc,

    // Гид
    guide: data.guide, // Объект гида
    
    isActive: data.is_active !== false,
  };
});

export type Tour = z.infer<typeof TourSchema>;

// Схемы для форм (без изменений логики, но наследуют исправленный RawTourSchema)
export const CreateTourSchema = RawTourSchema;
export const UpdateTourSchema = RawTourSchema.partial();

// ==========================================
// ОСТАЛЬНЫЕ СХЕМЫ (Guide, Post, Booking) - Оставляем как есть, они выглядят ок
// ==========================================

export const GuideSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(), 
  name: z.string().min(2, "Имя обязательно"),
  role: z.string().default('Гид'),
  image: z.string().nullable().optional(),
  actionImage: z.string().nullable().optional(),
  superpower: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  achievements: z.array(z.string()).nullable().optional(),
  is_active: z.boolean().nullable().optional().transform(val => val !== false),
});
export type Guide = z.infer<typeof GuideSchema>;

export const PostSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(3, "Заголовок обязателен"),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  date: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val).toISOString() : new Date().toISOString()),
  read_time: z.union([z.string(), z.number()]).transform(val => Number(val) || 5),
  category: z.string().nullable().optional(),
  is_trending: z.boolean().nullable().optional().transform(val => !!val),
  is_active: z.boolean().nullable().optional().transform(val => !!val),
  author_name: z.string().nullable().optional(),
  author_role: z.string().nullable().optional(),
  author_image: z.string().nullable().optional(),
});
export type BlogPost = z.infer<typeof PostSchema>;

export const RegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  event_id: z.string().uuid(),
  user_name: z.string().min(2, "Имя обязательно"),
  user_phone: z.string().min(5, "Телефон обязателен"),
  email: z.string().email().optional().or(z.literal('')),
  ticket_count: z.number().default(1),
  tickets_adult: z.number().default(0),
  tickets_child: z.number().default(0),
  tickets_family: z.number().default(0),
  total_price: z.number().default(0),
  status: z.string().default('new'),
  comment: z.string().optional(),
  events: z.object({ title: z.string(), date: z.string() }).optional().nullable(),
});
export type Registration = z.infer<typeof RegistrationSchema>;

// Схема для формы (Form Input)
export const TourFormSchema = RawTourSchema.extend({
  difficulty: z.string().default('medium'),
  // Разрешаем ввод строк для чисел (из инпутов), но трансформируем в числа
  price: z.union([z.string(), z.number()]).transform(v => Number(v) || 0),
  price_child: z.union([z.string(), z.number()]).optional().transform(v => Number(v) || 0),
  price_family: z.union([z.string(), z.number()]).optional().transform(v => Number(v) || 0),
  price_member: z.union([z.string(), z.number()]).optional().transform(v => Number(v) || 0),
  price_old: z.union([z.string(), z.number()]).optional().transform(v => Number(v) || 0),
  spots: z.union([z.string(), z.number()]).transform(v => Number(v) || 0),
  spots_left: z.union([z.string(), z.number()]).optional().transform(v => Number(v) || 0),
});

export type TourFormInput = z.input<typeof TourFormSchema>;
export type TourFormOutput = z.output<typeof TourFormSchema>;