'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookingStatus, Prisma } from '@prisma/client';
import { sendToUserTelegram } from '@/features/admin/actions/telegram';

// ==========================================
// TYPES
// ==========================================
interface TourDatesJson {
  start?: string;
  end?: string;
  guide_id?: string;
}

export interface SaveGuidePayload {
  id?: string;
  name: string;
  role?: string;
  image?: string | null;
  actionImage?: string | null;
  superpower?: string | null;
  experience?: string | null;
  achievements?: string[];
  bio?: string | null;
  fullBio?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  contact?: string | null;
  isActive?: boolean;
  slug?: string;
  quotes?: string[];
  stats?: unknown; 
  order?: number | string;
}

export interface SavePostPayload {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  category_id?: string;
  tags?: string[];
  category?: string;
  image?: string | null;
  read_time?: string | number;
  is_trending?: boolean;
  isActive?: boolean;
  author_name?: string;
  author_role?: string;
  author_image?: string | null;
  guide_id?: string | null;
}

// ==========================================
// 1. БРОНИРОВАНИЯ (CRM)
// ==========================================

export async function getRegistrationsAction() {
  try {
    await requireAuth(); 

    // ✅ ИСПРАВЛЕНИЕ: Подтягиваем новую связь tourDate
    const rawData = await prisma.booking.findMany({
      include: {
        tour: { select: { title: true, dates: true } },
        tourDate: { select: { startDate: true } } 
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = rawData.map((item) => {
      // Фолбэк для старых JSON-дат (если тур был создан до обновы)
      const legacyDates = (item.tour?.dates as TourDatesJson[]) || [];
      const firstLegacyDate = legacyDates[0]?.start ? new Date(legacyDates[0].start) : null;
      
      // ✅ ИСПРАВЛЕНИЕ: Определяем самую точную дату выезда для заявки
      const actualDate = item.tourDate?.startDate || item.bookedDate || firstLegacyDate;

      return {
        id: item.id,
        user_name: item.name,
        user_phone: item.phone,
        status: item.status || 'pending',
        created_at: item.createdAt,
        
        // ✅ ИСПРАВЛЕНИЕ: Берем билеты из новых плоских колонок
        tickets_adult: item.ticketsAdult,
        tickets_child: item.ticketsChild,
        tickets_family: item.ticketsFamily,
        tickets_member: item.ticketsMember,
        
        // ✅ ИСПРАВЛЕНИЕ: Новые поля CRM
        amount_paid: item.amountPaid,
        source: item.source,
        total_price: item.totalPrice,
        
        comment: item.comment || '',
        social: item.social || item.email || '',
        event_id: item.tourId,
        tour: item.tour
          ? { title: item.tour.title, date: actualDate }
          : undefined,
      };
    });

    return { data };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized', data: [] };
    // 🛡️ Защита от утечки
    console.error('Get Registrations Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при загрузке бронирований', data: [] };
  }
}
export async function updateRegistrationStatus(id: string, status: string) {
  try {
    await requireAuth(); 

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus },
      include: { 
        tour: { select: { title: true, slug: true } },
        member: { select: { tgChatId: true } } // Достаем ID телеграма
      }
    });

    // 🔥 ТРИГГЕР: Отправляем пуш юзеру, если статус стал "confirmed" (Оплачено)
    if (status === 'confirmed' && (booking.member as any)?.tgChatId) {
        const msg = `✅ <b>Оплата получена!</b>\n\nВаше участие в туре <b>${booking.tour.title}</b> успешно подтверждено.\nВся информация и билет уже ждут вас в личном кабинете.`;
        const link = `${process.env.NEXT_PUBLIC_SITE_URL}/account/bookings`;
        await sendToUserTelegram((booking.member as any).tgChatId, msg, link);
    }

    revalidatePath('/admin');
    revalidatePath('/account'); // Сброс кэша ЛК, чтобы статус обновился у клиента
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized' };
    console.error('Update Status Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при обновлении статуса' };
  }
}

// ==========================================
// 2. ГИДЫ
// ==========================================

export async function saveGuideAction(data: SaveGuidePayload) {
  try {
    await requireAuth(); 

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
      fullBio: rest.fullBio || null,
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
    revalidatePath('/guides');
    if (data.slug) {
      revalidatePath(`/guides/${data.slug}`);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized' };
    // 🛡️ Защита от утечки
    console.error('Save Guide Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при сохранении профиля гида' };
  }
}

export async function deleteGuideAction(id: string | number) {
  try {
    await requireAuth(); 

    await prisma.guide.delete({ where: { id: String(id) } });
    
    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/guides'); 
    
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized' };
    // 🛡️ Защита от утечки
    console.error('Delete Guide Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при удалении гида' };
  }
}

// ==========================================
// 3. БЛОГ
// ==========================================

export async function savePostAction(data: SavePostPayload) {
  try {
    await requireAuth(); 

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
  } catch (error: unknown) {
    const err = error as { message?: string, code?: string };
    if (err.message === 'Unauthorized') return { error: 'Unauthorized' };
    // Единственная разрешенная техническая ошибка (понятна юзеру)
    if (err.code === 'P2002') return { error: 'URL (slug) должен быть уникальным' };
    // 🛡️ Защита от утечки
    console.error('Save Post Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при сохранении поста' };
  }
}

export async function togglePostStatusAction(id: string, field: 'isActive' | 'is_trending', value: boolean) {
  try {
    await requireAuth();
    await prisma.blog.update({
      where: { id },
      data: { [field]: value }
    });
    revalidatePath('/admin');
    revalidatePath('/blog');
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    console.error('Toggle Post Status Error:', error);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при обновлении статуса' };
  }
}

export async function deletePostAction(id: string) {
  try {
    await requireAuth(); 

    await prisma.blog.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized' };
    // 🛡️ Защита от утечки
    console.error('Delete Post Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при удалении поста' };
  }
}

// ==========================================
// 4. ТУРЫ
// ==========================================

export async function deleteTourAction(id: string) {
  try {
    await requireAuth(); 

    const tour = await prisma.tour.findUnique({ where: { id }, select: { slug: true } });
    
    // ✅ ИСПРАВЛЕНИЕ: Мягкое удаление (Soft Delete), чтобы защитить статистику CRM
    await prisma.tour.update({ 
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });

    revalidatePath('/admin');
    revalidatePath('/tour');
    if (tour?.slug) revalidatePath(`/tour/${tour.slug}`); 
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized' };
    // 🛡️ Защита от утечки
    console.error('Delete Tour Action Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при удалении тура' };
  }
}

// ==========================================
// 5. КОНТЕНТ-БЛОКИ
// ==========================================

export async function saveContentBlockAction(slug: string, content: Prisma.InputJsonValue) {
  try {
    await requireAuth(); 

    await prisma.contentBlock.upsert({
      where: { slug },
      update: { content },
      create: { slug, content }
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized' };
    // 🛡️ Защита от утечки
    console.error('Content Save Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при сохранении блока' };
  }
}