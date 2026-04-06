// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Вычисляем границы завтрашнего дня (от 00:00 до 23:59:59)
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(0, 0, 0, 0);

    // 2. ИЩЕМ ТОЛЬКО НУЖНЫЕ ЗАПИСИ ЧЕРЕЗ PRISMA
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        tourDate: {
          startDate: {
            gte: tomorrowStart,
            lt: tomorrowEnd,
          },
        },
      },
      include: {
        tour: true,
        tourDate: true,
        member: true,
      },
    });

    // 3. Отправляем уведомления (теперь в массиве ТОЛЬКО завтрашние туры)
    const notifications = bookings.map(async (booking) => {
      const tourData = booking.tour;
      const tourDateData = booking.tourDate;

      // Если нет Telegram — пропускаем
      if (!booking.member?.tgChatId) return false;

      // Чек-лист
      const rawChecklist = (tourData.checklist as any) || [];
      let checklistText = '\n\n🎒 <b>Важно:</b> Возьмите с собой хорошее настроение!';
      if (Array.isArray(rawChecklist) && rawChecklist.length > 0) {
        checklistText = '\n\n🎒 <b>Что взять с собой:</b>\n' + rawChecklist.map((c: any) => `• <b>${c.title}</b>: ${c.items}`).join('\n');
      }

      const meetingPoint = tourDateData?.meetingPoint || tourData.meetingPoint || 'Уточняется в чате';
      const timeStr = tourDateData?.time || 'Утром';

      let message = `🎉 <b>Завтра мы отправляемся в тур!</b>\n\nЖдем вас на маршруте «<b>${tourData.title}</b>».\n\n📍 <b>Место сбора:</b> ${meetingPoint}\n⏰ <b>Время:</b> ${timeStr}\n\n`;
      let reply_markup: any = undefined;

      if (booking.paymentMethod === 'cash' && booking.status === 'pending') {
        message += `💰 <b>Оплата на месте:</b> Пожалуйста, подготовьте <b>${booking.totalPrice} ${tourData.currency || 'MDL'}</b> наличными (желательно без сдачи). Оплата передается гиду перед стартом.`;
        message += checklistText;
        message += `\n\nЕсли вы еще не в чате группы — обязательно добавляйтесь, гид ждет вас там.\n\n⚠️ <b>Пожалуйста, подтвердите ваше участие нажатием кнопки ниже:</b>`;

        const buttons: { text: string; callback_data?: string; url?: string }[][] = [
          [{ text: '✅ Буду точно', callback_data: `cash_confirm_${booking.id}` }],
          [{ text: '❌ Не смогу поехать', callback_data: `cash_cancel_${booking.id}` }]
        ];
        if (tourDateData?.groupChatUrl) {
          buttons.unshift([{ text: '💬 Перейти в чат группы', url: tourDateData.groupChatUrl }]);
        }
        reply_markup = { inline_keyboard: buttons };
      } else if (booking.status === 'confirmed') {
        message += `✅ <b>Статус:</b> Оплата подтверждена.`;
        message += checklistText;
        message += `\n\nЕсли вы еще не в чате группы — обязательно добавляйтесь, гид ждет вас там.`;
        if (tourDateData?.groupChatUrl) {
          reply_markup = {
            inline_keyboard: [[{ text: '💬 Перейти в чат группы', url: tourDateData.groupChatUrl }]]
          };
        }
      } else {
        return false;
      }

      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: booking.member.tgChatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup,
        }),
      });

      return true;
    });

    const results = await Promise.allSettled(notifications);
    const sentCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
// POST нужен для ручного пинга через curl/Postman
export const POST = GET;