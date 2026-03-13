'use server';

import { prisma } from '@/lib/prisma';
import { InquirySchema, InquiryInput } from './schema';
import { sendToTelegram } from '@/features/admin/actions/telegram';

// ✅ ДОБАВЛЕНА: Функция экранирования опасных символов
function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function submitInquiry(data: InquiryInput) {
  try {
    // 1. Проверка Honeypot (Защита от ботов)
    if (data.honeypot) {
      return { success: true };
    }

    // 2. Валидация Zod
    const result = InquirySchema.safeParse(data);
    if (!result.success) {
      return { success: false, error: "Ошибка данных", details: result.error.flatten() };
    }
    
    const validData = result.data;

    // 3. Подготовка Payload (специфичные поля в JSON)
    let payload: any = {};
    let messageText = "";

    switch (validData.type) {
      case 'TOUR':
        payload = { tour: validData.tourTitle };
        messageText = validData.message;
        break;
      case 'HR':
        payload = { 
          role: validData.role, 
          experience: validData.experience,
          motivation: validData.motivation 
        };
        messageText = `Опыт: ${validData.experience}\nМотивация: ${validData.motivation}`;
        break;
      case 'BLOG':
        payload = { format: validData.format };
        messageText = validData.message;
        break;
      case 'B2B':
        payload = { company: validData.company };
        messageText = validData.message;
        break;
      case 'REVIEW':
        payload = { rating: validData.rating };
        messageText = validData.message;
        break;
      case 'HELP':
        messageText = validData.message;
        break;
    }

    // 4. Сохранение в БД
    await prisma.inquiry.create({
      data: {
        type: validData.type,
        name: validData.name,
        phone: validData.phone || null,
        social: validData.social || null,
        message: messageText, 
        payload: payload,
      }
    });

    // 5. Отправка в Telegram
    const hashtags = {
      TOUR: '#Вопрос',
      HR: '#Команда',
      BLOG: '#Контент',
      B2B: '#Сотрудничество',
      REVIEW: '#Отзыв',
      HELP: '#Помощь'
    };

    const contactStr = [
      validData.phone ? `📱 ${escapeHtml(validData.phone)}` : null,
      validData.social ? `✈️ ${escapeHtml(validData.social)}` : null
    ].filter(Boolean).join('\n');

    // ✅ ИСПРАВЛЕНИЕ: Экранируем весь пользовательский ввод
    let tgMessage = `<b>${hashtags[validData.type]} от ${escapeHtml(validData.name)}</b>\n\n${contactStr}\n\n`;

    if (validData.type === 'HR') {
      tgMessage += `🎯 <b>Роль:</b> ${escapeHtml(validData.role)}\n📝 <b>Опыт:</b> ${escapeHtml(validData.experience)}\n💡 <b>Мотивация:</b> ${escapeHtml(validData.motivation)}`;
    } else if (validData.type === 'TOUR' && validData.tourTitle) {
      tgMessage += `🏔 <b>Тур:</b> ${escapeHtml(validData.tourTitle)}\n❓ ${escapeHtml(validData.message)}`;
    } else if (validData.type === 'REVIEW') {
      tgMessage += `⭐️ <b>Оценка:</b> ${validData.rating}/5\n💬 ${escapeHtml(validData.message)}`;
    } else {
      tgMessage += `💬 ${escapeHtml(validData.message)}`;
    }
    
    if (validData.type === 'B2B' && validData.company) {
       tgMessage += `\n🏢 Компания: ${escapeHtml(validData.company)}`;
    }

    // ✅ ИСПРАВЛЕНИЕ: Проверяем ответ от Telegram и пишем в консоль, если ошибка
    const tgResult = await sendToTelegram(tgMessage);
    if (!tgResult.success) {
        console.error("Ошибка при отправке в Telegram:", tgResult.error);
        // Не возвращаем false пользователю, так как в БД заявка сохранена успешно, 
        // но админ теперь увидит ошибку в логах Vercel
    }

    return { success: true };

  } catch (error) {
    console.error("Inquiry Error:", error);
    return { success: false, error: "Ошибка сервиса" };
  }
}