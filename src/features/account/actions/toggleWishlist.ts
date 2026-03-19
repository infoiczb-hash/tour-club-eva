// src/features/account/actions/toggleWishlist.ts
"use server";

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleWishlistAction(tourId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Если юзер не авторизован, возвращаем флаг needsAuth
    if (!user) return { success: false, needsAuth: true };

    const profile = await prisma.memberProfile.findUnique({ 
      where: { userId: user.id } 
    });

    if (!profile) return { success: false, error: 'Профиль не найден' };

    // Проверяем, есть ли уже этот тур в избранном
    const existing = await prisma.watchList.findFirst({
      where: { memberId: profile.id, tourId }
    });

    if (existing) {
      // Если есть — удаляем
      await prisma.watchList.delete({ where: { id: existing.id } });
    } else {
      // Если нет — добавляем
      await prisma.watchList.create({
        data: { memberId: profile.id, tourId }
      });
    }

    // Сбрасываем кэш, чтобы счетчики в шапке/кабинете обновились
    revalidatePath('/tour');
    revalidatePath('/account');
    
    return { success: true, isWished: !existing };
  } catch (error) {
    console.error('Ошибка в toggleWishlistAction:', error);
    return { success: false, error: 'Ошибка сервера' };
  }
}