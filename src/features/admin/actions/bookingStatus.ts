'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { BookingStatus } from '@prisma/client';
import { withAdminAuth } from '@/lib/auth';
import { NotificationHub } from '@/lib/notifications/hub';
import { AppEvent } from '@/lib/notifications/templates';
import { notifyWaitlistOnSpotFreed } from '@/lib/telegram/notify';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';

export const updateBookingStatusAction = withAdminAuth(
  async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const current = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { member: true, tour: true, tourDate: true }
        });

        if (!current) throw new Error('Бронирование не найдено');

        const totalTickets = (current.ticketsAdult || 0) + 
                             (current.ticketsChild || 0) + 
                             (current.ticketsMember || 0) + 
                             ((current.ticketsFamily || 0) * 3);

        if (newStatus === 'cancelled' && current.status !== 'cancelled') {
          if (current.tourDateId) {
            await tx.tourDate.update({ where: { id: current.tourDateId }, data: { spotsLeft: { increment: totalTickets } } });
          } else {
            await tx.tour.update({ where: { id: current.tourId }, data: { spotsLeft: { increment: totalTickets } } });
          }
        } 
        else if (current.status === 'cancelled' && newStatus !== 'cancelled') {
          if (current.tourDateId) {
            await tx.tourDate.update({ where: { id: current.tourDateId }, data: { spotsLeft: { decrement: totalTickets } } });
          } else {
            await tx.tour.update({ where: { id: current.tourId }, data: { spotsLeft: { decrement: totalTickets } } });
          }
        }

        return await tx.booking.update({
          where: { id: bookingId },
          data: { status: newStatus },
          include: { member: true, tour: true, tourDate: true }
        });
      });

      // 🔥 ДИСПЕТЧЕРИЗАЦИЯ УВЕДОМЛЕНИЙ ЧЕРЕЗ ХАБ ИЛИ НАПРЯМУЮ ГОСТЯМ
      if (booking.memberId) {
        let eventId: AppEvent | null = null;
        
        switch (newStatus) {
          case 'pending': 
          case 'awaiting_payment': eventId = 'BOOKING_CREATED'; break;
          case 'moderation': eventId = 'PAYMENT_MODERATION_RECEIVED'; break;
          case 'confirmed': eventId = 'BOOKING_CONFIRMED'; break;
          case 'rejected': eventId = 'PAYMENT_REJECTED'; break;
          case 'cancelled': eventId = 'BOOKING_CANCELLED'; break;
        }

        if (eventId) {
          await NotificationHub.dispatch({
            eventId,
            memberId: booking.memberId,
            data: {
              bookingId: booking.id,
              shortId: booking.shortId,
              tourTitle: booking.tour.title,
              tourSlug: booking.tour.slug,
              totalPrice: booking.totalPrice,
              currency: booking.tour.currency,
              paymentMethod: booking.paymentMethod,
              meetingPoint: booking.tourDate?.meetingPoint || booking.tour.meetingPoint,
              meetingTime: booking.tourDate?.time,
              importantInfo: booking.tour.importantInfo,
              biletpmrLink: booking.tour.biletpmrLink,
              apbQrLink: booking.tour.apbQrLink,
            }
          });
        }
  } else if (booking.payerTgChatId) {
        // 🔥 РЕШЕНИЕ 3: Ручная отправка для Гостей
        const meetingInfo = booking.tourDate?.meetingPoint || booking.tour.meetingPoint || 'Будет уточнено гидом';
        const meetingTime = booking.tourDate?.time || '08:30';
        const tourTitle = booking.tour.title;
        const shortId = booking.shortId;

        let msg = '';
        let inlineButtons: any[] = []; // 🔥 ДОБАВЛЕНО: Массив для кнопок

        switch (newStatus) {
          case 'confirmed':
            msg = `🎉 <b>Оплата получена!</b>\n\nВаше место в туре «${tourTitle}» официально забронировано.\n\n📍 <b>Место сбора:</b> ${meetingInfo}\n⏰ <b>Время:</b> ${meetingTime}`;
            
            // 🔥 ДОБАВЛЕНО: Детальный чек-лист как для зарегистрированных пользователей
            const checklist = booking.tour.checklist;
            if (Array.isArray(checklist) && checklist.length > 0) {
              msg += `\n\n🎒 <b>Список снаряжения:</b>\n` + checklist.map((c: any) => `• <b>${c.title}</b>: ${c.items}`).join('\n');
              if (booking.tour.importantInfo) {
                 msg += `\n\n⚠️ <b>Дополнительно:</b> ${booking.tour.importantInfo}`;
              }
            } else if (booking.tour.importantInfo) {
              msg += `\n\n🎒 <b>Важно:</b> ${booking.tour.importantInfo}`;
            }

            // 🔥 ДОБАВЛЕНО: Добавляем ссылку на чат группы и связь с менеджером
            if (booking.tourDate?.groupChatUrl) {
              inlineButtons.push([{ text: '💬 Вступить в чат группы', url: booking.tourDate.groupChatUrl }]);
            }
            inlineButtons.push([{ text: '👨‍💻 Связь с менеджером', url: 'https://t.me/romansvtirase' }]);
            break;

          case 'rejected':
            msg = `❌ <b>Ошибка оплаты</b>\n\nК сожалению, мы не смогли подтвердить оплату заявки <b>#${shortId}</b> на тур «${tourTitle}». Пожалуйста, проверьте чек и отправьте его заново в бота.`;
            inlineButtons.push([{ text: '👨‍💻 Написать менеджеру', url: 'https://t.me/romansvtirase' }]);
            break;

          case 'cancelled':
            msg = `🚫 <b>Бронь отменена</b>\n\nВаша заявка <b>#${shortId}</b> на тур «${tourTitle}» аннулирована.`;
            break;
        }

        if (msg) {
          await sendToUserTelegramAdvanced(
            booking.payerTgChatId, 
            msg, 
            inlineButtons.length > 0 ? inlineButtons : undefined, 
            true
          );
        }
      }
      if (newStatus === 'cancelled') {
        await notifyWaitlistOnSpotFreed(booking.tourId, booking.tourDateId);
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