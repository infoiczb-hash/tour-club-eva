// src/features/admin/actions/requests.ts
"use server";

import { prisma } from '@/lib/prisma';
import { sendToTelegram } from '@/features/admin/actions/telegram';
import { InquirySchema } from '@/features/inquiries/schema';
import { withRateLimit } from '@/lib/rate-limit-server'; // 👈 ИМПОРТ ЛИМИТЕРА

// Оборачиваем в лимит (например, 8 запросов в минуту)
type ActionResult = 
  | { success: true }
  | { success: false; error: string; fields?: Record<string, string> }

export const sendJoinTeamAction = withRateLimit(async (data: unknown): Promise<ActionResult> => {
  const parsed = InquirySchema.safeParse({ ...data as object, type: 'HR' });

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach(e => {
      const key = e.path[0]?.toString() ?? 'unknown';
      fields[key] = e.message;
    });
    return { success: false, error: 'Ошибка валидации', fields };
  }

  const d = parsed.data;
  if (d.type !== 'HR') return { success: false, error: 'Неверный тип заявки' };

  try {
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
});