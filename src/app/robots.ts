import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/test', '/account/'],
      },
      {
        userAgent: 'Yandexbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/test', '/account/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/test', '/account/'],
      },
      // AI-боты (разрешаем индексацию контента)
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin/', '/api/'] },
      // TikTok-бот — полностью запрещаем
      { userAgent: 'Bytespider', disallow: '/' },
      // Google-Extended (AI-тренировки) — разрешаем контент, но не админку
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin/'] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}