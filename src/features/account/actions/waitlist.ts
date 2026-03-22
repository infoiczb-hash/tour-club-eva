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