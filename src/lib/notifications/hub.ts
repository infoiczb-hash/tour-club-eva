// src/lib/notifications/hub.ts
import { prisma } from '@/lib/prisma';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';
import { AppEvent, NotificationTemplates } from './templates';
import { sendFallbackEmail } from './adapters/email'; 

export interface DispatchPayload {
  eventId: AppEvent;
  memberId: string;
  data: any;
}

export class NotificationHub {
  static async dispatch({ eventId, memberId, data }: DispatchPayload) {
    try {
      const profile = await prisma.memberProfile.findUnique({
        where: { id: memberId },
        include: { pushSubscriptions: true }
      });

      if (!profile) throw new Error('Profile not found');

      // Генерируем контент по шаблону
const content = await NotificationTemplates.compile(eventId, data, profile);

      // 🔥 ВОТ ТА САМАЯ ЗАЩИТА ОТ NULL
      if (!content) {
        console.error(`[NotificationHub] Контент не сгенерирован для события ${eventId}`);
        return { success: false, error: 'Template content is null' };
      }

      // 1. In-App (База)
      // Теперь TypeScript спокоен, так как мы проверили, что content точно существует
      await prisma.notification.create({
        data: {
          memberId,
          type: content.inApp.type,
          title: content.inApp.title,
          message: content.inApp.message,
          link: content.inApp.link,
          isRead: false
        }
      });

      let deliveredFast = false;

      // 2. Telegram
      if (profile.tgChatId) {
        const tgRes = await sendToUserTelegramAdvanced(
          profile.tgChatId, 
          content.telegram.text, 
          content.telegram.buttons, 
          true
        );
        if (tgRes.success) deliveredFast = true;
      }

      // 3. Фолбэк на Email
      if (content.email && (!deliveredFast || content.email.forceSend)) {
        if (profile.email) {
          await sendFallbackEmail(profile.email, content.email.subject, content.email.html);
        } else {
          console.warn(`[NotificationHub] Нет Email для отправки фолбэка юзеру ${memberId}`);
        }
      }

      return { success: true };

    } catch (error) {
      console.error('[NotificationHub] Dispatch Error:', error);
      return { success: false, error };
    }
  }
}