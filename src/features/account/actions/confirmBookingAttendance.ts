'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function confirmBookingAttendance(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });

  if (!booking) throw new Error('Бронь не найдена');

await prisma.booking.update({
    where: { id: bookingId },
    data: {
      isAttendanceConfirmed: true // Просто ставим галочку в базе ✅
    }
  });

  // Мгновенно обновляем страницу билета, чтобы желтый блок сменился на зеленый ✅
  revalidatePath(`/account/bookings/${bookingId}`);
}