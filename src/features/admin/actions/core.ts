// src/features/admin/actions/core.ts
'use server';

import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { BookingStatus, Prisma } from '@prisma/client';
import { sendToUserTelegram, publishPostToChannel } from '@/features/admin/actions/telegram';
import type { GroupManifest } from '@/features/admin/components/views/BookingsTab';

// ==========================================
// 0. ОБЩИЕ ИНТЕРФЕЙСЫ И ТИПЫ
// ==========================================

export interface GuestJsonData {
  isMain?: boolean;
  name?: string;
  ticketType?: 'adult' | 'child' | 'family' | 'member';
  age?: string | number;
  jacket?: string;
  phone?: string;
}

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
// 1. БРОНИРОВАНИЯ (CRM) - ИСПРАВЛЕН БАГ ГДЕ ПРОПАДАЛИ БРОНИ
// ==========================================

export interface GetRegistrationsParams {
  page: number;
  limit?: number;
  search?: string;
  filterTab?: 'active' | 'archive';
}

export const getRegistrationsAction = withAdminAuth(async (params: GetRegistrationsParams) => {
  try {
    const { page, limit = 20, search, filterTab = 'active' } = params;
    const skip = (page - 1) * limit;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const where: Prisma.BookingWhereInput = {};
    const andConditions: Prisma.BookingWhereInput[] = [];

    // Поиск (не затирает другие условия)
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { comment: { contains: search, mode: 'insensitive' } },
          { tour: { title: { contains: search, mode: 'insensitive' } } },
        ]
      });
    }

    if (filterTab === 'active') {
      // ✅ ФИКС: Оффлайн-брони (tourDateId: null) теперь видны в активных
      andConditions.push({
        status: { notIn: ['cancelled', 'rejected'] },
        OR: [
          { tourDate: { startDate: { gte: now } } },
          { tourDateId: null } 
        ]
      });
    } else {
      // Архив: отменённые/отклонённые ИЛИ прошедшие по дате
      andConditions.push({
        OR: [
          { status: { in: ['cancelled', 'rejected'] } },
          { tourDate: { startDate: { lt: now } } },
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [bookingsRaw, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          tour: { select: { title: true } }, 
          tourDate: { select: { startDate: true } },
          member: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const data = bookingsRaw.map((item) => {
    const actualDate = item.tourDate?.startDate || item.bookedDate || null;

      return {
        id: item.id,
        user_name: item.name,
        user_phone: item.phone,
        status: item.status,
        created_at: item.createdAt,
        tickets_adult: item.ticketsAdult,
        tickets_child: item.ticketsChild,
        tickets_family: item.ticketsFamily,
        tickets_member: item.ticketsMember,
        short_id: item.shortId ?? undefined,
        guests: item.guests || [],
        payment_method: item.paymentMethod || 'cash',
        discount: item.discount,
        amount_paid: item.amountPaid,
        source: item.source,
        total_price: item.totalPrice,
        tourId: item.tourId,
        tourDateId: item.tourDateId ?? undefined,
        comment: item.comment ?? '',
        social: item.social ?? item.email ?? '',
        payment_proof_url: item.paymentProofUrl ?? null,
        receipt_url: item.receiptUrl ?? null,
        confirmed_by: item.confirmedBy ?? null,
        confirmed_at: item.confirmedAt ?? null,
        tour: item.tour
          ? { title: item.tour.title, date: actualDate }
          : undefined,
      };
    });

    return { success: true, data, total };
  } catch (error) {
    console.error('[getRegistrationsAction] Error:', error);
    return { success: false, error: 'Ошибка загрузки бронирований', data: [], total: 0 };
  }
});

// ==========================================
// 2. ГИДЫ (CRUD + АУДИТ)
// ==========================================

export const saveGuideAction = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_GUIDE',
    getTargetId: (data: SaveGuidePayload) => data.id || data.slug,
  })(async (data: SaveGuidePayload) => {
    try {
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
      if (data.slug) revalidatePath(`/guides/${data.slug}`);

      return { success: true };
    } catch (error) {
      console.error('Save Guide Error:', error);
      return { error: 'Не удалось сохранить профиль гида' };
    }
  })
);

