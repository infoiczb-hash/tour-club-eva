'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth'; // ✅ Импортируем нашу броню

// ==========================================
// КАТЕГОРИИ ТУРОВ (TOUR CATEGORIES)
// ==========================================

// Чтение оставляем открытым (без обертки)
export async function getTourCategoriesAction() {
  try {
    const categories = await prisma.tourCategory.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Ошибка загрузки категорий туров:", error);
    return { success: false, error: "Не удалось загрузить категории" };
  }
}

export const upsertTourCategoryAction = withAdminAuth(async (data: any) => {
  try {
    const payload = {
      title: data.title,
      slug: data.slug,
      icon: data.icon || 'Compass',
      color: data.color || 'teal',
      sortOrder: Number(data.sort_order) || 0,
      isActive: data.is_active ?? true,
    };

    let category;
    if (data.id) {
      category = await prisma.tourCategory.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      category = await prisma.tourCategory.create({
        data: payload,
      });
    }

    revalidatePath('/admin');
    revalidatePath('/tour');
    revalidatePath('/');
    return { success: true, data: category };
  } catch (error: any) {
    console.error("Ошибка сохранения категории тура:", error);
    return { success: false, error: "Не удалось сохранить категорию" };
  }
});

export const deleteTourCategoryAction = withAdminAuth(async (id: string) => {
  try {
    const linkedTours = await prisma.tour.count({ where: { categoryId: id } });
    if (linkedTours > 0) {
      return { success: false, error: `Нельзя удалить! К этой категории привязано ${linkedTours} туров.` };
    }

    await prisma.tourCategory.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/tour');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Ошибка при удалении категории" };
  }
});

export const toggleTourCategoryStatusAction = withAdminAuth(async (id: string, currentStatus: boolean) => {
  try {
    await prisma.tourCategory.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/admin');
    revalidatePath('/tour');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Ошибка обновления статуса" };
  }
});

// ==========================================
// КАТЕГОРИИ БЛОГА (BLOG CATEGORIES)
// ==========================================

// Чтение оставляем открытым (без обертки)
export async function getBlogCategoriesAction() {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Ошибка загрузки категорий блога:", error);
    return { success: false, error: "Не удалось загрузить категории" };
  }
}

export const upsertBlogCategoryAction = withAdminAuth(async (data: any) => {
  try {
    const payload = {
      title: data.title,
      slug: data.slug,
      sortOrder: Number(data.sort_order) || 0,
      isActive: data.is_active ?? true,
    };

    let category;
    if (data.id) {
      category = await prisma.blogCategory.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      category = await prisma.blogCategory.create({
        data: payload,
      });
    }

    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true, data: category };
  } catch (error: any) {
    console.error("Ошибка сохранения категории блога:", error);
    return { success: false, error: "Не удалось сохранить категорию" };
  }
});

export const deleteBlogCategoryAction = withAdminAuth(async (id: string) => {
  try {
    const linkedPosts = await prisma.blog.count({ where: { categoryId: id } });
    if (linkedPosts > 0) {
      return { success: false, error: `Нельзя удалить! Привязано ${linkedPosts} статей.` };
    }

    await prisma.blogCategory.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Ошибка при удалении категории" };
  }
});

export const toggleBlogCategoryStatusAction = withAdminAuth(async (id: string, currentStatus: boolean) => {
  try {
    await prisma.blogCategory.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Ошибка обновления статуса" };
  }
});