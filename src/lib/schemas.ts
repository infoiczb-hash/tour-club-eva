import { z } from 'zod';

// ── HELPERS ───────────────────────────────────────────────────────────────────

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

// ── 1. КАТЕГОРИИ ──────────────────────────────────────────────────────────────

// FIX: Добавлено поле color, которое отсутствовало (есть в Prisma и AdminForm)
const CATEGORY_COLORS = [
  'slate', 'teal', 'emerald', 'sky', 'blue',
  'violet', 'pink', 'rose', 'orange', 'amber',
] as const;

export const TourCategorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1, 'Slug обязателен'),
  title: z.string().min(1, 'Название обязательно'),
  icon: z.string().default('Compass'),
  color: z.enum(CATEGORY_COLORS).default('teal'), // FIX: было отсутствует
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});
export type TourCategoryType = z.infer<typeof TourCategorySchema>;
export type CategoryColor = typeof CATEGORY_COLORS[number];

export const BlogCategorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1, 'Slug обязателен'),
  title: z.string().min(1, 'Название обязательно'),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});
export type BlogCategoryType = z.infer<typeof BlogCategorySchema>;

// ── 2. ТУРЫ ───────────────────────────────────────────────────────────────────

export const RawTourSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),

  title: z.string().min(3, 'Название обязательно'),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),

  type: z.string().default('hiking'),
  // FIX: было 'categoryId' — теперь оба варианта (camelCase из Prisma и snake_case из legacy)
  categoryId: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  label: z.string().nullable().optional(),
  difficulty: z.string().default('medium'),
  tags: z.array(z.string()).optional(),

  location: z.string().min(2, 'Локация обязательна'),
  meeting_point: z.string().nullable().optional(),
  route: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  distance: z.string().nullable().optional(),

  dates: jsonHelper,
  date: z.string().optional(),
  time: z.string().optional(),

  program: jsonHelper,
  faq: jsonHelper,
  highlights: jsonHelper,
  checklist: jsonHelper,
  documents: jsonHelper,

  cover_image: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  gallery: z.array(z.string()).nullable().optional(),

  price: z.coerce.number().default(0),
  price_old: z.coerce.number().nullable().optional(),
  price_child: z.coerce.number().nullable().optional(),
  price_family: z.coerce.number().nullable().optional(),
  price_member: z.coerce.number().nullable().optional(),
  currency: z.string().default('RUB'),

  spots: z.coerce.number().default(15),
  spots_left: z.coerce.number().optional(),

  included: z.array(z.string()).nullable().optional(),
  additional_expenses: z.array(z.string()).nullable().optional(),

  meta_title: z.string().nullable().optional(),
  meta_desc: z.string().nullable().optional(),

  guide_id: z.string().nullable().optional(),
  guide: jsonHelper,
}).passthrough();

// FIX: transform теперь корректно прокидывает categoryId (был баг: data.category_id
// всегда undefined, т.к. поле в схеме называлось categoryId в camelCase)
// FIX: добавлено поле category (relation object) — раньше оно полностью терялось
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

    // FIX: берём оба варианта написания — camelCase приоритетнее
    categoryId: data.categoryId ?? data.category_id ?? null,
    // FIX: category relation прокидывается если пришёл из include (через passthrough)
    category: (data as any).category ?? null,

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

// ── 3. ГИДЫ ───────────────────────────────────────────────────────────────────

// FIX: добавлены все поля которые есть в Prisma Guide — раньше их не было и они
// срезались при валидации: fullBio, quotes, stats, tags, achievements, order
export const GuideSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  slug: z.string().optional(),
  name: z.string().min(2, 'Имя обязательно'),
  role: z.string().default('Гид'),
  image: z.string().nullable().optional(),
  actionImage: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  fullBio: z.string().nullable().optional(),         // FIX: было отсутствует
  quotes: z.array(z.string()).default([]),            // FIX: было отсутствует
  experience: z.string().nullable().optional(),
  superpower: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),              // FIX: было отсутствует
  achievements: z.array(z.string()).default([]),      // FIX: было отсутствует
  stats: z.any().nullable().optional(),              // FIX: было отсутствует (Json в Prisma)
  contact: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  order: z.coerce.number().default(0),               // FIX: было отсутствует
  is_active: z.boolean().nullable().optional().transform(val => val !== false),
});
export type Guide = z.infer<typeof GuideSchema>;

// ── 4. БЛОГ ───────────────────────────────────────────────────────────────────

export const PostSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(3, 'Заголовок обязателен'),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  date: z.union([z.string(), z.date()]).optional().transform(
    val => val ? new Date(val).toISOString() : new Date().toISOString()
  ),
  read_time: z.union([z.string(), z.number()]).transform(val => Number(val) || 5),
  category: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
  is_trending: z.boolean().nullable().optional().transform(val => !!val),
  is_active: z.boolean().nullable().optional().transform(val => !!val),
  author_name: z.string().nullable().optional(),
  author_role: z.string().nullable().optional(),
  author_image: z.string().nullable().optional(),
});
export type BlogPost = z.infer<typeof PostSchema>;

// ── 5. БРОНИРОВАНИЕ ───────────────────────────────────────────────────────────

// FIX: RegistrationSchema удалена — модель Registration устарела, используем Booking.
// Схема бронирования живёт в src/features/tours/actions/createBooking.ts (BookingSchema).
//
// BookingAdminItemSchema описывает DTO который возвращает getRegistrationsAction —
// маппинг Prisma Booking → AdminUI с алиасами user_name/user_phone для совместимости
// с BookingsTab.tsx.
export const BookingAdminItemSchema = z.object({
  id: z.string().uuid(),
  user_name: z.string(),        // alias for Booking.name
  user_phone: z.string(),       // alias for Booking.phone
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  created_at: z.union([z.string(), z.date()]),
  tickets_adult: z.number().default(0),
  tickets_child: z.number().default(0),
  tickets_member: z.number().default(0),
  total_price: z.number(),
  comment: z.string().optional(),
  social: z.string().optional(),
  event_id: z.string().uuid(),  // alias for Booking.tourId
  tour: z.object({
    title: z.string(),
    date: z.union([z.string(), z.date()]).nullable(),
  }).optional(),
});
export type BookingAdminItem = z.infer<typeof BookingAdminItemSchema>;

// ── 6. ФОРМЫ ТУРОВ ────────────────────────────────────────────────────────────

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