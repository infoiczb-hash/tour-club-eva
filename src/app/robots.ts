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
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}