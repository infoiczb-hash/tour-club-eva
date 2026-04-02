// src/lib/cloudinary-loader.ts
//
// ─── СТРАТЕГИЯ FREE TIER (Максимальная экономия кредитов) ───────────────
//
// 1. Supabase Storage — используем на 100% (у них щедрый лимит на трансформации).
// 2. Cloudinary Upload — ограничиваем ширину (защита от утечки bandwidth).
// 3. Внешние изображения — отдаем "как есть" (не тратим кредиты на чужие картинки).
// ───────────────────────────────────────────────────────────────────────

type LoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  const q = quality ?? 75;

  // ── 1. Supabase Storage (БЕСПЛАТНЫЕ трансформации) ─────────────────────
  if (src.includes('supabase.co/storage/v1/object/public/')) {
    const renderUrl = src.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    // Next.js (через Accept headers) сам запросит WebP/AVIF, параметры format не нужны
    return `${renderUrl}?width=${width}&quality=${q}&resize=cover`;
  }

  // ── 2. Cloudinary Upload (статика) — лёгкая трансформация с лимитом ─────
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    // Хард-лимит ширины. Даже если Next.js запросит 3840w, мы отдадим максимум 1200w.
    // Это спасет твой лимит Bandwidth в Cloudinary.
    const safeWidth = Math.min(width, 1200);
    const transformation = `f_auto,q_auto:eco,w_${safeWidth}`;
    
    return src.replace('/upload/', `/upload/${transformation}/`);
  }

  // ── 3. Внешние URL (Unsplash, Google и т.д.) ───────────────────────────
  if (src.startsWith('https://') && !src.includes('cloudinary.com') && !src.includes('supabase.co')) {
    // СЕНЬОРСКОЕ ПРАВИЛО: На Free-тиере НИКОГДА не проксируй чужой трафик через свой Cloudinary.
    // Пусть отдаются оригиналы, трафик оплачивает их CDN.
    return src;
  }

  // ── 4. Фоллбек (локальные файлы, blob и т.д.) ──────────────────────────
  return src;
}