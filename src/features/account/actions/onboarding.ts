'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getLevelName } from '@/lib/constants/levels'; //   ПОДКЛЮЧИЛИ ИСТОЧНИК ПРАВДЫ

export async function saveOnboardingDataAction(phoneRaw: string, name: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Не авторизован' };

  const phone = phoneRaw.replace(/[^\d+]/g, '');
  
  if (phone.length < 10) {
    return { success: false, error: 'Введен некорректный номер телефона' };
  }

  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Пожалуйста, введите ваше реальное имя' };
  }

  try {
    const existing = await prisma.memberProfile.findUnique({ where: { phone } });
    if (existing && existing.userId !== user.id) {
      return { success: false, error: 'Этот номер уже привязан к другому аккаунту' };
    }

    const profile = await prisma.memberProfile.update({
      where: { userId: user.id },
      data: { 
        phone,
        name: name.trim() 
      }
    });

    const linkedBookings = await prisma.booking.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    await prisma.waitlist.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    if (linkedBookings.count > 0) {
      const stats = await prisma.booking.aggregate({
        where: { memberId: profile.id, status: { not: 'cancelled' } },
        _count: { id: true },
      });

      const bookingsWithTours = await prisma.booking.findMany({
        where: { memberId: profile.id, status: { not: 'cancelled' } },
        include: { tour: { select: { distance: true } } },
      });

      const totalKm = bookingsWithTours.reduce((sum, b) => {
        const km = parseFloat(b.tour?.distance ?? '0');
        return sum + (isNaN(km) ? 0 : km);
      }, 0);

      const tourCount = stats._count.id;
      await prisma.memberProfile.update({
        where: { id: profile.id },
        data: { 
          totalTours: tourCount, 
          totalKm, 
          level: getLevelName(tourCount) //   ИСПОЛЬЗУЕМ ФУНКЦИЮ ИЗ КОНФИГА
        },
      });
    }

    revalidatePath('/account', 'layout'); 
    return { success: true, linkedCount: linkedBookings.count };
    
  } catch (error) {
    console.error('Onboarding Action Error:', error);
    return { success: false, error: 'Произошла ошибка при сохранении данных' };
  }
}