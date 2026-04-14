// src/features/admin/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth'; // 👈 ИМПОРТ БРОНИ
import { withAdminAudit } from '@/lib/audit'; // ✅ ИМПОРТ АУДИТА
import { prisma } from '@/lib/prisma';
import { BookingStatus, Prisma } from '@prisma/client';
import { sendToUserTelegram, publishPostToChannel } from '@/features/admin/actions/telegram';
import type { GroupManifest } from '@/features/admin/components/views/BookingsTab';

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
// 1. БРОНИРОВАНИЯ (CRM) С ПАГИНАЦИЕЙ (ЧТЕНИЕ - БЕЗ АУДИТА)
// ==========================================

export interface GetRegistrationsParams {
  page: number;
  limit?: number;          // по умолчанию 20
  search?: string;
  filterTab?: 'active' | 'archive';
}

export const getRegistrationsAction = withAdminAuth(async (params: GetRegistrationsParams) => {
  try {
    const { page, limit = 20, search, filterTab = 'active' } = params;
    const skip = (page - 1) * limit;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Построение WHERE
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { comment: { contains: search, mode: 'insensitive' } },
        { tour: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (filterTab === 'active') {
      // Активные: не отменённые/отклонённые + дата тура в будущем
      where.status = { notIn: ['cancelled', 'rejected'] };
      where.tourDate = { startDate: { gte: now } };
    } else {
      // Архив: отменённые/отклонённые ИЛИ прошедшие
      where.OR = [
        { status: { in: ['cancelled', 'rejected'] } },
        { tourDate: { startDate: { lt: now } } },
      ];
    }

    // 2. Параллельные запросы: данные + общее количество
    const [bookingsRaw, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          tour: { select: { title: true, dates: true } },
          tourDate: { select: { startDate: true } },
          member: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // 3. Маппинг в DTO (безопасный, без мутаций)
    const data = bookingsRaw.map((item) => {
      const legacyDates = (item.tour?.dates as TourDatesJson[]) || [];
      const firstLegacyDate = legacyDates[0]?.start ? new Date(legacyDates[0].start) : null;
      const actualDate = item.tourDate?.startDate || item.bookedDate || firstLegacyDate;

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
    console.error('[getRegistrationsAction]', error);
    return { success: false, error: 'Ошибка загрузки бронирований', data: [], total: 0 };
  }
});

// ==========================================
// 2. ГИДЫ (ЗАЩИЩЕНО АУДИТОМ)
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
      if (data.slug) {
        revalidatePath(`/guides/${data.slug}`);
      }

      return { success: true };
    } catch (error: unknown) {
      console.error('Save Guide Error:', error);
      return { error: 'Произошла внутренняя ошибка сервера при сохранении профиля гида' };
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
    } catch (error: unknown) {
      console.error('Delete Guide Error:', error);
      return { error: 'Произошла внутренняя ошибка сервера при удалении гида' };
    }
  })
);

// ==========================================
// 3. БЛОГ (ЗАЩИЩЕНО АУДИТОМ)
// ==========================================

export const savePostAction = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_POST',
    getTargetId: (data: SavePostPayload) => data.id || data.slug,
  })(async (data: SavePostPayload) => {
    try {
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
      if (!id && formattedData.isActive) {
        publishPostToChannel({
          title:   formattedData.title,
          excerpt: formattedData.excerpt,
          slug:    slug!,
          image:   formattedData.image,
        }).catch(console.error);
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error as { message?: string, code?: string };
      if (err.code === 'P2002') return { error: 'URL (slug) должен быть уникальным' };
      console.error('Save Post Error:', error);
      return { error: 'Произошла внутренняя ошибка сервера при сохранении поста' };
    }
  })
);

export const togglePostStatusAction = withAdminAuth(
  withAdminAudit({
    actionName: 'TOGGLE_POST_STATUS',
    getTargetId: (id: string, _field: 'isActive' | 'is_trending', _value: boolean) => id,
  })(async (id: string, field: 'isActive' | 'is_trending', value: boolean) => {
    try {
      const existing = field === 'isActive'
        ? await prisma.blog.findUnique({
            where: { id },
            select: { isActive: true },
          })
        : null;

      const post = await prisma.blog.update({
        where: { id },
        data: { [field]: value },
        select: {
          title: true,
          excerpt: true,
          slug: true,
          image: true,
          isActive: true,
        },
      });

      const isFirstPublish = field === 'isActive' && !existing?.isActive && value;

      if (isFirstPublish) {
        publishPostToChannel({
          title:   post.title,
          excerpt: post.excerpt,
          slug:    post.slug,
          image:   post.image,
        }).catch(console.error);
      }

      revalidatePath('/admin');
      revalidatePath('/blog');
      revalidatePath('/');
      return { success: true };
    } catch (error: unknown) {
      console.error('Toggle Post Status Error:', error);
      return { success: false, error: 'Произошла внутренняя ошибка сервера при обновлении статуса' };
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
    } catch (error: unknown) {
      console.error('Delete Post Error:', error);
      return { error: 'Произошла внутренняя ошибка сервера при удалении поста' };
    }
  })
);

