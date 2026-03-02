'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

// ==========================================
// 1. БРОНИРОВАНИЯ (CRM)
// ==========================================

export async function getRegistrationsAction() {
  try {
    const rawData = await prisma.booking.findMany({
      include: {
        tour: { select: { title: true, dates: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = rawData.map((item) => {
        // Достаем первую дату из JSON массива dates (если нет bookedDate)
        const dates = (item.tour?.dates as any[]) || [];
        const firstDate = dates[0]?.start ? new Date(dates[0].start) : null;

        // Разбираем JSON билетов, чтобы достать все детали
        const tickets = (item.tickets as any) || {};

        return {
          id: item.id,
          user_name: item.name,
          user_phone: item.phone,
          status: item.status || 'pending',
          created_at: item.createdAt,
          
          // Экономика
          tickets_adult: Number(tickets.adult || 0),
          tickets_child: Number(tickets.child || 0),
          tickets_member: Number(tickets.member || 0),
          total_price: item.totalPrice,
          
          // Доп. информация
          comment: tickets.comment || '',
          social: item.email || tickets.social || '',
          
          event_id: item.tourId,
          tour: item.tour ? { 
            title: item.tour.title, 
            date: item.bookedDate || firstDate 
          } : undefined
        };
    });

    return { data };
  } catch (error: any) {
    console.error("Get Registrations Error:", error);
    return { error: error.message };
  }
}

export async function updateRegistrationStatus(id: string, status: string) {
  try {
    await prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus } 
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { error: "Ошибка обновления статуса" };
  }
}

// ==========================================
// 2. ГИДЫ (GUIDES) — ОБНОВЛЕНО ДЛЯ "DOSSIER"
// ==========================================

export async function saveGuideAction(data: any) {
  try {
    const { id, ...rest } = data;
    
    // Формируем payload со всеми новыми полями
    const payload = {
      name: rest.name,
      role: rest.role || "Guide",
      image: rest.image || null,
      
      // Новые поля для модалки "Досье"
      actionImage: rest.actionImage || null,
      superpower: rest.superpower || null,
      experience: rest.experience || null,
      achievements: rest.achievements || [], // Prisma ждет String[]
      
      bio: rest.bio || null,
      instagram: rest.instagram || null,
      telegram: rest.telegram || null,
      contact: rest.contact || null,
      
      isActive: true
    };
    
    if (id) {
      // Обновление существующего гида
      await prisma.guide.update({
        where: { id: String(id) },
        data: payload
      });
    } else {
      // Создание нового гида
      await prisma.guide.create({
        data: payload
      });
    }

    revalidatePath('/admin');
    revalidatePath('/'); 
    return { success: true };
  } catch (error: any) {
    console.error("Save Guide Error:", error);
    return { error: error.message || "Ошибка при сохранении гида" };
  }
}

export async function deleteGuideAction(id: string | number) {
  try {
    await prisma.guide.delete({
      where: { id: String(id) }
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Delete Guide Error:", error);
    return { error: "Не удалось удалить гида" };
  }
}

// ==========================================
// 3. БЛОГ (BLOG)

export async function savePostAction(data: any) {
  try {
    const { id } = data;

    let slug = data.slug;
    if (!slug) {
       slug = data.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    }

    // Проверка уникальности
    const existingPost = await prisma.blog.findUnique({ where: { slug } });
    if (existingPost && existingPost.id !== id) {
       if (!id) slug = `${slug}-${Date.now().toString().slice(-4)}`;
       else return { error: "Такой URL (slug) уже занят! Измените его." };
    }

    const formattedData = {
      title: data.title,
      slug: slug,
      excerpt: data.excerpt || "",
      content: data.content,
      
      // ✅ ДОБАВЛЕНО: Сохранение связи с категорией и массива тегов
      categoryId: data.category_id || null, // Связь с новой таблицей BlogCategory
      tags: data.tags || [],                // Массив тегов (String[])
      
      category: data.category || "OTHER",   // Оставляем для обратной совместимости старых постов
      image: data.image || null,
      read_time: Number(data.read_time) || 5,
      is_trending: Boolean(data.is_trending),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      author_name: data.author_name || "Team Eva",
      author_role: data.author_role || "Guide Club",
      author_image: data.author_image || null,
      guideId: data.guide_id || null, 
      updatedAt: new Date()
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
    if (error.code === 'P2002') return { error: "URL (slug) должен быть уникальным" };
    return { error: error.message || "Ошибка сохранения" };
  }
}

// ✅ 2. ФУНКЦИЯ УДАЛЕНИЯ (которой не хватало!)
export async function deletePostAction(id: string) {
  try {
    await prisma.blog.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/blog');
    return { success: true };
  } catch (error) {
    return { error: "Ошибка удаления поста" };
  }
}

// ==========================================
// 4. ТУРЫ (TOURS)
// ==========================================

export async function saveTourAction(data: any) {
  try {
    // Используем динамический импорт, чтобы избежать циклических зависимостей
    // (предполагаем, что логика сохранения туров вынесена в отдельный файл)
    const { saveTour } = await import('./actions/tour'); // Проверь путь к этому файлу
    
    const result = await saveTour(data);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    return { success: true };

  } catch (error: any) {
    console.error("Save Tour Error:", error);
    // Fallback: Если отдельного файла нет, можно временно вернуть ошибку или прописать логику здесь
    return { success: false, error: error.message || "Ошибка сохранения тура" };
  }
}

export async function deleteTourAction(id: string) {
  try {
    await prisma.tour.delete({ where: { id } });
    revalidatePath('/admin');
    revalidatePath('/tours');
    return { success: true };
  } catch (error) {
    return { error: "Ошибка удаления тура" };
  }
}

// ==========================================
// 5. ДОПОЛНИТЕЛЬНЫЕ ЭКШЕНЫ
// ==========================================

// Сохранение контент-блоков
export async function saveContentBlockAction(slug: string, content: any) {
  try {
    /* // Пример с реальной базой (если есть модель ContentBlock):
    await prisma.contentBlock.upsert({
      where: { slug },
      update: { content },
      create: { slug, content }
    });
    */
    console.log(`[Mock Save] Content Block ${slug}:`, content);
    
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Content Save Error:", error);
    return { error: "Ошибка сохранения блока" };
  }
}

// Отправка заявки "В команду"
export async function sendJoinTeamAction(data: any) {
  try {
    // Логика отправки в Telegram
    console.log("Join Team Request:", data);
    
    // Имитация задержки
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  } catch (error) {
    console.error("Join Team Error:", error);
    return { success: false, error: "Ошибка отправки заявки" };
  }
  }

