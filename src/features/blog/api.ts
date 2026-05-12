// src/features/blog/api.ts
"use server"; 
import { prisma } from '@/lib/prisma';
import { cache } from 'react';
import { Prisma } from '@prisma/client';

export type BlogPreview = Prisma.BlogGetPayload<{
  select: {
    id: true; slug: true; title: true; excerpt: true; image: true;
    date: true; tags: true; createdAt: true; updatedAt: true;
    read_time: true; is_trending: true; category: true; categoryId: true;
    format: true; author_name: true; author_role: true; author_image: true;
    guideId: true; isActive: true;
    relatedTourId: true; 
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
// 1. ДЛЯ АДМИНКИ: Полные посты (с content)
// ─────────────────────────────────────────────
export const getBlogPosts = cache(async (options?: { includeDrafts?: boolean }) => {
  try {
    const posts = await prisma.blog.findMany({
      where: options?.includeDrafts ? undefined : { isActive: true },
      orderBy: { date: 'desc' },
      // В админке нам нужны все поля для редактирования, поэтому используем include
      include: {
        guide: { select: { id: true, name: true, image: true, role: true } },
        blogCategory: true
      }
    });
    return posts;
  } catch (error) {
    console.error('Ошибка при получении постов:', error);
    return [];
  }
});

// ─────────────────────────────────────────────
// 2. ДЛЯ КЛИЕНТА: Легкие превью (БЕЗ content)
// ─────────────────────────────────────────────
export const getBlogPreviews = cache(async (options?: { take?: number }): Promise<BlogPreview[]> => {
  try {
    const posts = await prisma.blog.findMany({
      where: { isActive: true }, // Клиенту всегда только активные
      orderBy: { date: 'desc' },
      take: options?.take || 100, // Защита от полного скана БД
      select: {
        id: true, slug: true, title: true, excerpt: true,
        image: true, date: true, tags: true, createdAt: true,
        updatedAt: true, read_time: true, is_trending: true,
        category: true, categoryId: true, format: true,
        author_name: true, author_role: true, author_image: true,
        guideId: true, isActive: true,
        relatedTourId: true,
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
    return posts;
  } catch (error) {
    console.error('Ошибка при получении превью постов:', error);
    return [];
  }
});

// ─────────────────────────────────────────────
// 3. ДЛЯ СТРАНИЦЫ СТАТЬИ: Один пост детально (Остается без изменений)
// ─────────────────────────────────────────────
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
        blogCategory: true 
      }
    });
    return post;
  } catch (error) {
    console.error(`Ошибка при получении поста ${slug}:`, error);
    return null;
  }
});