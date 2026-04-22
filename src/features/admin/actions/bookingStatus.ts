'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { BookingStatus } from '@prisma/client';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit';
import { NotificationHub } from '@/lib/notifications/hub';
import { AppEvent } from '@/lib/notifications/templates';
import { notifyWaitlistOnSpotFreed } from '@/lib/telegram/notify';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';

export type UpdateBookingStatusInput = {
  bookingId: string;
  newStatus: BookingStatus;
  rejectReason?: string;
  adminName?: string;
};

export const updateBookingStatusAction = withAdminAuth(
  withAdminAudit({
    actionName: 'UPDATE_BOOKING_STATUS',
    getTargetId: (data: UpdateBookingStatusInput) => data.bookingId,
  })(async ({ bookingId, newStatus, rejectReason, adminName }: UpdateBookingStatusInput) => {
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const current = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { tour: true, tourDate: true }
        });

        if (!current) throw new Error('Бронирование не найдено');

        const totalTickets = (current.ticketsAdult || 0) + 
                             (current.ticketsChild || 0) + 
                             (current.ticketsMember || 0) + 
                             ((current.ticketsFamily || 0) * 3);

        // -------------------------------------------------------------
        // Логика пересчета мест (Возврат и Повторное списание)
        // -------------------------------------------------------------
        if (newStatus === 'cancelled' && current.status !== 'cancelled') {
          // Отмена брони (возвращаем места)
          if (current.tourDateId) {
            await tx.tourDate.update({ where: { id: current.tourDateId }, data: { spotsLeft: { increment: totalTickets } } });
          } else {
            await tx.tour.update({ where: { id: current.tourId }, data: { spotsLeft: { increment: totalTickets } } });
          }
        } else if (current.status === 'cancelled' && newStatus !== 'cancelled') {
          // Реактивация отмененной брони (списываем места заново)
          if (current.tourDateId) {
            const date = await tx.tourDate.findUnique({ where: { id: current.tourDateId } });
            if (!date || date.spotsLeft < totalTickets) {
              throw new Error('Невозможно восстановить бронь: недостаточно свободных мест');
            }
            await tx.tourDate.update({ where: { id: current.tourDateId }, data: { spotsLeft: { decrement: totalTickets } } });
          } else {
            const tour = await tx.tour.findUnique({ where: { id: current.tourId } });
            if (!tour || tour.spotsLeft < totalTickets) {
              throw new Error('Невозможно восстановить бронь: недостаточно свободных мест');
            }
            await tx.tour.update({ where: { id: current.tourId }, data: { spotsLeft: { decrement: totalTickets } } });
          }
        }

        // -------------------------------------------------------------
        // Обновление самой брони
        // -------------------------------------------------------------
        return await tx.booking.update({
          where: { id: bookingId },
          data: { 
            status: newStatus,
            rejectReason: (newStatus === 'rejected' || newStatus === 'awaiting_payment') ? rejectReason : null,
            confirmedBy: newStatus === 'confirmed' ? adminName : null,
            confirmedAt: newStatus === 'confirmed' ? new Date() : null,
            createdAt: (newStatus === 'awaiting_payment' && current.status === 'moderation') ? new Date() : undefined,
          },
          include: { member: true, tour: true, tourDate: true }
        });
      });

      // -------------------------------------------------------------
      // Уведомления Гостям (Хаб)
      // -------------------------------------------------------------
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
        // -------------------------------------------------------------
        // Уведомления неавторизованным Гостям (Telegram Bot)
        // -------------------------------------------------------------
        const meetingInfo = booking.tourDate?.meetingPoint || booking.tour.meetingPoint || 'Будет уточнено гидом';
        const meetingTime = booking.tourDate?.time || '08:30';
        const tourTitle = booking.tour.title;
        const shortId = booking.shortId;

        let msg = '';
        let inlineButtons: any[] = [];

        switch (newStatus) {
          case 'confirmed':
            msg = `🎉 <b>Оплата получена!</b>\n\nВаше место в туре «${tourTitle}» официально забронировано.\n\n📍 <b>Место сбора:</b> ${meetingInfo}\n⏰ <b>Время:</b> ${meetingTime}`;
            const checklist = booking.tour.checklist;
            if (Array.isArray(checklist) && checklist.length > 0) {
              msg += `\n\n🎒 <b>Список снаряжения:</b>\n` + checklist.map((c: any) => `• <b>${c.title}</b>: ${c.items}`).join('\n');
              if (booking.tour.importantInfo) {
                 msg += `\n\n⚠️ <b>Дополнительно:</b> ${booking.tour.importantInfo}`;
              }
            } else if (booking.tour.importantInfo) {
              msg += `\n\n🎒 <b>Важно:</b> ${booking.tour.importantInfo}`;
            }

            if (booking.tourDate?.groupChatUrl) {
              inlineButtons.push([{ text: '💬 Вступить в чат группы', url: booking.tourDate.groupChatUrl }]);
            }
            inlineButtons.push([{ text: '👨‍💻 Связь с менеджером', url: 'https://t.me/romansvtirase' }]);
            break;

          case 'rejected':
          case 'awaiting_payment':
            msg = `❌ <b>Ошибка проверки чека</b>\n\nМы не смогли подтвердить оплату заявки <b>#${shortId}</b> на тур «${tourTitle}».`;
            if (rejectReason) {
              msg += `\n\n<b>Причина:</b> ${rejectReason}`;
            }
            msg += `\n\nПожалуйста, отправьте правильный скриншот или файл билета в этот чат. У вас есть 48 часов.`;
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

      // Уведомление листа ожидания
      if (newStatus === 'cancelled') {
        await notifyWaitlistOnSpotFreed(booking.tourId, booking.tourDateId);
      }
      
      revalidatePath('/admin');
      revalidatePath('/account/bookings');
      revalidatePath('/account/dashboard');
      
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Update Booking Status Error:', err);
      return { success: false, error: err.message || 'Ошибка обновления статуса' };
    }
  })
);