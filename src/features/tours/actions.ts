'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Tour } from './types';

// Хелпер для генерации slug
function generateSlug(title: string): string {
  const trans: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya'
  };
  const slug = title.toLowerCase().split('').map(c => trans[c] || c).join('');
  return slug.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
}

// ✅ ГЛАВНЫЙ МАППЕР (UI Type -> DB Columns)
function mapTourToDb(data: Partial<Tour>) {
  // 1. Подготовка JSON полей
  // Prisma/Supabase ожидают валидный JSON, убедимся, что это не undefined
  const programDb = data.program ?? [];
  const highlightsDb = data.highlights ?? [];
  const faqDb = data.faq ?? [];
  const checklistDb = data.checklist ?? [];
  const documentsDb = data.documents ?? [];
  const datesDb = data.dates ?? [];

// 2. Извлечение ID гида
  // В форме мы можем получить объект guide или просто строку ID
  let guideId: string | null = null;

  if (data.guide) {
    // Если guide — это объект, берем id. Если строка — берем саму строку.
    guideId = typeof data.guide === 'object' ? data.guide.id : (data.guide as string);
  } 
  
  // Если гида нет в основном поле, пробуем найти в первой дате
  if (!guideId && data.dates?.[0]?.guide_id) {
    guideId = data.dates[0].guide_id;
  }

  return {
    // Основное
    title: data.title,
    subtitle: data.subtitle,
    slug: data.slug,
    is_active: data.isActive, // DB: is_active

    // Маркетинг
    type: data.type || 'hiking',
    difficulty: data.difficulty || 'medium',
    label: data.label,
    tags: data.tags, // DB: tags (array)

    // Логистика
    location: data.location,
    route: data.route,
    distance: data.distance,
    duration: data.duration,
    meeting_point: data.meetingPoint, // DB: meeting_point

    // Даты и Гид
    dates: datesDb,   // DB: dates (jsonb)
    guide_id: guideId, // DB: guide_id

    // Финансы (Разворачиваем объект price)
  currency: data.currency || 'RUB',
    
    // 2. Основная цена (бывшее adult)
    price: data.price ?? 0,
    price_old: data.priceOld ?? null,
    price_child: data.priceChild ?? null,
    price_family: data.priceFamily ?? null,
    price_member: data.priceMember ?? null,

    // Места
    spots: Number(data.spots ?? 15),
    spots_left: Number(data.spotsLeft ?? 15), // DB: spots_left

    // Медиа
    cover_image: data.image, // DB: cover_image (mapped from UI 'image')
    gallery: data.gallery,

    // Контент и Списки
    description: data.description,
    highlights: highlightsDb,
    program: programDb,
    
    included: data.included,
    additional_expenses: data.additionalExpenses, // DB: additional_expenses
    
    checklist: checklistDb,
    documents: documentsDb,
    faq: faqDb,

    // SEO
    meta_title: (data as any).meta_title, // Если поля нет в типе Tour, кастуем
    meta_desc: (data as any).meta_desc,
  };
}

// 1. СОЗДАНИЕ
export async function createTour(data: Partial<Tour>) {
  const supabase = await createClient();

  try {
    const slug = data.slug || generateSlug(data.title || 'new-tour');
    
    const dbPayload = {
      ...mapTourToDb(data),
      slug,
      // При создании форсируем некоторые дефолты
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Очищаем undefined значения, чтобы Postgres использовал дефолты
    const cleanedPayload = Object.fromEntries(
      Object.entries(dbPayload).filter(([_, v]) => v !== undefined)
    );

    // ⚠️ ВАЖНО: Пишем в таблицу 'tours' (новая модель), а не 'events'
    const { data: inserted, error } = await supabase
      .from('tours') 
      .insert(cleanedPayload)
      .select()
      .single();

    if (error) {
        console.error("Supabase Create Error:", error);
        throw new Error(error.message);
    }

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true, data: inserted };

  } catch (error: any) {
    console.error('Create Tour Error:', error);
    return { success: false, error: error.message };
  }
}

// 2. ОБНОВЛЕНИЕ
export async function updateTour(id: string, data: Partial<Tour>) {
  const supabase = await createClient();

  try {
    const dbPayload = mapTourToDb(data);
    
    const cleanedPayload = Object.fromEntries(
      Object.entries(dbPayload).filter(([_, v]) => v !== undefined)
    );

    // Добавляем update timestamp
    (cleanedPayload as any).updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('tours')
      .update(cleanedPayload)
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin');
    if (data.slug) revalidatePath(`/tour/${data.slug}`);
    revalidatePath('/');
    
    return { success: true };

  } catch (error: any) {
    console.error('Update Tour Error:', error);
    return { success: false, error: error.message };
  }
}

// 3. УДАЛЕНИЕ
export async function deleteTour(id: string) {
  const supabase = await createClient();
  // Удаляем из таблицы 'tours'
  const { error } = await supabase.from('tours').delete().eq('id', id);
  
  if (error) {
      console.error("Delete Error:", error);
      return { success: false, error: error.message };
  }
  
  revalidatePath('/admin');
  return { success: true };
}