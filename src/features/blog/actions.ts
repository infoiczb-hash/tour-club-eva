'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PostFormat } from '@prisma/client'
// 👇 Импорт нашей утилиты для Телеграма
import { sendToTelegram } from '@/features/admin/actions/telegram';

// === 1. СОЗДАНИЕ ПОСТА (ТВОЙ ОРИГИНАЛЬНЫЙ КОД) ===
export async function createBlogPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string || 'Разное'
  const image = formData.get('image') as string
  const readTime = parseInt(formData.get('read_time') as string) || 5
  
  // Получаем формат
  const formatRaw = formData.get('format') as string
  const format = (formatRaw === 'short' || formatRaw === 'long') 
    ? formatRaw as PostFormat 
    : 'long'

  // Новые поля
  const authorName = formData.get('author_name') as string || 'Команда EVA'
  const authorRole = formData.get('author_role') as string || 'Гид клуба'
  const authorImage = formData.get('author_image') as string || ''

  // Генерация Excerpt
  let excerpt = formData.get('excerpt') as string
  if (!excerpt && content) {
     const plainText = content.replace(/<[^>]+>/g, '')
     excerpt = plainText.slice(0, 150) + '...'
  }

  // Генерация slug
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\u0400-\u04FF\s-]/gi, '')
    .replace(/\s+/g, '-') 
    + '-' + Date.now().toString().slice(-4)

  try {
    await prisma.blog.create({
      data: {
        title,
        content,
        slug,
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
    })

    revalidatePath('/blog')
    revalidatePath('/') 
  } catch (error) {
    console.error("Ошибка при создании поста:", error)
  }

  redirect('/admin')
}

// === 2. НОВАЯ ФУНКЦИЯ: ОТПРАВКА ПРЕДЛОЖЕНИЯ В TELEGRAM ===
export async function sendProposalAction(data: { name: string, contact: string, type: string, message: string }) {
  const { name, contact, type, message } = data;

  const text = `
📬 <b>Новое предложение в Блог!</b>

👤 <b>Автор:</b> ${name}
📞 <b>Связь:</b> ${contact}
💡 <b>Тип:</b> ${type === 'post' ? 'Готовая статья' : 'Идея / Тема'}

📝 <b>Суть:</b>
<i>${message}</i>
  `;

  // Отправляем в Telegram (используем твой готовый хелпер)
  return await sendToTelegram(text);
}