export const deleteGuideAction = withAdminAuth(
  withAdminAudit({
    actionName: 'DELETE_GUIDE',
    getTargetId: (id: string | number) => String(id),
  })(async (id: string | number) => {
    try {
      await prisma.guide.delete({ where: { id: String(id) } });
      revalidatePath('/admin');
      revalidatePath('/');
      revalidatePath('/guides'); 
      return { success: true };
    } catch (error) {
      console.error('Delete Guide Error:', error);
      return { error: 'Ошибка при удалении гида' };
    }
  })
);

// ==========================================
// 3. БЛОГ (CRUD + АУДИТ)
// ==========================================

export const savePostAction = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_POST',
    getTargetId: (data: SavePostPayload) => data.id || data.slug,
  })(async (data: SavePostPayload) => {
    try {
      const { id } = data;
      let slug = data.slug || data.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

      const existingPost = await prisma.blog.findUnique({ where: { slug } });
      if (existingPost && existingPost.id !== id) {
        if (!id) slug = `${slug}-${Date.now().toString().slice(-4)}`;
        else return { error: 'URL (slug) уже занят!' };
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
      
      if (!id && formattedData.isActive) {
        publishPostToChannel({
          title: formattedData.title,
          excerpt: formattedData.excerpt,
          slug: slug!,
          image: formattedData.image,
        }).catch(console.error);
      }
      return { success: true };
    } catch (error) {
      console.error('Save Post Error:', error);
      return { error: 'Ошибка при сохранении статьи' };
    }
  })
);

export const togglePostStatusAction = withAdminAuth(
  withAdminAudit({
    actionName: 'TOGGLE_POST_STATUS',
    getTargetId: (id: string, _field: 'isActive' | 'is_trending', _value: boolean) => id, // ✅ Добавили недостающие аргументы
  })(async (id: string, field: 'isActive' | 'is_trending', value: boolean) => {
    try {
      const existing = field === 'isActive' 
        ? await prisma.blog.findUnique({ where: { id }, select: { isActive: true } }) 
        : null;

      const post = await prisma.blog.update({
        where: { id },
        data: { [field]: value },
        select: { title: true, excerpt: true, slug: true, image: true, isActive: true },
      });

      if (field === 'isActive' && !existing?.isActive && value) {
        publishPostToChannel({
          title: post.title,
          excerpt: post.excerpt,
          slug: post.slug,
          image: post.image,
        }).catch(console.error);
      }

      revalidatePath('/admin');
      revalidatePath('/blog');
      revalidatePath('/');
      return { success: true };
    } catch (error) {
      console.error('Toggle Post Error:', error);
      return { success: false, error: 'Ошибка обновления статуса' };
    }
  })
);

export const deletePostAction = withAdminAuth(
  withAdminAudit({
    actionName: 'DELETE_POST',
    getTargetId: (id: string) => id,
  })(async (id: string) => {
    try {
      await prisma.blog.delete({ where: { id } });
      revalidatePath('/admin');
      revalidatePath('/blog');
      return { success: true };
    } catch (error) {
      return { error: 'Ошибка при удалении поста' };
    }
  })
);

// ==========================================
// 4. ТУРЫ (SOFT DELETE + АУДИТ) УДАЛЕН такая функция есть tours/ts
// ==========================================


// ==========================================
// 5. КОНТЕНТ-БЛОКИ И CRM (АУДИТ)
// ==========================================
export const saveContentBlockAction = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_CONTENT_BLOCK',
    getTargetId: (slug: string, _content: Prisma.InputJsonValue) => slug, // ✅ Добавили второй аргумент
  })(async (slug: string, content: Prisma.InputJsonValue) => {
    try {
      await prisma.contentBlock.upsert({
        where: { slug },
        update: { content },
        create: { slug, content }
      });
      revalidatePath('/', 'layout');
      return { success: true };
    } catch (error) {
      return { error: 'Ошибка сохранения контента' };
    }
  })
);

