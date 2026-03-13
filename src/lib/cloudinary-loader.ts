// src/lib/cloudinary-loader.ts
//
// Кастомный loader для next/image.
// Cloudinary:  f_auto,q_{quality},w_{width} — AVIF/WebP + точный размер
// Supabase:    /render/image/public/... + ?width=&quality= — реальный Image Transform
// Остальное:   возвращает src без изменений

type LoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  // --- Cloudinary ---
  if (src.includes('res.cloudinary.com')) {
    const q = quality ?? 75;
    const transformation = `f_auto,q_${q},w_${width}`;
    return src.replace('/upload/', `/upload/${transformation}/`);
  }

  // --- Supabase Storage ---
  // ✅ FIX: Supabase Image Transformation работает ТОЛЬКО через /render/image/ path.
  // Путь /object/public/ отдаёт оригинал без трансформации — параметры width/quality игнорируются.
  // Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
  //
  // Трансформация:
  //   /storage/v1/object/public/{bucket}/{path}
  //   → /storage/v1/render/image/public/{bucket}/{path}?width=N&quality=N&format=webp
  //
  if (src.includes('supabase.co')) {
    const q = quality ?? 75;
    const url = new URL(src);

    // Заменяем /object/public/ → /render/image/public/
    // Если URL уже содержит /render/image/ — не трогаем (идемпотентность)
    if (url.pathname.includes('/object/public/')) {
      url.pathname = url.pathname.replace('/object/public/', '/render/image/public/');
    }

    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(q));
    // ✅ ИСПРАВЛЕНО: Меняем origin на webp для значительного снижения веса и ускорения LCP
    url.searchParams.set('format', 'webp');

    return url.toString();
  }

  // --- Всё остальное (Unsplash, YouTube и т.д.) ---
  return src;
}