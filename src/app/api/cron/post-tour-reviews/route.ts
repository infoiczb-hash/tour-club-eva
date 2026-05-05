import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { NotificationHub } from '@/lib/notifications/hub';
import { getLevelName, getLevelConfig, LEVELS_CONFIG   } from '@/lib/constants/levels'; //   Импорт для пересчёта уровня


// ==========================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ГОСТЕЙ (БЕЗ ЛК)
// ==========================================
async function sendGuestReviewRequest(chatId: string, bookingId: string, tourTitle: string, name: string) {
    const token = env.TELEGRAM_AUTH_BOT;
    const text = `🏕 <b>${name}, с возвращением!</b>\n\nНадеемся, наше приключение «<b>${tourTitle}</b>» прошло отлично.\n\nПомогите нам стать еще лучше — поделитесь впечатлениями о работе гида и организации. 👇`;
    
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: text, 
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✍️ Написать отзыв', callback_data: `write_review_${bookingId}` }]
            ]
        }
      })
    });
}

// ==========================================
// НОВАЯ ФУНКЦИЯ: обновление статистики участника
// ==========================================
async function updateMemberStats(memberId: string) {
  // 1. Подсчитываем реальное количество подтверждённых и завершённых туров
  const now = new Date();
  const completedCount = await prisma.booking.count({
    where: {
      memberId: memberId,
      status: 'confirmed',
      OR: [
        // Многодневный тур: endDate уже прошёл
        { tourDate: { endDate: { lt: now } } },
        // Однодневный тур: endDate не задан, но startDate уже прошёл
        { tourDate: { endDate: null, startDate: { lt: now } } }
      ]
    }
  });

  // 2. Получаем текущее значение totalTours из профиля
 const member = await prisma.memberProfile.findUnique({
  where: { id: memberId },
  select: { totalTours: true, level: true }
});

  if (!member) return;

  // 3. Если расхождение — обновляем totalTours и уровень
  if (member.totalTours !== completedCount) {
    const newLevel = getLevelName(completedCount);
    await prisma.memberProfile.update({
      where: { id: memberId },
      data: {
        totalTours: completedCount,
        level: newLevel
      }
    });
    console.log(`[Cron Review] Обновлена статистика участника ${memberId}: туров ${completedCount}, уровень ${newLevel}`);
  }
}

export async function GET(req: Request) {
  try {
    // 🛡 НОВАЯ ЗАЩИТА: Нативная проверка Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Определяем вчерашние сутки
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    //   ИСПРАВЛЕНИЕ 5: Документируем edge-case для однодневных туров
    // ВНИМАНИЕ: Если однодневный тур закончился сегодня глубокой ночью (напр. в 02:00), 
    // но администратор не указал endDate в БД, крон запросит отзыв по startDate (вчерашнему дню).
    // Правило для контент-менеджеров: Для туров с ночными возвратами ВСЕГДА указывать endDate!
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        OR: [
          // Если есть дата конца, и она была вчера
          { tourDate: { endDate: { gte: yesterdayStart, lt: todayStart } } },
          // Если даты конца нет (однодневный тур), то старт был вчера
          { tourDate: { endDate: null, startDate: { gte: yesterdayStart, lt: todayStart } } }
        ]
      },
      include: { tour: true, member: true } 
    });

    let sentCount = 0;

    for (const booking of bookings) {
      // Игнорируем заявки, где нет ни аккаунта, ни Telegram-чата
      if (!booking.memberId && !booking.payerTgChatId) continue;

      //   НОВОЕ: обновляем статистику участника (только если есть memberId)
      if (booking.memberId) {
        await updateMemberStats(booking.memberId);
      }

      // Проверяем, не оставил ли он уже отзыв (чтобы не спамить)
      let existingReview = null;
      if (booking.memberId) {
        existingReview = await prisma.review.findFirst({
          where: { tourId: booking.tourId, memberId: booking.memberId }
        });
      } else if (booking.name) {
        existingReview = await prisma.review.findFirst({
          where: { tourId: booking.tourId, name: booking.name }
        });
      }

      if (!existingReview) {
      try {
          if (booking.memberId) {
            // 🌟 СЦЕНАРИЙ А: ЗАГРУЖАЕМ ГЕЙМИФИКАЦИЮ (С ЛИЧНЫМ КАБИНЕТОМ)
            const totalTours = booking.member?.totalTours || 0;
            const currentLevelName = booking.member?.level || 'Первопроходец';
            
            // Находим следующий уровень в конфиге
            const currentLevelIdx = LEVELS_CONFIG.findIndex(l => l.name === currentLevelName);
            const nextLevel = LEVELS_CONFIG[currentLevelIdx + 1];
            const toursToNext = nextLevel ? nextLevel.min - totalTours : null;

            await NotificationHub.dispatch({
              eventId: 'POST_TOUR_REVIEW', 
              memberId: booking.memberId,
              data: {
                bookingId: booking.id,
                tourTitle: booking.tour.title,
                totalTours: totalTours,
                level: currentLevelName,
                nextLevelName: nextLevel?.name || null,
                toursToNext: toursToNext && toursToNext > 0 ? toursToNext : null
              }
            });
          } else if (booking.payerTgChatId) {
            // 🔥 СЦЕНАРИЙ Б: УВЕДОМЛЕНИЕ ГОСТЯМ БЕЗ АККАУНТА НАПРЯМУЮ В ТГ
            await sendGuestReviewRequest(
                booking.payerTgChatId, 
                booking.id, 
                booking.tour.title, 
                booking.name
            );
          }
          
          sentCount++;
        } catch (e) {
          console.error(`[Cron Review] Ошибка для брони ${booking.id}:`, e);
        }
}
  return NextResponse.json({ 
        success: true, 
        message: `Уведомления успешно отправлены: ${sentCount} шт.` 
      });
}
  } catch (error) {
    // Глобальная ошибка (например, упала БД)
    console.error('Cron review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}