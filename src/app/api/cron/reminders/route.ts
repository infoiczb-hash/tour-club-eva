import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { BookingStatus, Prisma } from '@prisma/client';

// Строгий тип данных, которые вернет Prisma
type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { tour: true; tourDate: true; member: true }
}>;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        paymentMethod: 'cash',
        status: BookingStatus.confirmed,
      },
      include: {
        tour: true,
        tourDate: true,
        member: true
      }
    }) as BookingWithRelations[];

    let sentCount = 0;

    for (const booking of bookings) {
      // 1. Безопасно достаем дату из tourDate или tour
      const tourData = booking.tour as any;
      const tourDateData = booking.tourDate as any;

      const dateFromTourDate = tourDateData?.startDate || tourDateData?.date;
      const dateFromTour = tourData?.date || tourData?.dates?.[0]?.start;

      const finalDateValue = dateFromTourDate || dateFromTour;

      // Если даты вообще нет - пропускаем бронь
      if (!finalDateValue) continue;

      // 2. Явно приводим тип, чтобы TS не ругался на "unknown"
      const targetDate = new Date(finalDateValue as string | number | Date);

      // 3. Проверяем, попадает ли дата на "завтра"
      if (targetDate >= tomorrowStart && targetDate <= tomorrowEnd) {
        if (booking.member?.tgChatId) {
          const message = `🏕 <b>Напоминание о туре!</b>\n\nЗавтра выезд: «<b>${booking.tour.title}</b>».\nПодготовьте <b>${booking.totalPrice} руб.</b> без сдачи (оплата наличными).\n\nПодтвердите участие:`;

          await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: booking.member.tgChatId,
              text: message,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✅ Буду точно', callback_data: `cash_confirm_${booking.id}` }],
                  [{ text: '❌ Не смогу поехать', callback_data: `cash_cancel_${booking.id}` }]
                ]
              }
            })
          });
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });

  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}