'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cancelWaitlistAction(waitlistId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Необходима авторизация' };

    const profile = await prisma.memberProfile.findUnique({ 
      where: { userId: user.id } 
    });

    if (!profile || !profile.phone) {
      return { success: false, error: 'Профиль или телефон не найдены' };
    }

    // Проверяем, что заявка принадлежит именно этому пользователю
    const waitlist = await prisma.waitlist.findUnique({
      where: { 
        id: waitlistId,
        memberId: profile.id  // ← проверка через memberId, не phone
      }
    });

    if (!waitlist) {
      return { success: false, error: 'Заявка не найдена или вам не принадлежит' };
    }

    await prisma.waitlist.delete({ where: { id: waitlistId } });
    
    // Сбрасываем кэш страницы броней
    revalidatePath('/account/bookings');
    return { success: true };
  } catch (error) {
    console.error('Cancel Waitlist Error:', error);
    return { success: false, error: 'Внутренняя ошибка сервера' };
  }
}

export async function joinWaitlistAction({
  tourId,
  tourDateId,
  name,
  phone,
  social,
}: {
  tourId:      string;
  tourDateId?: string;
  name:        string;
  phone?:      string;
  social?:     string;
}) {
  try {
    // Пробуем получить авторизованного пользователя
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let memberId: string | null = null;
    let userTelegramChatId: string | null = null; // Для хранения персонального чата пользователя

    if (user) {
      // Подтягиваем профиль и запрашиваем tgChatId строго по схеме
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, phone: true, name: true, tgChatId: true },
      });
      if (profile) {
        memberId = profile.id;
        // Подставляем данные профиля если не переданы вручную
        name  = name  || profile.name  || '';
        phone = phone || profile.phone || undefined;
        userTelegramChatId = profile.tgChatId || null;
      }
    }

    // Защита от дублей — один телефон на один тур
    if (phone) {
      const existing = await prisma.waitlist.findFirst({
        where: { tourId, phone },
      });
      if (existing) {
        return { success: false, error: 'Вы уже в списке ожидания на этот тур' };
      }
    }

    // Создаем запись в базе данных (отсюда её будет читать админка в разделе Ожидания)
    await prisma.waitlist.create({
      data: {
        tourId,
        tourDateId: tourDateId || null,
        memberId:   memberId   || null,
        name,
        phone:      phone  || null,
        social:     social || null,
      },
    });

    // --- ПЕРСОНАЛЬНОЕ УВЕДОМЛЕНИЕ ПОЛЬЗОВАТЕЛЮ В TELEGRAM ---
    try {
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;

      // Бот пишет ЛИЧНО пользователю, только если он подключил бота (есть tgChatId)
      if (tgToken && userTelegramChatId) {
        // Достаем название тура для красивого текста
        const tour = await prisma.tour.findUnique({
          where: { id: tourId },
          select: { title: true }
        });

        // Формируем дату выезда
        let dateStr = 'Открытая дата';
        if (tourDateId) {
          const tourDate = await prisma.tourDate.findUnique({
            where: { id: tourDateId },
            select: { startDate: true } // 🚀 SENIOR FIX: Оставили только реальное поле из БД
          });
          const d = tourDate?.startDate;
          if (d) {
            dateStr = new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
          }
        }

        // Текст сообщения для самого клиента
        const userMessage = `🎉 *Вы успешно записаны в Лист ожидания!*\n\n🛶 Тур: _${tour?.title || 'Выбранный тур'}_\n📅 Дата выезда: *${dateStr}*\n\nКак только кто-то откажется от поездки или появятся свободные места, мы мгновенно пришлем вам уведомление сюда!`;

        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userTelegramChatId,
            text: userMessage,
            parse_mode: 'Markdown',
          }),
        });
      }
    } catch (tgError) {
      console.error('Ошибка отправки персонального уведомления в Telegram:', tgError);
    }
    // -------------------------------------------------------

    revalidatePath(`/tour`);
    return { success: true };
  } catch (error) {
    console.error('Join Waitlist Error:', error);
    return { success: false, error: 'Внутренняя ошибка сервера' };
  }
}