// ==========================================
// 4. ТУРЫ (ЗАЩИЩЕНО АУДИТОМ)
// ==========================================

export const deleteTourAction = withAdminAuth(
  withAdminAudit({
    actionName: 'DELETE_TOUR',
    getTargetId: (id: string) => id,
  })(async (id: string) => {
    try {
      const tour = await prisma.tour.findUnique({ where: { id }, select: { slug: true } });
      
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
      console.error('Delete Tour Action Error:', error);
      return { error: 'Произошла внутренняя ошибка сервера при удалении тура' };
    }
  })
);

// ==========================================
// 5. КОНТЕНТ-БЛОКИ (ЗАЩИЩЕНО АУДИТОМ)
// ==========================================

export const saveContentBlockAction = withAdminAuth(
  withAdminAudit({
    actionName: 'SAVE_CONTENT_BLOCK',
    getTargetId: (slug: string, _content: Prisma.InputJsonValue) => slug,
  })(async (slug: string, content: Prisma.InputJsonValue) => {
    try {
      await prisma.contentBlock.upsert({
        where: { slug },
        update: { content },
        create: { slug, content }
      });

      revalidatePath('/', 'layout');
      return { success: true };
    } catch (error: unknown) {
      console.error('Content Save Error:', error);
      return { error: 'Произошла внутренняя ошибка сервера при сохранении блока' };
    }
  })
);

// ==========================================
// 6. ОБНОВЛЕНИЕ КОММЕНТАРИЕВ В CRM (ЗАЩИЩЕНО АУДИТОМ)
// ==========================================
export const updateBookingCommentAction = withAdminAuth(
  withAdminAudit({
    actionName: 'UPDATE_BOOKING_COMMENT',
    getTargetId: (id: string, _comment: string) => id,
  })(async (id: string, comment: string) => {
    try {
      await prisma.booking.update({ 
        where: { id }, 
        data: { comment } 
      });
      revalidatePath('/admin');
      return { success: true };
    } catch (error) {
      console.error('Update Comment Error:', error);
      return { success: false, error: 'Ошибка сохранения комментария' };
    }
  })
);

// ==========================================
// 7. ПОЛУЧЕНИЕ MANIFEST ДЛЯ ГРУПП (ЧТЕНИЕ - БЕЗ АУДИТА)
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

// Оригинальная функция с обработкой ошибок
export const getGroupsManifest = withAdminAuth(async (params: GetGroupsManifestParams): Promise<GetGroupsManifestResult> => {
  try {
    const { page, limit = 20, search, sortBy = 'date_asc' } = params;
    const skip = (page - 1) * limit;

    const activeStatuses: BookingStatus[] = ['pending', 'confirmed'];

    const bookingWhere: Prisma.BookingWhereInput = {
      status: { in: activeStatuses },
    };

    if (search) {
      bookingWhere.tour = { title: { contains: search, mode: 'insensitive' } };
    }

    const tourDatesWithBookings = await prisma.tourDate.findMany({
      where: {
        bookings: { some: bookingWhere },
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { startDate: sortBy === 'date_asc' ? 'asc' : 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.tourDate.count({
      where: {
        bookings: { some: bookingWhere },
      },
    });

    const groups = await Promise.all(
      tourDatesWithBookings.map(async (tourDate) => {
        const bookings = await prisma.booking.findMany({
          where: {
            tourDateId: tourDate.id,
            status: { in: activeStatuses },
          },
        });

        const totalTickets = bookings.reduce((sum, b) => {
          return sum + b.ticketsAdult + b.ticketsChild + b.ticketsMember + b.ticketsFamily * 3;
        }, 0);

        // ✅ ИСПРАВЛЕНО: Оставили только одно объявление интерфейса во избежание Duplicate identifier
        interface GuestJsonData {
          isMain?: boolean;
          name?: string;
          ticketType?: string;
          age?: string | number;
          jacket?: string;
          phone?: string;
        }

        const participants = bookings.flatMap((b) => {
          // ✅ Кастуем JSON к массиву объектов (решает проблему с any и ошибками)
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
            ? guestsArray
                .filter(g => !g.isMain)
                .map(g => ({
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
          tourName: tourDate.tour.title,
          date: tourDate.startDate.toLocaleDateString('ru-RU'),
          totalTickets,
          participants,
        };
      })
    );

    return { success: true, groups, total };
  } catch (error) {
    console.error(error);
    return { success: false, error: error instanceof Error ? error.message : 'Ошибка загрузки групп' };
  }
});