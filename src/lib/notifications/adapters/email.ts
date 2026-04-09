// src/lib/notifications/adapters/email.ts
import { Resend } from 'resend';
import { env } from '@/lib/env';

// Инициализируем клиента Resend (ключ берется из env.ts)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendFallbackEmail(to: string, subject: string, htmlContent: string) {
  if (!resend) {
    console.warn('[Email Adapter] RESEND_API_KEY не задан. Письмо пропущено.');
    return { success: false, error: 'No API Key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Турклуб EVA <info@evatur.club>', // Твой верифицированный домен
      to,
      subject,
      html: htmlContent, // Пока используем простой HTML, позже натянем React Email
    });

    if (error) throw error;
    
    console.log(`[Email Adapter] Письмо успешно отправлено на ${to}`);
    return { success: true, id: data?.id };

  } catch (error) {
    console.error(`[Email Adapter] Ошибка отправки на ${to}:`, error);
    return { success: false, error };
  }
}