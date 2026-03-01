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
// 1. КАТЕГОРИИ (НОВОЕ)
// ==========================================

export const TourCategorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1, "Slug обязателен"),
  title: z.string().min(1, "Название обязательно"),
  icon: z.string().default("Compass"),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});
export type TourCategoryType = z.infer<typeof TourCategorySchema>;

export const BlogCategorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1, "Slug обязателен"),
  title: z.string().min(1, "Название обязательно"),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});
export type BlogCategoryType = z.infer<typeof BlogCategorySchema>;

// ==========================================
// 2. ТУРЫ (EVENTS)
// ==========================================

// 2.1. Схема "Сырого" тура из БД (соответствует Prisma Model Tour)
export const RawTourSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  
  // Основное
  title: z.string().min(3, "Название обязательно"),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),

  // Маркетинг
  type: z.string().default('hiking'), // Старое поле
  category_id: z.string().uuid().nullable().optional(), // ✅ НОВОЕ ПОЛЕ
  label: z.string().nullable().optional(),
  difficulty: z.string().default('medium'),
  tags: z.array(z.string()).optional(), 
  
  // Логистика
  location: z.string().min(2, "Локация обязательна"),
  meeting_point: z.string().nullable().optional(),
  route: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  distance: z.string().nullable().optional(),
  
  // Даты
  dates: jsonHelper, 
  date: z.string().optional(),
  time: z.string().optional(),

  // Контент (JSON поля)
  program: jsonHelper, 
  faq: jsonHelper,
  highlights: jsonHelper,
  checklist: jsonHelper, 
  documents: jsonHelper,

  // Медиа
  cover_image: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  gallery: z.array(z.string()).nullable().optional(),

  // Цены
  price: z.coerce.number().default(0),        
  price_old: z.coerce.number().nullable().optional(), 
  price_child: z.coerce.number().nullable().optional(), 
  price_family: z.coerce.number().nullable().optional(), 
  price_member: z.coerce.number().nullable().optional(), 
  currency: z.string().default('RUB'),

  // Места
  spots: z.coerce.number().default(15),
  spots_left: z.coerce.number().optional(),

  // Списки
  included: z.array(z.string()).nullable().optional(),
  additional_expenses: z.array(z.string()).nullable().optional(),

  // SEO
  meta_title: z.string().nullable().optional(),
  meta_desc: z.string().nullable().optional(),

  // Гид
  guide_id: z.string().nullable().optional(),
  guide: jsonHelper,
}).passthrough(); 

// 2.2. Схема "Чистого" тура для фронтенда
export const TourSchema = RawTourSchema.transform((data) => {
  let startDate = '';
  let endDate = null;

  if (Array.isArray(data.dates) && data.dates.length > 0) {
    startDate = data.dates[0].start || '';
    endDate = data.dates[0].end || null;
  } else if (data.date) {
    startDate = data.date;
  }

  return {
    id: data.id || '',
    slug: data.slug || '',
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    
    type: data.type,
    categoryId: data.category_id, // ✅ НОВОЕ ПОЛЕ ПРОКИНУТО НА ФРОНТ
    
    label: data.label,
    tags: data.tags || [],
    
    location: data.location,
    meetingPoint: data.meeting_point,
    route: data.route,
    
    difficulty: data.difficulty,
    duration: data.duration,
    distance: data.distance,
    
    date: startDate,
    endDate: endDate,
    dates: data.dates || [], 

    price: {
      adult: data.price,
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
    
    program: data.program, 
    faq: data.faq,
    highlights: data.highlights,
    checklist: data.checklist,
    documents: data.documents,
    
    included: data.included || [],
    additionalExpenses: data.additional_expenses || [],
    
    meta_title: data.meta_title,
    meta_desc: data.meta_desc,

    guide: data.guide,
    
    isActive: data.is_active !== false,
  };
});

export type Tour = z.infer<typeof TourSchema>;

export const CreateTourSchema = RawTourSchema;
export const UpdateTourSchema = RawTourSchema.partial();

// ==========================================
// 3. ОСТАЛЬНЫЕ СХЕМЫ (Guide, Post, Booking)
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
  
  category: z.string().nullable().optional(), // Старое поле
  category_id: z.string().uuid().nullable().optional(), // ✅ НОВОЕ ПОЛЕ
  tags: z.array(z.string()).default([]), // ✅ НОВОЕ ПОЛЕ (МАССИВ ТЕГОВ)
  
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

export const TourFormSchema = RawTourSchema.extend({
  difficulty: z.string().default('medium'),
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