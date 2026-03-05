// src/lib/cloudinary-loader.ts
//
// Кастомный loader для next/image.
// Cloudinary:  f_auto,q_{quality},w_{width} — AVIF/WebP + точный размер
// Supabase:    ?width={width}&quality={quality} — resize через встроенный Image Transform
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
  // FIX #7: Supabase поддерживает Image Transformation через query-параметры
  // Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
  if (src.includes('supabase.co')) {
    const q = quality ?? 75;
    const url = new URL(src);
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(q));
    return url.toString();
  }

  // --- Всё остальное (Unsplash, YouTube и т.д.) ---
  return src;
}
