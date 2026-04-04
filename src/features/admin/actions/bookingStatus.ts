'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { env } from '@/lib/env';
import { BookingStatus } from '@prisma/client';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';
import { withAdminAuth } from '@/lib/auth'; // ✅ Импортируем нашу новую броню из auth.ts

/**
 * Основной экшен для смены статуса брони в админке
 * 🔥 ТЕПЕРЬ ЗАЩИЩЕН: Только для админов (BAC закрыт)!
 */
export const updateBookingStatusAction = withAdminAuth(
  async (bookingId: string, newStatus: BookingStatus) => {
    try {
      // Оборачиваем в транзакцию и управляем инвентаризацией мест
      const booking = await prisma.$transaction(async (tx) => {
        const current = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { member: true, tour: true, tourDate: true }
        });

        if (!current) throw new Error('Бронирование не найдено');

        // Считаем все типы билетов (включая семейный = 3 места)
        const totalTickets = (current.ticketsAdult || 0) + 
                             (current.ticketsChild || 0) + 
                             (current.ticketsMember || 0) + 
                             ((current.ticketsFamily || 0) * 3);

        // 1. ОТМЕНА: Если статус меняется на cancelled -> Возвращаем места (increment)
        if (newStatus === 'cancelled' && current.status !== 'cancelled') {
          if (current.tourDateId) {
            await tx.tourDate.update({ where: { id: current.tourDateId }, data: { spotsLeft: { increment: totalTickets } } });
          } else {
            await tx.tour.update({ where: { id: current.tourId }, data: { spotsLeft: { increment: totalTickets } } });
          }
        } 
        // 2. ВОССТАНОВЛЕНИЕ: Если восстанавливаем из cancelled -> Забираем места (decrement)
        else if (current.status === 'cancelled' && newStatus !== 'cancelled') {
          if (current.tourDateId) {
            await tx.tourDate.update({ where: { id: current.tourDateId }, data: { spotsLeft: { decrement: totalTickets } } });
          } else {
            await tx.tour.update({ where: { id: current.tourId }, data: { spotsLeft: { decrement: totalTickets } } });
          }
        }

        // Обновляем сам статус
        return await tx.booking.update({
          where: { id: bookingId },
          data: { status: newStatus },
          include: { member: true, tour: true, tourDate: true }
        });
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
);

/**
 * Формирование и отправка красивого сообщения клиенту
 */
async function formatAndSendClientMessage(booking: any, status: BookingStatus) {
  const chatId = booking.member.tgChatId;
  let message = '';
  const inlineButtons: Array<Array<{ text: string; url: string }>> = [];
  const accountLink = `${env.NEXT_PUBLIC_SITE_URL}/account/bookings`;

  switch (status) {
   case 'pending': 
      message = `🏕 <b>Турклуб ЭВА</b>\n\n` +
        `Ваша заявка <b>#${booking.shortId || booking.id.substring(0,4)}</b> на тур «${booking.tour.title}» принята!\n\n` +
        `💰 <b>К оплате:</b> ${booking.totalPrice} ${booking.tour.currency || 'MDL'}\n\n` +
        `⚠️ <i>При оплате через мобильный платеж APB, пожалуйста, введите эту сумму вручную и укажите номер брони (#${booking.shortId || booking.id.substring(0,4)}) в комментарии.</i>\n\n` +
        `Выберите удобный способ оплаты:`;

      if (booking.tour.biletpmrLink) {
        inlineButtons.push([{ text: '🎫 Оплатить через BiletPMR', url: booking.tour.biletpmrLink }]);
      }
      
      const apbLink = booking.tour.apbQrLink || `https://qrpay.apb.online/QRT489793839169332`; 
      inlineButtons.push([{ text: '📱 Мобильный платеж APB', url: apbLink }]);
      inlineButtons.push([{ text: '💬 Написать менеджеру', url: 'https://t.me/romansvtirase' }]);
      break;

    // ✅ ИСПРАВЛЕНИЕ 2: ДОБАВЛЕНЫ НОВЫЕ СТАТУСЫ ОПЛАТЫ
    case 'awaiting_payment':
      message = `💳 <b>Ожидается оплата</b>\n\n` +
        `Пожалуйста, оплатите ваше участие в туре «${booking.tour.title}» (Сумма: ${booking.totalPrice} ${booking.tour.currency || 'MDL'}).\n` +
        `Сделать это можно в личном кабинете.`;
      inlineButtons.push([{ text: '💳 К оплате', url: accountLink }]);
      break;

    case 'moderation':
      message = `🔍 <b>Чек на проверке</b>\n\n` +
        `Мы получили ваш скриншот об оплате тура «${booking.tour.title}». Менеджер проверит его в ближайшее время.`;
      inlineButtons.push([{ text: '👤 В личный кабинет', url: accountLink }]);
      break;

    case 'rejected':
      message = `❌ <b>Ошибка оплаты</b>\n\n` +
        `К сожалению, мы отклонили ваш чек для тура «${booking.tour.title}».\n\n` +
        `Пожалуйста, проверьте данные, свяжитесь с менеджером или загрузите новый чек в личном кабинете.`;
      inlineButtons.push([
        { text: '💬 Написать менеджеру', url: 'https://t.me/romansvtirase' },
        { text: '🔄 Повторить оплату', url: accountLink }
      ]);
      break;

    case 'confirmed': 
      const meetingInfo = booking.tourDate?.meetingPoint || booking.tour.meetingPoint || 'Будет уточнено гидом';
      const meetingTime = booking.tourDate?.meetingTime || booking.tourDate?.time || '08:30';

      message = `🎉 <b>Оплата получена!</b>\n\n` +
        `Ваше место в туре «${booking.tour.title}» официально забронировано.\n\n` +
        `📍 <b>Место сбора:</b> ${meetingInfo}\n` +
        `⏰ <b>Время:</b> ${meetingTime}\n\n` +
        `🎒 <b>Важно:</b> ${booking.tour.importantInfo || 'Возьмите с собой хорошее настроение!'}`;
        
      inlineButtons.push([{ text: '👤 В личный кабинет', url: accountLink }]);
      break;

    case 'cancelled': 
      message = `🚫 <b>Бронирование #${booking.shortId || booking.id.substring(0,4)} отменено.</b>\n\nЕсли у вас возникли вопросы, пожалуйста, свяжитесь с менеджером.`;
      inlineButtons.push([{ text: '💬 Написать менеджеру', url: 'https://t.me/romansvtirase' }]);
      break;
  }

  if (!message) return;

  // Вызываем единый сервис отправки (последний аргумент true = использовать @authevaclub_bot)
  await sendToUserTelegramAdvanced(chatId, message, inlineButtons, true);
}