export const updateBookingCommentAction = withAdminAuth(
  withAdminAudit({
    actionName: 'UPDATE_BOOKING_COMMENT',
    getTargetId: (id: string, _comment: string) => id, // ✅ Добавили _comment
  })(async (id: string, comment: string) => {
    try {
      await prisma.booking.update({ where: { id }, data: { comment } });
      revalidatePath('/admin');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Ошибка сохранения заметки' };
    }
  })
);

// ==========================================
// 6. МАНИФЕСТЫ (ГРУППЫ) - РЕШЕНО N+1 QUERY PROBLEM
// ==========================================

export interface GetGroupsManifestParams {
  page: number;
  limit?: number;
  search?: string;
  sortBy?: 'date_asc' | 'date_desc';
}

export type GetGroupsManifestResult =
  | { success: true; groups: GroupManifest[]; total: number }
  | { success: false; error: string };

export const getGroupsManifest = withAdminAuth(async (params: GetGroupsManifestParams): Promise<GetGroupsManifestResult> => {
  try {
    const { page, limit = 20, search, sortBy = 'date_asc' } = params;
    const skip = (page - 1) * limit;
    const activeStatuses: BookingStatus[] = ['pending', 'confirmed'];

    // 1. Получаем даты туров (основной запрос)
    const tourDates = await prisma.tourDate.findMany({
      where: {
        bookings: { some: { status: { in: activeStatuses } } },
        ...(search && { tour: { title: { contains: search, mode: 'insensitive' } } })
      },
      include: {
        tour: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { startDate: sortBy === 'date_asc' ? 'asc' : 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.tourDate.count({
      where: {
        bookings: { some: { status: { in: activeStatuses } } },
        ...(search && { tour: { title: { contains: search, mode: 'insensitive' } } })
      },
    });

    if (tourDates.length === 0) return { success: true, groups: [], total: 0 };

    // ✅ РЕШЕНИЕ N+1: Выгружаем все брони для выбранных дат одним запросом
    const tourDateIds = tourDates.map(td => td.id);
    const allBookings = await prisma.booking.findMany({
      where: {
        tourDateId: { in: tourDateIds },
        status: { in: activeStatuses },
      },
      orderBy: { createdAt: 'asc' }
    });

    // Группируем брони по ID даты в памяти
    const bookingsByDate = new Map<string, typeof allBookings>();
    allBookings.forEach(b => {
      const key = b.tourDateId!;
      if (!bookingsByDate.has(key)) bookingsByDate.set(key, []);
      bookingsByDate.get(key)!.push(b);
    });

    // 2. Формируем финальный массив групп
    const groups = tourDates.map(td => {
      const bookings = bookingsByDate.get(td.id) || [];
      const totalTickets = bookings.reduce((sum, b) => 
        sum + b.ticketsAdult + b.ticketsChild + b.ticketsMember + b.ticketsFamily * 3, 0
      );

      const participants = bookings.flatMap((b) => {
        const guestsArray = (b.guests as unknown) as GuestJsonData[];
        const mainGuestInfo = Array.isArray(guestsArray) ? guestsArray.find(g => g.isMain) : null;
        
        const mainParticipant = {
          isMain: true,
          bookingId: b.id,
          shortId: b.shortId ?? b.id.substring(0, 4),
          name: b.name,
          ticketType: 'adult',
          phone: b.phone,
          social: b.social,
          comment: b.comment,
          status: b.status,
          jacket: mainGuestInfo?.jacket || '', 
        };
        
        const extraGuests = Array.isArray(guestsArray)
          ? guestsArray.filter(g => !g.isMain).map(g => ({
              isMain: false,
              bookingId: b.id,
              shortId: b.shortId ?? b.id.substring(0, 4),
              name: g.name || 'Без имени',
              ticketType: g.ticketType || 'adult',
              age: g.age,
              jacket: g.jacket || '', 
              phone: g.phone,
              status: b.status,
            }))
          : [];
            
        return [mainParticipant, ...extraGuests];
      });

      return {
        tourName: td.tour.title,
        date: td.startDate.toLocaleDateString('ru-RU'),
        totalTickets,
        participants,
      };
    });

    return { success: true, groups, total };
  } catch (error) {
    console.error('[getGroupsManifest] Error:', error);
    return { success: false, error: 'Ошибка загрузки группы' };
  }
});