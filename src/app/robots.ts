import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/test'],
      },
      {
        userAgent: 'Yandexbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/test'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/test'],
      },
      {
  userAgent: 'GPTBot',
  allow: '/',
  disallow: ['/admin/', '/api/', '/_next/', '/test'],
},
{
  userAgent: 'ClaudeBot',
  allow: '/',
  disallow: ['/admin/', '/api/', '/_next/', '/test'],
},
{
  userAgent: 'PerplexityBot',
  allow: '/',
  disallow: ['/admin/', '/api/', '/_next/', '/test'],
},
{
  userAgent: 'Bytespider', // TikTok
  disallow: '/',
},
{
  userAgent: 'Google-Extended', // Google для AI-тренировок (можно разрешить или запретить)
  allow: '/',
  disallow: ['/admin/'],
},
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}