import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';
import { revalidatePath } from 'next/cache';

const redis = Redis.fromEnv();
const RATE_LIMIT_KEY = 'cron:cancel_unpaid:last_run';
const MIN_INTERVAL_MS = 55 * 60 * 1000; // 55 минут защита от случайного двойного запуска

// Наши временные рамки (в часах)
const REMINDER_HOURS = 24; // Когда отправляем предупреждение
const CANCEL_HOURS = 48;   // Когда окончательно отменяем

export async function GET(req: Request) {
  try {
    // 1. Защита эндпоинта
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Защита от двойного запуска Cron
    const lastRun = await redis.get<number>(RATE_LIMIT_KEY);
    if (lastRun && Date.now() - lastRun < MIN_INTERVAL_MS) {
      return NextResponse.json({ skipped: true, reason: 'Too soon' });
    }

    // 3. Берем брони, которые ждут оплаты (pending для налички и moderation в безопасности)
    // Находим все, что старше 24 часов
    const deadline24h = new Date(Date.now() - REMINDER_HOURS * 60 * 60 * 1000);
    
    const deadSouls = await prisma.booking.findMany({
      where: {
        status: 'awaiting_payment',
        createdAt: { lt: deadline24h }
      },
      include: { member: true, tour: true }
    });

    let cancelledCount = 0;
    let remindedCount = 0;

    // 4. Обрабатываем каждую бронь
    for (const booking of deadSouls) {
      try {
        // Считаем возраст брони в часах
        const ageInHours = (Date.now() - booking.createdAt.getTime()) / (1000 * 60 * 60);
        const shortId = booking.id.substring(0, 4);

        // --- ЛОГИКА 1: ПРОШЛО 48 ЧАСОВ (ОТМЕНА) ---
        if (ageInHours >= CANCEL_HOURS) {
          await prisma.$transaction(async (tx) => {
            const totalTickets = (booking.ticketsAdult || 0) + (booking.ticketsChild || 0) + (booking.ticketsMember || 0) + ((booking.ticketsFamily || 0) * 3);

            // Возврат мест
            if (booking.tourDateId) {
              await tx.tourDate.update({ where: { id: booking.tourDateId }, data: { spotsLeft: { increment: totalTickets } } });
            } else {
              await tx.tour.update({ where: { id: booking.tourId }, data: { spotsLeft: { increment: totalTickets } } });
            }

            // Отмена брони
            await tx.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
          });

          cancelledCount++;

          // Уведомление об отмене (Сообщение 2)
          if (booking.member?.tgChatId) {
            const msg = `❌ <b>Бронь автоматически отменена</b>\n\nК сожалению, время ожидания истекло. Оплата за бронь <b>#${shortId}</b> на тур «${booking.tour.title}» так и не поступила, поэтому ваши места были возвращены в продажу.\n\nНо горы никуда не убегут! 🏔 Мы будем рады видеть вас в наших следующих поездках. Если эта отмена произошла по ошибке или вы хотите выбрать другой тур — свяжитесь с нашим менеджером.`;
            await sendToUserTelegramAdvanced(booking.member.tgChatId, msg, [[{ text: '💬 Написать менеджеру', url: 'https://t.me/romansvtirase' }]], true);
          }
        } 
        
        // --- ЛОГИКА 2: ПРОШЛО ОТ 24 ДО 48 ЧАСОВ (НАПОМИНАНИЕ) ---
        else if (ageInHours >= REMINDER_HOURS) {
          const redisKey = `reminder_sent:${booking.id}`;
          const isReminded = await redis.get(redisKey);

          // Если еще не напоминали
          if (!isReminded) {
            // Уведомление с напоминанием (Сообщение 1)
            if (booking.member?.tgChatId) {
              const msg = `⏳ <b>Ожидаем оплату</b>\n\nПривет! Прошли сутки с момента бронирования мест на тур «${booking.tour.title}» (Бронь <b>#${shortId}</b>).\n\nЗа вами надежно закреплены места, но подтверждение оплаты еще не поступило. У вас есть еще <b>24 часа</b>, после чего система автоматически отменит бронь и вернет билеты в свободную продажу.\n\nЕсли вы просто замотались, забыли или у вас возникли трудности с переводом — не переживайте, просто нажмите кнопку ниже 👇`;
              
              await sendToUserTelegramAdvanced(booking.member.tgChatId, msg, [[{ text: '💬 Помощь с оплатой', url: 'https://t.me/romansvtirase' }]], true);
            }
            
            // Отмечаем в Redis, что напомнили (ключ исчезнет сам через 48 часов)
            await redis.set(redisKey, '1', { ex: 48 * 60 * 60 });
            remindedCount++;
          }
        }

      } catch (err) {
        console.error(`Ошибка обработки брони ${booking.id}:`, err);
      }
    }

    if (cancelledCount > 0) {
      revalidatePath('/tour');
      revalidatePath('/admin');
    }

    await redis.set(RATE_LIMIT_KEY, Date.now(), { ex: 60 * 60 });

    return NextResponse.json({ 
      success: true,
      processed: deadSouls.length,
      reminded: remindedCount,
      cancelled: cancelledCount 
    });

  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}