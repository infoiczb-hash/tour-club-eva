// src/lib/cloudinary-loader.ts
//
// ─── СТРАТЕГИЯ FREE TIER ────────────────────────────────────────────────
//
// Supabase: для динамических фото туров (бесплатные трансформации).
// Cloudinary: только для статики (/upload/) и внешних URL (временно).
// Экономим кредиты Cloudinary: q_auto:eco + сокращённые deviceSizes.
// ───────────────────────────────────────────────────────────────────────

type LoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

const CLOUD_NAME = 'dwrei7k2z';

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  const q = quality ?? 75;

  // ── 1. Cloudinary Upload (статика) ───────────────────────────────
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const transformation = `f_auto,q_auto:eco,w_${width}`;
    return src.replace('/upload/', `/upload/${transformation}/`);
  }

  // ── 2. Supabase Storage (динамика) ───────────────────────────────
  if (src.includes('supabase.co/storage/v1/object/public/')) {
    const renderUrl = src.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    return `${renderUrl}?width=${width}&quality=${q}&resize=cover`;
  }

  // ── 3. Внешние URL (например, Unsplash) ──────────────────────────
  if (src.startsWith('https://') && !src.includes('cloudinary.com') && !src.includes('supabase.co')) {
    const transformation = `f_auto,q_auto:eco,w_${width}`;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transformation}/${encodeURIComponent(src)}`;
  }

  // ── 4. Фоллбек ───────────────────────────────────────────────────
  return src;
}
