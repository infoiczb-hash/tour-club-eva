'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

// ==========================================
// TYPES
// ==========================================
interface TicketsJson {
  adult?: number;
  child?: number;
  member?: number;
  comment?: string;
  social?: string;
}

interface TourDatesJson {
  start?: string;
  end?: string;
  guide_id?: string;
}

// ==========================================
// 1. БРОНИРОВАНИЯ (CRM)
// ==========================================

export async function getRegistrationsAction() {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const rawData = await prisma.booking.findMany({
      include: {
        tour: { select: { title: true, dates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = rawData.map((item) => {
      const dates = (item.tour?.dates as TourDatesJson[]) || [];
      const firstDate = dates[0]?.start ? new Date(dates[0].start) : null;
      const tickets = (item.tickets as TicketsJson) || {};

      return {
        id: item.id,
        user_name: item.name,
        user_phone: item.phone,
        status: item.status || 'pending',
        created_at: item.createdAt,
        tickets_adult: Number(tickets.adult || 0),
        tickets_child: Number(tickets.child || 0),
        tickets_member: Number(tickets.member || 0),
        total_price: item.totalPrice,
        comment: tickets.comment || '',
        social: item.email || tickets.social || '',
        event_id: item.tourId,
        tour: item.tour
          ? { title: item.tour.title, date: item.bookedDate || firstDate }
          : undefined,
      };
    });

    return { data };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized', data: [] };
    console.error('Get Registrations Error:', error);
    return { error: error.message, data: [] };
  }
}

export async function updateRegistrationStatus(id: string, status: string) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus },
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized' };
    console.error('Update Status Error:', error);
    return { error: 'Ошибка обновления статуса' };
  }
}

// ==========================================
// 2. ГИДЫ
// ==========================================

export async function saveGuideAction(data: any) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const { id, ...rest } = data;
    const payload = {
      name: rest.name,
      role: rest.role || 'Guide',
      image: rest.image || null,
      actionImage: rest.actionImage || null,
      superpower: rest.superpower || null,
      experience: rest.experience || null,
      achievements: rest.achievements || [],
      bio: rest.bio || null,
      instagram: rest.instagram || null,
      telegram: rest.telegram || null,
      contact: rest.contact || null,
      isActive: true,
    };

    if (id) {
      await prisma.guide.update({ where: { id: String(id) }, data: payload });
    } else {
      await prisma.guide.create({ data: payload });
    }

    revalidatePath('/admin');
    revalidatePath('/');
    // 👇 ДОБАВЛЕНО: Инвалидация кэша хаба и страницы гида
    revalidatePath('/guides');
    if (data.slug) {
      revalidatePath(`/guides/${data.slug}`);
    }

    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized' };
    console.error('Save Guide Error:', error);
    return { error: error.message || 'Ошибка при сохранении гида' };
  }
}

export async function deleteGuideAction(id: string | number) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.guide.delete({ where: { id: String(id) } });
    
    revalidatePath('/admin');
    revalidatePath('/');
    // 👇 ДОБАВЛЕНО: Инвалидация кэша хаба при удалении
    revalidatePath('/guides'); 
    
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized' };
    console.error('Delete Guide Error:', error);
    return { error: 'Не удалось удалить гида' };
  }
}

// ==========================================
// 3. БЛОГ
// ==========================================

export async function savePostAction(data: any) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const { id } = data;

    let slug = data.slug;
    if (!slug) {
      slug = data.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    }

    const existingPost = await prisma.blog.findUnique({ where: { slug } });
    if (existingPost && existingPost.id !== id) {
      if (!id) slug = `${slug}-${Date.now().toString().slice(-4)}`;
      else return { error: 'Такой URL (slug) уже занят! Измените его.' };
    }

    const formattedData = {
      title: data.title,
      slug,
      excerpt: data.excerpt || '',
      content: data.content,
      categoryId: data.category_id || null,
      tags: data.tags || [],
      category: data.category || 'OTHER',
      image: data.image || null,
      read_time: Number(data.read_time) || 5,
      is_trending: Boolean(data.is_trending),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      author_name: data.author_name || 'Team Eva',
      author_role: data.author_role || 'Guide Club',
      author_image: data.author_image || null,
      guideId: data.guide_id || null,
      updatedAt: new Date(),
    };

    if (id) {
      await prisma.blog.update({ where: { id }, data: formattedData });
    } else {
      await prisma.blog.create({ data: formattedData });
    }

    revalidatePath('/admin');
    revalidatePath('/blog');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized' };
    if (error.code === 'P2002') return { error: 'URL (slug) должен быть уникальным' };
    return { error: error.message || 'Ошибка сохранения' };
  }
}

export async function deletePostAction(id: string) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    await prisma.blog.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized' };
    return { error: 'Ошибка удаления поста' };
  }
}

// ==========================================
// 4. ТУРЫ — делегируем на actions/tour.ts
// ⚠️ saveTourAction УДАЛЁН — используй saveTour из actions/tour.ts напрямую
// ==========================================

export async function deleteTourAction(id: string) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const tour = await prisma.tour.findUnique({ where: { id }, select: { slug: true } });
    await prisma.tour.delete({ where: { id } });

    revalidatePath('/admin');
    revalidatePath('/tour');
    if (tour?.slug) revalidatePath(`/tour/${tour.slug}`); // ✅ slug, не ID
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized' };
    return { error: 'Ошибка удаления тура' };
  }
}

// ==========================================
// 5. КОНТЕНТ-БЛОКИ
// ==========================================

// ==========================================
// 5. КОНТЕНТ-БЛОКИ
// ==========================================

export async function saveContentBlockAction(slug: string, content: any) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    // Реальная запись в базу вместо Mock-заглушки
    await prisma.contentBlock.upsert({
      where: { slug },
      update: { content },
      create: { slug, content }
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { error: 'Unauthorized' };
    console.error('Content Save Error:', error);
    return { error: 'Ошибка сохранения блока' };
  }
}
