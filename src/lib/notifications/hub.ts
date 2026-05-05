import { prisma } from '@/lib/prisma';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';
import { AppEvent, AppEventPayloadMap, NotificationTemplates } from './templates';
import { sendFallbackEmail } from './adapters/email'; 

/**
 *   ТИПИЗИРОВАННЫЙ PAYLOAD: 
 * Теперь 'data' будет иметь разный тип в зависимости от 'eventId'.
 */
export interface DispatchPayload<E extends AppEvent = AppEvent> {
  eventId: E;
  memberId: string;
  data: AppEventPayloadMap[E]; // Больше никакого any!
}

export class NotificationHub {
  /**
   * Метод отправки уведомления с жесткой проверкой типов.
   */
  static async dispatch<E extends AppEvent>({ eventId, memberId, data }: DispatchPayload<E>) {
    try {
      const profile = await prisma.memberProfile.findUnique({
        where: { id: memberId },
        include: { pushSubscriptions: true }
      });

      if (!profile) throw new Error('Profile not found');

      // TypeScript теперь знает точную форму 'data' для этого 'eventId'
      const content = await NotificationTemplates.compile(eventId, data, profile);

      if (!content) {
        console.error(`[NotificationHub] Контент не сгенерирован для события ${eventId}`);
        return { success: false, error: 'Template content is null' };
      }

      // 1. Внутреннее уведомление (In-App)
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

      // 3. Email (Fallback)
      if (content.email && (!deliveredFast || content.email.forceSend)) {
        if (profile.email) {
          await sendFallbackEmail(profile.email, content.email.subject, content.email.html);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[NotificationHub] Dispatch Error:', error);
      return { success: false, error };
    }
  }
}