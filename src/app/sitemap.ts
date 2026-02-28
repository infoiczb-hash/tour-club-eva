import { MetadataRoute } from 'next';
import { getTours } from '@/features/tours/api';
import { getBlogPosts } from '@/features/blog/api';
import { getGuides } from '@/features/guides/api'; // Добавь этот импорт

const BASE_URL = 'https://www.evatur.club';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. ТУРЫ (используем slug)
  const tours = await getTours();
  const tourUrls = tours.map((tour) => ({
    url: `${BASE_URL}/tour/${tour.slug}`,
    lastModified: tour.updatedAt ? new Date(tour.updatedAt) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

// 2. БЛОГ
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const blogs = await getBlogPosts();
    // 👇 ИСПРАВЛЕНО: Строгая типизация параметра post
    blogUrls = blogs.map((post: { slug: string; updatedAt: Date | string | null }) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error('Sitemap Blog Error:', e);
  }

  // 3. 🔥 ГИДЫ (Твоя новая SEO-мощь)
 let guideUrls: MetadataRoute.Sitemap = [];
  try {
    const guides = await getGuides();
    guideUrls = guides
      // 👇 ИСПРАВЛЕНО: Строгая типизация параметров g и guide
      .filter((g: { isActive: boolean }) => g.isActive) 
      .map((guide: { slug: string | null; updatedAt: Date | string | null }) => ({
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
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/tour`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/fun`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    // Направления
    { url: `${BASE_URL}/directions/kayaking`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/sup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/hiking`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/kids`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/local`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/directions/organizers`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  return [...staticPages, ...tourUrls, ...blogUrls, ...guideUrls];
}