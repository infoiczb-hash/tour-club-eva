// src/features/admin/actions/requests.ts
"use server";

import { prisma } from '@/lib/prisma';
import { sendToTelegram } from '@/features/admin/actions/telegram';
import { InquirySchema } from '@/features/inquiries/schema';

// Обработка заявки "В команду"
export async function sendJoinTeamAction(data: unknown) {
  // 🛡️ Валидация через Zod — отсекает мусор и невалидные данные до записи в БД
  const parsed = InquirySchema.safeParse({ ...data as object, type: 'HR' });

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach(e => {
      const key = e.path[0]?.toString() ?? 'unknown';
      fields[key] = e.message;
    });
    return { success: false, error: 'Ошибка валидации', fields };
  }

  // После валидации data типизирована строго
  const d = parsed.data;
  if (d.type !== 'HR') return { success: false, error: 'Неверный тип заявки' };

  try {
    // 1. Сохраняем в базу данных
    await prisma.inquiry.create({
      data: {
        type: 'HR',
        status: 'NEW',
        name: d.name,
        phone: d.phone ?? null,
        social: d.social ?? null,
        message: `Опыт: ${d.experience}\nМотивация: ${d.motivation}`,
        payload: {
          role: d.role,
          experience: d.experience,
          motivation: d.motivation,
        },
      },
    });

    // 2. Отправляем уведомление в Telegram
    const contactStr = [
      d.phone ? `📱 ${d.phone}` : null,
      d.social ? `✈️ ${d.social}` : null,
    ].filter(Boolean).join('\n');

    const tgMessage = `<b>#Команда от ${d.name}</b>\n${contactStr}\n\n🎯 <b>Роль:</b> ${d.role}\n📝 <b>Опыт:</b> ${d.experience}\n💡 <b>Мотивация:</b> ${d.motivation}`;

    await sendToTelegram(tgMessage);

    return { success: true };
  } catch (error) {
    console.error("Ошибка обработки заявки в команду:", error);
    return { success: false, error: "Не удалось отправить заявку" };
  }
}