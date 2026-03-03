// src/lib/cloudinary-loader.ts
//
// Кастомный loader для next/image.
// Автоматически добавляет оптимизацию ко всем картинкам из Cloudinary:
//   - f_auto   → формат AVIF/WebP в зависимости от браузера
//   - q_60     → сжатие 60% вместо дефолтного 75-80%
//   - w_{width} → точный размер под экран (решает проблему 640px → 436px)
//
// Подключается один раз в next.config.mjs → работает на всём сайте.
// Картинки НЕ из Cloudinary (Supabase, Unsplash) обрабатываются стандартно.

type LoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  // Только Cloudinary URL трансформируем
  if (!src.includes('res.cloudinary.com')) {
    return src;
  }

  // Качество: берём переданное или дефолт 60
  const q = quality ?? 60;

  // Трансформация: вставляем после /upload/
  // Пример входа:  https://res.cloudinary.com/dwrei7k2z/image/upload/v17.../photo.jpg
  // Пример выхода: https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60,w_412/v17.../photo.jpg
  const transformation = `f_auto,q_${q},w_${width}`;

  return src.replace('/upload/', `/upload/${transformation}/`);
}
