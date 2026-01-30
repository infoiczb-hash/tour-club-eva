// src/lib/imageOptimizer.js

export const getOptimizedImage = (url, width = 800, quality = 80) => {
  if (!url) return '';
  
  // Если это картинка не из нашего хранилища, возвращаем как есть
  if (!url.includes('supabase.co')) return url;

  // Используем сервис wsrv.nl для конвертации в WebP и ресайза
  // url - ссылка на картинку
  // w - ширина
  // q - качество
  // output - формат
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=webp`;
};
