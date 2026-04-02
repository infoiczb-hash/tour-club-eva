'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookingStatus, Prisma } from '@prisma/client';
import { sendToUserTelegram, publishPostToChannel } from '@/features/admin/actions/telegram';

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

    const rawData = await prisma.booking.findMany({
      include: {
        tour: { select: { title: true, dates: true } },
        tourDate: { select: { startDate: true } } 
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = rawData.map((item) => {
      const legacyDates = (item.tour?.dates as TourDatesJson[]) || [];
      const firstLegacyDate = legacyDates[0]?.start ? new Date(legacyDates[0].start) : null;
      const actualDate = item.tourDate?.startDate || item.bookedDate || firstLegacyDate;

     return {
        id: item.id,
        user_name: item.name,
        user_phone: item.phone,
        status: item.status || 'pending',
        created_at: item.createdAt,
        
        tickets_adult: item.ticketsAdult,
        tickets_child: item.ticketsChild,
        tickets_family: item.ticketsFamily,
        tickets_member: item.ticketsMember,
        
        short_id: item.shortId ?? undefined, 
        
        // ✅ ТЕПЕРЬ ФРОНТЕНД ПОЛУЧИТ ЭТИ ДАННЫЕ:
        guests: item.guests || [],
        payment_method: item.paymentMethod || 'cash', 
        discount: item.discount || 0,
        amount_paid: item.amountPaid,
        source: item.source,
        total_price: item.totalPrice,
        
        tourId: item.tourId,
        tourDateId: item.tourDateId || undefined,
        comment: item.comment || '',
        social: item.social || item.email || '',

        // ✅ НОВЫЕ ПОЛЯ ДЛЯ ЧЕКОВ (ЭТАП 2)
        payment_proof_url: item.paymentProofUrl || null,
        receipt_url: item.receiptUrl || null,
        confirmed_by: item.confirmedBy || null,
        confirmed_at: item.confirmedAt || null,

        tour: item.tour
          ? { title: item.tour.title, date: actualDate }
          : undefined,
      };
    });

    return { data };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { error: 'Unauthorized', data: [] };
    console.error('Get Registrations Error:', error);
    return { error: 'Произошла внутренняя ошибка сервера при загрузке бронирований', data: [] };
  }
}

export async function updateRegistrationStatus(id: string, status: string) {
  try {
    await requireAuth(); 

    const booking = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id },
        select: { status: true, tourId: true, tourDateId: true, ticketsAdult: true, ticketsChild: true, ticketsMember: true, ticketsFamily: true }
      });

      if (!current) throw new Error('Booking not found');

      const totalTickets = current.ticketsAdult + current.ticketsChild + current.ticketsMember + (current.ticketsFamily * 3);

      // 1. ОТМЕНА: Если статус меняется на cancelled -> Возвращаем места в продажу (increment)
      if (status === 'cancelled' && current.status !== 'cancelled') {
        if (current.tourDateId) {
          await tx.tourDate.update({
            where: { id: current.tourDateId },
            data: { spotsLeft: { increment: totalTickets } }
          });
        } else {
          await tx.tour.update({
            where: { id: current.tourId },
            data: { spotsLeft: { increment: totalTickets } }
          });
        }
      } 
      // 2. ВОССТАНОВЛЕНИЕ: Если восстанавливаем из cancelled -> Забираем места обратно (decrement)
      else if (current.status === 'cancelled' && status !== 'cancelled') {
        if (current.tourDateId) {
          await tx.tourDate.update({
            where: { id: current.tourDateId },
            data: { spotsLeft: { decrement: totalTickets } }
          });
        } else {
          await tx.tour.update({
            where: { id: current.tourId },
            data: { spotsLeft: { decrement: totalTickets } }
          });
        }
      }

      return await tx.booking.update({
        where: { id },
        data: { status: status as BookingStatus },
        include: { 
          tour: { select: { title: true, slug: true } },
          member: { select: { tgChatId: true } }
        }
      });
    });

    // 🔥 ТРИГГЕР: Отправляем пуш юзеру, если статус стал "confirmed" (Оплачено)
   if ((booking.member as any)?.tgChatId) {
        const chatId = (booking.member as any).tgChatId;
        const link = `${process.env.NEXT_PUBLIC_SITE_URL}/account/bookings/${booking.id}`;
        let msg = '';

        switch (status) {
            case 'confirmed':
                msg = `✅ <b>Оплата получена!</b>\n\nВаше участие в туре <b>${booking.tour.title}</b> успешно подтверждено.`;
                break;
            case 'moderation':
                msg = `⏳ <b>Чек на проверке</b>\n\nМы получили ваш скриншот об оплате тура <b>${booking.tour.title}</b>. Менеджер проверит его в ближайшее время.`;
                break;
            case 'rejected':
                msg = `❌ <b>Ошибка оплаты</b>\n\nК сожалению, мы не смогли подтвердить вашу оплату для тура <b>${booking.tour.title}</b>. Пожалуйста, проверьте чек и загрузите его заново.`;
                break;
            case 'cancelled':
                msg = `🗑 <b>Бронь отменена</b>\n\nВаша заявка на тур <b>${booking.tour.title}</b> была отменена менеджером.`;
                break;
        }

        if (msg) {
            await sendToUserTelegram(chatId, msg, link);
        }
    }

    revalidatePath('/admin');
    revalidatePath('/account'); // Сброс кэша ЛК, чтобы статус обновился у клиента
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    console.error('[Action] Update Status Error:', error);
    return { success: false, error: 'Произошла внутренняя ошибка сервера при обновлении статуса' };
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

    // Читаем текущий статус ДО обновления — только для поля isActive
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

    // Публикуем в канал только при первом переходе в isActive=true
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

// ==========================================
// 6. ОБНОВЛЕНИЕ КОММЕНТАРИЕВ В CRM
// ==========================================
export async function updateBookingCommentAction(id: string, comment: string) {
  try {
    await requireAuth(); 
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
}