'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { publishToTelegram } from '@/features/admin/actions/telegram';

interface TransferInput {
  bookingId: string;
  newPhone: string;
  newName: string;
}

type TransferResult =
  | { success: true }
  | { success: false; error: string };

export async function transferBookingSpot(input: TransferInput): Promise<TransferResult> {
  // Проверяем авторизацию
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Необходима авторизация' };

  const { bookingId, newPhone, newName } = input;

  // Находим профиль
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { success: false, error: 'Профиль не найден' };

  // Находим бронь — убеждаемся что она принадлежит этому участнику
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      memberId: profile.id,
      status: { in: ['pending', 'confirmed'] },
    },
    include: {
      tour: { select: { id: true, title: true, slug: true } },
      tourDate: { select: { id: true, startDate: true, spotsLeft: true, spots: true } },
    },
  });

  if (!booking) {
    return { success: false, error: 'Бронь не найдена или уже отменена' };
  }

  // Транзакция: отмена старой брони + создание новой
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Отменяем старую бронь
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' },
      });

      // 2. Создаём новую бронь для нового участника
      const newBooking = await tx.booking.create({
        data: {
          name: newName,
          phone: newPhone,
          tourId: booking.tourId,
          tourDateId: booking.tourDateId,
          ticketsAdult: booking.ticketsAdult,
          ticketsChild: booking.ticketsChild,
          ticketsFamily: booking.ticketsFamily,
          ticketsMember: booking.ticketsMember,
          totalPrice: booking.totalPrice,
          currency: booking.currency,
          source: 'transfer',
          status: 'confirmed',
          comment: `Передано от ${profile.name ?? profile.phone}`,
        },
      });

      // 3. Привязываем новую бронь к профилю если новый участник уже зарегистрирован
      const newProfile = await tx.memberProfile.findUnique({
        where: { phone: newPhone },
      });
      if (newProfile) {
        await tx.booking.update({
          where: { id: newBooking.id },
          data: { memberId: newProfile.id },
        });
      }
    });

    // Уведомление в Telegram (не блокируем основной флоу)
    try {
      const dateStr = booking.tourDate
        ? booking.tourDate.startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
        : 'дата не указана';

      await publishToTelegram(
        `🔄 Передача места\n` +
        `Тур: ${booking.tour.title} (${dateStr})\n` +
        `От: ${profile.name ?? profile.phone}\n` +
        `Кому: ${newName} ${newPhone}`
      );
    } catch {
      // Telegram уведомление не критично
    }

    revalidatePath('/account/bookings');
    return { success: true };

  } catch (err) {
    console.error('[transferBookingSpot]', err);
    return { success: false, error: 'Не удалось передать место. Попробуйте ещё раз.' };
  }
}
