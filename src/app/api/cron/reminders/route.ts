import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { Prisma } from '@prisma/client';

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

    // Достаем всех, у кого статус pending (наличные) или confirmed (оплачено)
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
      },
      include: {
        tour: true,
        tourDate: true,
        member: true
      }
    }) as BookingWithRelations[];

    const notifications = bookings.map(async (booking) => {
      const tourData = booking.tour as any;
      const tourDateData = booking.tourDate as any;

      const finalDateValue = tourDateData?.startDate || tourDateData?.date || tourData?.date || tourData?.dates?.[0]?.start;
      if (!finalDateValue) return false;

      const targetDate = new Date(finalDateValue as string | number | Date);

      if (targetDate >= tomorrowStart && targetDate <= tomorrowEnd && booking.member?.tgChatId) {
        
        // 1. Формируем красивый ЧЕК-ЛИСТ
        const rawChecklist = tourData.checklist;
        let checklistText = '\n\n🎒 <b>Важно:</b> Возьмите с собой хорошее настроение!';
        
        if (Array.isArray(rawChecklist) && rawChecklist.length > 0) {
          checklistText = '\n\n🎒 <b>Что взять с собой:</b>\n' + rawChecklist.map((c: any) => `• <b>${c.title}</b>: ${c.items}`).join('\n');
        }

        const meetingPoint = tourDateData?.meetingPoint || tourData.meetingPoint || 'Уточняется в чате';
        const timeStr = tourDateData?.time || 'Утром';

        // 2. БАЗОВЫЙ БЛОК (Одинаковый для всех)
        let message = `🎉 <b>Завтра мы отправляемся в тур!</b>\n\nЖдем вас на маршруте «<b>${tourData.title}</b>».\n\n📍 <b>Место сбора:</b> ${meetingPoint}\n⏰ <b>Время:</b> ${timeStr}\n\n`;

        let reply_markup: any = undefined;

        // ==========================================
        // СЦЕНАРИЙ А: НАЛИЧНЫЕ (Оплата на месте)
        // ==========================================
        if (booking.paymentMethod === 'cash' && booking.status === 'pending') {
          message += `💰 <b>Оплата на месте:</b> Пожалуйста, подготовьте <b>${booking.totalPrice} ${tourData.currency || 'MDL'}</b> наличными (желательно без сдачи). Оплата передается гиду перед стартом.`;
          message += checklistText;
          message += `\n\nЕсли вы еще не в чате группы — обязательно добавляйтесь, гид ждет вас там.\n\n⚠️ <b>Пожалуйста, подтвердите ваше участие нажатием кнопки ниже:</b>`;

      const buttons: { text: string; callback_data?: string; url?: string }[][] = [
            [{ text: '✅ Буду точно', callback_data: `cash_confirm_${booking.id}` }],
            [{ text: '❌ Не смогу поехать', callback_data: `cash_cancel_${booking.id}` }]
          ];
          
          // Добавляем кнопку чата, если есть ссылка
          if (tourDateData?.groupChatUrl) {
            buttons.unshift([{ text: '💬 Перейти в чат группы', url: tourDateData.groupChatUrl }]);
          }

          reply_markup = { inline_keyboard: buttons };
        } 
        // ==========================================
        // СЦЕНАРИЙ Б: УЖЕ ОПЛАТИЛ (Онлайн / Чек)
        // ==========================================
        else if (booking.status === 'confirmed') {
          message += `✅ <b>Статус:</b> Оплата подтверждена.`;
          message += checklistText;
          message += `\n\nЕсли вы еще не в чате группы — обязательно добавляйтесь, гид ждет вас там.`;

          if (tourDateData?.groupChatUrl) {
            reply_markup = {
              inline_keyboard: [
                [{ text: '💬 Перейти в чат группы', url: tourDateData.groupChatUrl }]
              ]
            };
          }
        } else {
          return false;
        }

        // 3. ОТПРАВКА
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: booking.member.tgChatId,
            text: message,
            parse_mode: 'HTML',
            reply_markup
          })
        });
        
        return true;
      }
      return false;
    });

    const results = await Promise.allSettled(notifications);
    const sentCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

    return NextResponse.json({ success: true, sent: sentCount });

  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}