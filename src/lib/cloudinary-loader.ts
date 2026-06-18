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
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'твой_cloud_name';

  // 1. Supabase Storage (✅ ИСПРАВЛЕНО: обрабатываем и старые 'object', и новые 'render' ссылки)
  if (
    src.includes('supabase.co/storage/v1/object/public/') ||
    src.includes('supabase.co/storage/v1/render/image/public/')
  ) {
    const isHighQuality = q >= 85;
    const safeWidth = isHighQuality ? Math.min(width, 2560) : Math.min(width, 1200);
    const qualityParam = isHighQuality ? 'q_auto:good' : 'q_auto:eco';
    
    // Форсируем f_webp вместо f_auto для максимального сжатия
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_webp,${qualityParam},w_${safeWidth}/${src}`;
  }

  // 2. Cloudinary Upload (Для картинок, которые уже лежат в Cloudinary)
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const isHighQuality = q >= 85;
    const safeWidth = isHighQuality ? Math.min(width, 2560) : Math.min(width, 1200);
    const qualityParam = isHighQuality ? 'q_auto:good' : 'q_auto:eco';
    
    // Вставляем параметры трансформации в URL
    const urlParts = src.split('/upload/');
    return `${urlParts[0]}/upload/f_webp,${qualityParam},w_${safeWidth}/${urlParts[1]}`;
  }

  // 3. БЕЗОПАСНЫЙ ФОЛЛБЕК (✅ ИСПРАВЛЕНО: убрана слепая склейка `/w_${width}`)
  // Все остальные картинки (включая локальные из папки public) отдаем как есть. 
  // Это предотвратит 404 ошибки на Vercel.
  return src;
}