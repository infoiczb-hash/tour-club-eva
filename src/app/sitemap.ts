// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { BASE_URL } from '@/lib/constants';

/**
 * Динамическая генерация Sitemap для Google/Yandex.
 * Сочетает статичные маршруты и динамические данные из БД (Туры, Блог, Гиды).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. ДИНАМИЧЕСКИЕ ТУРЫ
  let tourUrls: MetadataRoute.Sitemap = [];
  try {
    const tours = await prisma.tour.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    });
    tourUrls = tours.map((tour) => ({
      url: `${BASE_URL}/tour/${tour.slug}`,
      lastModified: tour.updatedAt ? new Date(tour.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch (e) {
    console.error('Sitemap Tours Error:', e);
  }

  // 2. ДИНАМИЧЕСКИЙ БЛОГ
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blog.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    blogUrls = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error('Sitemap Blog Error:', e);
  }

  // 3. ДИНАМИЧЕСКИЕ ГИДЫ
  let guideUrls: MetadataRoute.Sitemap = [];
  try {
    const guides = await prisma.guide.findMany({
      where: { isActive: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    });
    guideUrls = guides
      .filter(g => g.slug) // Дополнительная проверка на наличие slug
      .map((guide) => ({
        url: `${BASE_URL}/guides/${guide.slug}`,
        lastModified: guide.updatedAt ? new Date(guide.updatedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
  } catch (e) {
    console.error('Sitemap Guides Error:', e);
  }

  // 4. СТАТИЧНЫЕ СТРАНИЦЫ (Сохранены все из оригинала + направления)
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/tour`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    
    // Направления (с приоритетом 0.8)
    { url: `${BASE_URL}/directions/kayaking`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/directions/sup`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/directions/hiking`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/kids`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/local`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/organizers`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },

    // Служебные и инфо-страницы
    { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/fun`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/offer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [...staticPages, ...tourUrls, ...blogUrls, ...guideUrls];
}