// src/lib/cloudinary-loader.ts
//
// ─── СТРАТЕГИЯ FREE TIER (Максимальная экономия кредитов) ───────────────
//
// 1. Supabase Storage — проксируем через Cloudinary Fetch (в Supabase Free нет трансформаций).
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
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'твой_cloud_name'; // Убедись, что переменная есть в .env

  // ── 1. Supabase Storage (Проксируем через Cloudinary Fetch) ─────────────
  // Так как в Supabase Free нет /render/image/, мы используем бесплатный CDN Cloudinary
  // для сжатия и кэширования тяжелых оригиналов из нашей базы.
  if (src.includes('supabase.co/storage/v1/object/public/')) {
    const isHighQuality = q >= 85;
    const safeWidth = isHighQuality ? Math.min(width, 2560) : Math.min(width, 1200);
    const qualityParam = isHighQuality ? 'q_auto:good' : 'q_auto:eco';
    
    // Формат Cloudinary Fetch: /fetch/трансформации/полный_url
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,${qualityParam},w_${safeWidth}/${src}`;
  }

  // ── 2. Cloudinary Upload (статика) — лёгкая трансформация с лимитом ─────
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const isHighQuality = q >= 85;
    const safeWidth = isHighQuality ? Math.min(width, 2560) : Math.min(width, 1200);
    const qualityParam = isHighQuality ? 'q_auto:good' : 'q_auto:eco';
    
    const transformation = `f_auto,${qualityParam},w_${safeWidth}`;
    
    return src.replace('/upload/', `/upload/${transformation}/`);
  }

  // ── 3. Внешние URL (Unsplash, Google и т.д.) ───────────────────────────
  // Возвращаем как есть. Да, картинки будут тяжелыми, но мы не тратим лимиты.
  if (src.startsWith('https://') && !src.includes('cloudinary.com') && !src.includes('supabase.co')) {
    return src;
  }

  return src;
}