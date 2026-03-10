// src/features/admin/actions/requests.ts
"use server";

import { prisma } from '@/lib/prisma';
import { sendToTelegram } from '@/features/admin/actions/telegram';

// Обработка заявки "В команду"
export async function sendJoinTeamAction(data: any) {
  try {
    const name = (data.name as string) || 'Без имени';
    const phone = (data.phone as string) || '';
    const social = (data.social as string) || '';
    const role = (data.role as string) || 'Не указана';
    const experience = (data.experience as string) || 'Не указан';
    const motivation = (data.motivation as string) || 'Не указана';

    // 1. Сохраняем в базу данных
    await prisma.inquiry.create({
      data: {
        type: 'HR',
        status: 'NEW',
        name: name,
        phone: phone || null,
        social: social || null,
        message: `Опыт: ${experience}\nМотивация: ${motivation}`,
        payload: {
          role: role,
          experience: experience,
          motivation: motivation
        }
      }
    });

    // 2. Отправляем уведомление в Telegram
    const contactStr = [
      phone ? `📱 ${phone}` : null,
      social ? `✈️ ${social}` : null
    ].filter(Boolean).join('\n');

    const tgMessage = `<b>#Команда от ${name}</b>\n${contactStr}\n\n🎯 <b>Роль:</b> ${role}\n📝 <b>Опыт:</b> ${experience}\n💡 <b>Мотивация:</b> ${motivation}`;
    
    await sendToTelegram(tgMessage);

    return { success: true };
  } catch (error) {
    console.error("Ошибка обработки заявки в команду:", error);
    return { success: false, error: "Не удалось отправить заявку" };
  }
}