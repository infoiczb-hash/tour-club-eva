// src/app/robots.ts
import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  // Выносим массив служебных путей. 
  // Использование путей без '/' на конце блокирует и сам роут, и все его подпапки.
  const commonDisallow = [
    '/admin', 
    '/account', 
    '/api', 
    '/auth', 
    '/payment', 
    '/_next', 
    '/test'
  ];

  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: commonDisallow,
      },
      {
        userAgent: 'Yandexbot',
        allow: '/',
        disallow: commonDisallow,
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: commonDisallow,
      },
      
      // AI-боты (разрешаем индексацию контента, но жестко блокируем служебные)
      { userAgent: 'GPTBot', allow: '/', disallow: commonDisallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow: commonDisallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow: commonDisallow },
      
      // TikTok-бот — полностью запрещаем (экономия ресурсов сервера)
      { userAgent: 'Bytespider', disallow: ['/'] },
      
      // Google-Extended (AI-тренировки) — разрешаем контент, но не приватные данные
      { userAgent: 'Google-Extended', allow: '/', disallow: commonDisallow },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}