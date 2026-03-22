// src/features/blog/api.ts
"use server"; 
import { prisma } from '@/lib/prisma';

export async function getBlogPosts(options?: { includeDrafts?: boolean }) {
  try {
    const posts = await prisma.blog.findMany({
      // ✅ ДОБАВЛЕНО: Если просят включить черновики (для админки) — убираем фильтр, иначе только активные
      where: options?.includeDrafts ? undefined : { isActive: true },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true, // ✅ ДОБАВЛЕНО: нужно для ExtendedBlog
        image: true,
        date: true,
        tags: true, // ✅ ДОБАВЛЕНО: нужно для ExtendedBlog
        createdAt: true,
        updatedAt: true, // ✅ ДОБАВЛЕНО: нужно для ExtendedBlog
        read_time: true,
        is_trending: true,
        category: true,
        categoryId: true,
        format: true, // ✅ ДОБАВЛЕНО: нужно для ExtendedBlog
        author_name: true,
        author_role: true,
        author_image: true,
        guideId: true, // ✅ ДОБАВЛЕНО: нужно для ExtendedBlog
        isActive: true,
        guide: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          }
        },
        blogCategory: {
          select: {
            id: true,
            slug: true,
            title: true,
            isActive: true, // ✅ ДОБАВЛЕНО: для соответствия типу ExtendedBlog.blogCategory
            sortOrder: true, // ✅ ДОБАВЛЕНО
            createdAt: true, // ✅ ДОБАВЛЕНО
            updatedAt: true  // ✅ ДОБАВЛЕНО
          }
        },
      }
    });
    return posts;
  } catch (error) {
    console.error('Ошибка при получении постов:', error);
    return [];
  }
}

// Также полезно добавить функцию получения одного поста по slug с гидом
export async function getBlogPostBySlug(slug: string) {
  try {
    const post = await prisma.blog.findUnique({
      where: { slug },
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            bio: true,
            instagram: true
          }
        },
        blogCategory: true // ✅ ДОБАВЛЕНО: Связь с категорией
      }
    });
    return post;
  } catch (error) {
    console.error(`Ошибка при получении поста ${slug}:`, error);
    return null;
  }
}