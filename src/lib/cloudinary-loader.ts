// src/lib/cloudinary-loader.ts
//
// Кастомный loader для next/image.
// 1. Cloudinary Upload: f_auto,q_{quality},w_{width}
// 2. Supabase: Пропускаем через Cloudinary Fetch API для бесплатного on-the-fly ресайза и WebP
// 3. Остальное: возвращает src без изменений

type LoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  const q = quality ?? 75;

  // --- 1. Cloudinary (Наши статические файлы) ---
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const transformation = `f_auto,q_${q},w_${width}`;
    return src.replace('/upload/', `/upload/${transformation}/`);
  }

  // --- 2. Supabase Storage (Динамические фото туров) ---
  // Используем Cloudinary Fetch API как прокси-оптимизатор
  if (src.includes('supabase.co')) {
    const cloudName = 'dwrei7k2z'; // Твой Cloudinary cloud_name
    const transformation = `f_auto,q_${q},w_${width}`;
    
    // ВАЖНО: Если URL Supabase содержит параметры (например, токены), 
    // весь URL необходимо закодировать. Но в базовом варианте для Public бакетов работает и так.
    // Если будут проблемы с загрузкой, используй encodeURIComponent(src)
    return `https://res.cloudinary.com/${cloudName}/image/fetch/${transformation}/${src}`;
  }

  // --- 3. Всё остальное (Unsplash, YouTube и т.д.) ---
  return src;
}