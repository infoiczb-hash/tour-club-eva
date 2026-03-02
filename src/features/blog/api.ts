// src/features/blog/api.ts
"use server"; 
import { prisma } from '@/lib/prisma';

export async function getBlogPosts() {
  try {
    const posts = await prisma.blog.findMany({
      orderBy: {
        date: 'desc', // Или createdAt, если используете его
      },
      // 👇 ВАЖНО: Подтягиваем данные связанного гида и категории
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        },
        blogCategory: true // ✅ ДОБАВЛЕНО: Связь с категорией
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