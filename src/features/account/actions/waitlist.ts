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
      where: { id: waitlistId } 
    });

    if (!waitlist || waitlist.phone !== profile.phone) {
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
    // Пробуем получить авторизованного пользователя (необязательно)
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let memberId: string | null = null;

    if (user) {
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, phone: true, name: true },
      });
      if (profile) {
        memberId = profile.id;
        // Подставляем данные профиля если не переданы
        name  = name  || profile.name  || '';
        phone = phone || profile.phone || undefined;
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

    revalidatePath(`/tour`);
    return { success: true };
  } catch (error) {
    console.error('Join Waitlist Error:', error);
    return { success: false, error: 'Внутренняя ошибка сервера' };
  }
}