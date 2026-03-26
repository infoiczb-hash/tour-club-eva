'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { env } from '@/lib/env';
import { BookingStatus } from '@prisma/client'; // ✅ Используем тип из Prisma

/**
 * Основной экшен для смены статуса брони в админке
 */
export async function updateBookingStatusAction(bookingId: string, newStatus: BookingStatus) {
  try {
    await requireAuth(); // ✅ Проверка прав админа

    // 1. Загружаем бронь со всеми связями для формирования сообщения
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: true,   // чтобы достать tgChatId клиента
        tour: true,     // ссылки на оплату и описание
        tourDate: true  // место и время сбора
      }
    });

    if (!booking) throw new Error('Бронирование не найдено');

    // 2. Обновляем статус в базе данных
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus }
    });

    // 3. Если у пользователя привязан Telegram (через вход на сайте) — шлем уведомление
    if (booking.member?.tgChatId) {
      await sendTelegramNotificationToClient(booking, newStatus);
    }

    // 4. Инвалидируем кэш, чтобы админка и кабинет обновились мгновенно
    revalidatePath('/admin');
    revalidatePath('/account/bookings');
    
    return { success: true };
  } catch (error: any) {
    console.error('Update Booking Status Error:', error);
    return { success: false, error: error.message || 'Ошибка обновления статуса' };
  }
}

/**
 * Вспомогательная функция отправки сообщения в Telegram
 */
async function sendTelegramNotificationToClient(booking: any, status: BookingStatus) {
  const token = env.TELEGRAM_AUTH_BOT; // Используем бота @authevaclub_bot
  const chatId = booking.member.tgChatId;

  let message = '';
  const inlineButtons: any[] = [];

  // ✅ Логика уведомления в зависимости от нового статуса
  switch (status) {
    case 'pending': // "В ожидании" -> отправляем реквизиты
      message = `🏕 <b>Турклуб ЭВА</b>\n\n` +
        `Ваша заявка <b>#${booking.shortId}</b> на тур «${booking.tour.title}» подтверждена!\n\n` +
        `💰 <b>К оплате:</b> ${booking.totalPrice} RUB\n\n` +
        `⚠️ <i>При оплате через мобильный платеж APB, пожалуйста, введите эту сумму вручную и укажите номер брони (#${booking.shortId}) в комментарии.</i>\n\n` +
        `Выберите удобный способ оплаты:`;

      if (booking.tour.biletpmrLink) {
        inlineButtons.push([{ text: '🎫 Оплатить через BiletPMR', url: booking.tour.biletpmrLink }]);
      }
      
      const apbLink = booking.tour.apbQrLink || `https://qrpay.apb.online/QRT489793839169332`; 
      inlineButtons.push([{ text: '📱 Мобильный платеж APB', url: apbLink }]);
      inlineButtons.push([{ text: '💬 Написать менеджеру', url: 'https://t.me/romansvtirase' }]);
      break;

    case 'confirmed': // "Оплачено" -> отправляем явки и пароли
      const meetingInfo = booking.tourDate?.meetingPoint || booking.tour.meetingPoint || 'Будет уточнено гидом';
      const meetingTime = booking.tourDate?.meetingTime || booking.tourDate?.time || '08:30';

      message = `🎉 <b>Оплата получена!</b>\n\n` +
        `Ваше место в туре «${booking.tour.title}» официально забронировано.\n\n` +
        `📍 <b>Место сбора:</b> ${meetingInfo}\n` +
        `⏰ <b>Время:</b> ${meetingTime}\n\n` +
        `🎒 <b>Важно:</b> ${booking.tour.importantInfo || 'Возьмите с собой хорошее настроение!'}`;
        
      inlineButtons.push([{ text: '👤 В личный кабинет', url: `${env.NEXT_PUBLIC_SITE_URL}/account/bookings` }]);
      break;

    case 'cancelled': // "Отменено"
      message = `🚫 <b>Бронирование #${booking.shortId} отменено.</b>\n\nЕсли у вас возникли вопросы, пожалуйста, свяжитесь с менеджером.`;
      break;
  }

  if (!message) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineButtons }
      }),
    });
  } catch (e) {
    console.error('Ошибка отправки сообщения клиенту в Telegram:', e);
  }
}