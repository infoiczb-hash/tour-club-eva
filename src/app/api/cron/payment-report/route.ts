import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram/notify';

export async function GET(request: Request) {
  // 1. Проверка авторизации для Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Ищем все брони в статусе pending
    const pendingBookings = await prisma.booking.findMany({
      where: { 
        status: 'pending',
      },
      include: {
        tour: { select: { title: true, currency: true } },
        tourDate: { select: { startDate: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (pendingBookings.length === 0) {
      return NextResponse.json({ message: 'No pending bookings found' });
    }

    // 3. Формируем текст сообщения в формате HTML
    let message = `🔔 <b>ЕЖЕДНЕВНЫЙ ОТЧЕТ: ОЖИДАЮТ ОПЛАТЫ</b>\n`;
    message += `Всего броней на проверку: <b>${pendingBookings.length}</b>\n\n`;

    pendingBookings.forEach((b, i) => {
      const tourDate = b.tourDate?.startDate 
        ? new Date(b.tourDate.startDate).toLocaleDateString('ru-RU') 
        : 'Дата открыта';
      
      message += `${i + 1}. 👤 <b>${b.name}</b>\n`;
      message += `📞 <code>${b.phone}</code>\n`; 
      message += `🗺 Тур: ${b.tour.title}\n`;
      message += `📅 Дата: ${tourDate}\n`;
      message += `💰 К оплате: <b>${b.totalPrice} ${b.tour.currency || 'MDL'}</b>\n`;
      message += `──────────────────\n`;
    });

    // 4. Отправляем в админский чат
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    
    if (!adminChatId) {
      throw new Error('TELEGRAM_ADMIN_CHAT_ID is not defined in env');
    }

    // ✅ ИСПРАВЛЕНО: передаем ровно 2 аргумента!
    await sendTelegramMessage(adminChatId, message);

    return NextResponse.json({ success: true, sent: pendingBookings.length });
  } catch (error) {
    console.error('[CRON_PAYMENT_REPORT_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}