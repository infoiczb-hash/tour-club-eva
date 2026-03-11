import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma'; // 👈 Добавили Prisma
import { BASE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. ТУРЫ (динамические) - ЛЕГКОВЕСНЫЙ ЗАПРОС
  let tourUrls: MetadataRoute.Sitemap = [];
  try {
    const tours = await prisma.tour.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }, // 🔥 Берем только 2 поля!
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

  // 2. БЛОГ (динамический) - ЛЕГКОВЕСНЫЙ ЗАПРОС
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const blogs = await prisma.blog.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }, // 🔥 Берем только 2 поля!
    });
    blogUrls = blogs.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error('Sitemap Blog Error:', e);
  }

  // 3. ГИДЫ (динамические) - ЛЕГКОВЕСНЫЙ ЗАПРОС
  let guideUrls: MetadataRoute.Sitemap = [];
  try {
    const guides = await prisma.guide.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }, // 🔥 Берем только 2 поля!
    });
    guideUrls = guides.map((guide) => ({
      url: `${BASE_URL}/guides/${guide.slug}`,
      lastModified: guide.updatedAt ? new Date(guide.updatedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error('Sitemap Guides Error:', e);
  }

  // 4. СТАТИЧНЫЕ СТРАНИЦЫ
  const staticPages: MetadataRoute.Sitemap = [
    // Главная
    { url: BASE_URL,                              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },

    // Туры и блог
    { url: `${BASE_URL}/tour`,                    lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/blog`,                    lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },

    // Направления — хаб и отдельные страницы
    { url: `${BASE_URL}/directions`,              lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/kayaking`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/sup`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/hiking`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/kids`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/local`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/organizers`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Команда
    { url: `${BASE_URL}/guides`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // О клубе и информация
    { url: `${BASE_URL}/about`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/fun`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

    // Юридические страницы
    { url: `${BASE_URL}/offer`,                   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/privacy`,                 lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];

  return [...staticPages, ...tourUrls, ...blogUrls, ...guideUrls];
}