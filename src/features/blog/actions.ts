// src/features/blog/actions.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PostFormat } from '@prisma/client';

import { sendToTelegram, publishToTelegram } from '@/features/admin/actions/telegram';
import { withAdminAuth } from '@/lib/auth'; // 👈 Заменили requireAuth на HOC
import { withAdminAudit } from '@/lib/audit'; // ✅ ДОБАВИЛИ ЯДРО АУДИТА
import { env } from '@/lib/env';

// === 1. СОЗДАНИЕ ПОСТА (ЗАЩИЩЕНО + АУДИТ) ===
export const createBlogPost = withAdminAuth(
  withAdminAudit({
    actionName: 'CREATE_BLOG_POST',
    // В качестве цели лога используем название статьи из формы
    getTargetId: (formData: FormData) => (formData.get('title') as string) || undefined,
    // 🔥 Разворачиваем FormData в обычный объект, чтобы в БД записался красивый JSON
    sanitizeChanges: (formData: FormData) => {
      const obj: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    }
  })(async (formData: FormData) => {
    // Внутри больше нет await requireAuth(), так как HOC проверяет права до вызова функции!

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string || 'Разное';
    const image = formData.get('image') as string;
    const readTime = parseInt(formData.get('read_time') as string) || 5;
    
    // Получаем формат
    const formatRaw = formData.get('format') as string;
    const format = (formatRaw === 'short' || formatRaw === 'long') 
      ? formatRaw as PostFormat 
      : 'long';

    // Новые поля
    const authorName = formData.get('author_name') as string || "Team Eva";
    const authorRole = formData.get('author_role') as string || "Guide Club";
    const authorImage = formData.get('author_image') as string;

    const excerpt = formData.get('excerpt') as string;

    const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    try {
      const newPost = await prisma.blog.create({
        data: {
          title,
          slug,
          content,
          category,
          image,
          read_time: readTime,
          is_trending: formData.get('is_trending') === 'on',
          // Обработка нового поля isActive (если оно придет из формы, иначе false по дефолту)
          isActive: formData.get('is_active') === 'on', 
          excerpt: excerpt || "Интересная история из мира гор",
          format: format,
          
          author_name: authorName,
          author_role: authorRole,
          author_image: authorImage,
        },
      });

      revalidatePath('/blog');
      revalidatePath('/');
      revalidatePath(`/blog/${slug}`);
      
      if (image) {
        publishToTelegram(
          `📝 <b>${title}</b>\n\n${excerpt}`,
          image,
          `${env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
          true  // → публичный канал
        ).catch(console.error); // не блокируем redirect
      }
    } catch (error) {
      console.error("Ошибка при создании поста:", error);
      return { success: false, error: 'Не удалось создать пост' };
    }

    redirect('/admin');
  })
);

// === 2. НОВАЯ ФУНКЦИЯ: ОТПРАВКА ПРЕДЛОЖЕНИЯ В TELEGRAM (ПУБЛИЧНО) ===
// Эту функцию не оборачиваем, так как ее вызывает обычный гость сайта (Lead)
export async function sendProposalAction(data: { name: string, contact: string, type: string, message: string }) {
  const { name, contact, type, message } = data;

  const text = `
🔥 <b>Новое предложение сотрудничества!</b>

👤 <b>Имя:</b> ${name}
📞 <b>Контакты:</b> ${contact}
💡 <b>Тип:</b> ${type}

📝 <b>Описание идеи:</b>
${message}
  `;

  try {
    const result = await sendToTelegram(text);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Ошибка отправки в Telegram:', error);
    return { success: false, error: 'Не удалось отправить сообщение.' };
  }
}