'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { env } from '@/lib/env';
import { BookingStatus } from '@prisma/client';
// ✅ Импортируем нашу новую универсальную функцию
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';

/**
 * Основной экшен для смены статуса брони в админке
 */
export async function updateBookingStatusAction(bookingId: string, newStatus: BookingStatus) {
  try {
    await requireAuth();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: true,
        tour: true,
        tourDate: true
      }
    });

    if (!booking) throw new Error('Бронирование не найдено');

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus }
    });

    // Если у пользователя привязан Telegram — шлем уведомление
    if (booking.member?.tgChatId) {
      await formatAndSendClientMessage(booking, newStatus);
    }

    revalidatePath('/admin');
    revalidatePath('/account/bookings');
    
    return { success: true };
  } catch (error: any) {
    console.error('Update Booking Status Error:', error);
    return { success: false, error: error.message || 'Ошибка обновления статуса' };
  }
}

/**
 * Вспомогательная функция, которая только собирает текст и кнопки, 
 * а саму отправку делегирует в telegram.ts
 */
async function formatAndSendClientMessage(booking: any, status: BookingStatus) {
  const chatId = booking.member.tgChatId;
  let message = '';
  const inlineButtons: Array<Array<{ text: string; url: string }>> = [];

  switch (status) {
   case 'pending': 
      message = `🏕 <b>Турклуб ЭВА</b>\n\n` +
        `Ваша заявка <b>#${booking.shortId}</b> на тур «${booking.tour.title}» подтверждена!\n\n` +
        `💰 <b>К оплате:</b> ${booking.totalPrice} ${booking.tour.currency || 'RUB'}\n\n` + // 👈 ВАЖНО: здесь в конце должен быть плюс!
        `⚠️ <i>При оплате через мобильный платеж APB, пожалуйста, введите эту сумму вручную и укажите номер брони (#${booking.shortId}) в комментарии.</i>\n\n` +
        `Выберите удобный способ оплаты:`;

      if (booking.tour.biletpmrLink) {
        inlineButtons.push([{ text: '🎫 Оплатить через BiletPMR', url: booking.tour.biletpmrLink }]);
      }
      
      const apbLink = booking.tour.apbQrLink || `https://qrpay.apb.online/QRT489793839169332`; 
      inlineButtons.push([{ text: '📱 Мобильный платеж APB', url: apbLink }]);
      inlineButtons.push([{ text: '💬 Написать менеджеру', url: 'https://t.me/romansvtirase' }]);
      break;

    case 'confirmed': 
      const meetingInfo = booking.tourDate?.meetingPoint || booking.tour.meetingPoint || 'Будет уточнено гидом';
      const meetingTime = booking.tourDate?.meetingTime || booking.tourDate?.time || '08:30';

      message = `🎉 <b>Оплата получена!</b>\n\n` +
        `Ваше место в туре «${booking.tour.title}» официально забронировано.\n\n` +
        `📍 <b>Место сбора:</b> ${meetingInfo}\n` +
        `⏰ <b>Время:</b> ${meetingTime}\n\n` +
        `🎒 <b>Важно:</b> ${booking.tour.importantInfo || 'Возьмите с собой хорошее настроение!'}`;
        
      inlineButtons.push([{ text: '👤 В личный кабинет', url: `${env.NEXT_PUBLIC_SITE_URL}/account/bookings` }]);
      break;

    case 'cancelled': 
      message = `🚫 <b>Бронирование #${booking.shortId} отменено.</b>\n\nЕсли у вас возникли вопросы, пожалуйста, свяжитесь с менеджером.`;
      break;
  }

  if (!message) return;

  // ✅ Вызываем единый сервис отправки (последний аргумент true = использовать @authevaclub_bot)
  await sendToUserTelegramAdvanced(chatId, message, inlineButtons, true);
}