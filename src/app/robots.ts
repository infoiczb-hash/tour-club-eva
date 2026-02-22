import { MetadataRoute } from 'next';

const BASE_URL = 'https://tour-club-eva.vercel.app'; // Или твой домен

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/', // Запрещаем сканировать админку
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}