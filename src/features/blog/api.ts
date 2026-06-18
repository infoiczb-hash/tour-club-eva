// src/features/blog/api.ts
"use server"; 
import { prisma } from '@/lib/prisma';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { Prisma } from '@prisma/client';

export type BlogPreview = Prisma.BlogGetPayload<{
  select: {
    id: true; slug: true; title: true; excerpt: true; image: true;
    date: true; tags: true; createdAt: true; updatedAt: true;
    read_time: true; is_trending: true; category: true; categoryId: true;
    format: true; author_name: true; author_role: true; author_image: true;
    guideId: true; isActive: true;
    relatedTourId: true; 
    // ✅ ДОБАВЛЕНО: Типизация связанного тура
    relatedTour: { select: { title: true; slug: true; coverImage: true; price: true; currency: true; } };
    guide: {
      select: { id: true; name: true; image: true; role: true; }
    };
    blogCategory: {
      select: {
        id: true; slug: true; title: true; isActive: true;
        sortOrder: true; createdAt: true; updatedAt: true;
      }
    };
  }
}>;

// ─────────────────────────────────────────────
// 1. ДЛЯ АДМИНКИ: Полные посты (БЕЗ Data Cache)
// ─────────────────────────────────────────────
export const getBlogPosts = cache(async (options?: { includeDrafts?: boolean }) => {
  try {
    const posts = await prisma.blog.findMany({
      where: options?.includeDrafts ? undefined : { isActive: true },
      orderBy: { date: 'desc' },
      include: {
        guide: { select: { id: true, name: true, image: true, role: true } },
        blogCategory: true,
        // ✅ ДОБАВЛЕНО: Привязка тура для админки
        relatedTour: { select: { id: true, title: true, slug: true, coverImage: true } }
      }
    });
    return posts;
  } catch (error) {
    console.error('Ошибка при получении постов:', error);
    return [];
  }
});

// ─────────────────────────────────────────────
// 2. ДЛЯ КЛИЕНТА: Легкие превью (С Data Cache и гидратацией дат)
// ─────────────────────────────────────────────
const fetchBlogPreviews = unstable_cache(
  async (options?: { take?: number }) => {
    const posts = await prisma.blog.findMany({
      where: { isActive: true },
      orderBy: { date: 'desc' },
      take: options?.take || 100,
      select: {
        id: true, slug: true, title: true, excerpt: true,
        image: true, date: true, tags: true, createdAt: true,
        updatedAt: true, read_time: true, is_trending: true,
        category: true, categoryId: true, format: true,
        author_name: true, author_role: true, author_image: true,
        guideId: true, isActive: true,
        relatedTourId: true,
        // ✅ ДОБАВЛЕНО: Связанный тур для ленты
        relatedTour: {
          select: { title: true, slug: true, coverImage: true, price: true, currency: true }
        },
        guide: {
          select: { id: true, name: true, image: true, role: true }
        },
        blogCategory: {
          select: {
            id: true, slug: true, title: true, isActive: true, 
            sortOrder: true, createdAt: true, updatedAt: true
          }
        },
      }
    });
    // Обеспечиваем чистую сериализацию для внутреннего кэша Next.js
    return JSON.parse(JSON.stringify(posts));
  },
  ['blog-previews-cache-key'],
  { revalidate: 3600, tags: ['blog'] }
);

export async function getBlogPreviews(options?: { take?: number }): Promise<BlogPreview[]> {
  try {
    const posts = await fetchBlogPreviews(options);
    return posts.map((post: any) => ({
      ...post,
      date: new Date(post.date),
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt)
    }));
  } catch (error) {
    console.error('Ошибка при получении превью постов:', error);
    return [];
  }
}

// ─────────────────────────────────────────────
// 3. ДЛЯ СТРАНИЦЫ СТАТЬИ: Полные данные страницы статьи (С Data Cache)
// ─────────────────────────────────────────────
const fetchBlogPostPageData = unstable_cache(
  async (slug: string) => {
    if (!slug) return null;
    const decodedSlug = decodeURIComponent(slug);

    const [post, relatedCandidates] = await Promise.all([
      prisma.blog.findUnique({
        where: { slug: decodedSlug },
        include: { 
          blogCategory: true,
          guide: { 
            select: { 
              id: true,
              slug: true, 
              name: true,
              image: true,
              role: true,
              bio: true,
              instagram: true
            } 
          },
          relatedTour: {
            select: { 
              title: true, 
              slug: true, 
              coverImage: true, 
              price: true, 
              currency: true 
            }
          }
        } 
      }),
      prisma.blog.findMany({
        where: { 
          isActive: true,
          slug: { not: decodedSlug }
        },
        take: 6,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          image: true,
          category: true,
          categoryId: true,
          blogCategory: {
            select: { title: true }
          },
          date: true
        }
      })
    ]);
    
    if (!post) return null;

    const finalRelated = [...relatedCandidates]
      .sort((a, b) => (a.categoryId === post.categoryId ? -1 : 1))
      .slice(0, 3);

    return JSON.parse(JSON.stringify({ post, relatedPosts: finalRelated }));
  },
  ['blog-post-page-data-cache-key'],
  { revalidate: 3600, tags: ['blog'] }
);

/**
 * Высокоуровневая функция получения данных статьи с гарантированной гидратацией дат.
 * Полностью исключает возникновение ошибок сериализации ("белого экрана").
 */
export async function getBlogPostPageData(slug: string) {
  try {
    const data = await fetchBlogPostPageData(slug);
    if (!data) return null;

    // СЕНЬОР-ФИКС: Превращаем строки ISO обратно в полноценные объекты Date
    if (data.post) {
      data.post.date = new Date(data.post.date);
      data.post.createdAt = new Date(data.post.createdAt);
      data.post.updatedAt = new Date(data.post.updatedAt);
    }

    if (Array.isArray(data.relatedPosts)) {
      data.relatedPosts.forEach((p: any) => {
        if (p.date) p.date = new Date(p.date);
      });
    }

    return data;
  } catch (error) {
    console.error(`Ошибка гидратации данных для поста ${slug}:`, error);
    return null;
  }
}

// Оригинальный метод для совместимости
export const getBlogPostBySlug = cache(async (slug: string) => {
  try {
    const post = await prisma.blog.findUnique({
      where: { slug },
      include: {
        guide: {
          select: {
            id: true, name: true, image: true, role: true, bio: true, instagram: true
          }
        },
        blogCategory: true,
        // ✅ ДОБАВЛЕНО: Решает проблему затирания тура в форме админки
        relatedTour: { select: { id: true, title: true, slug: true, coverImage: true } }
      }
    });
    return post;
  } catch (error) {
    console.error(`Ошибка при получении поста ${slug}:`, error);
    return null;
  }
});