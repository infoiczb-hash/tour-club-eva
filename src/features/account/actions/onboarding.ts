// src/features/account/actions/onboarding.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Функция расчета уровня (как при регистрации)
function getLevel(tourCount: number): string {
  if (tourCount >= 30) return 'Легенда клуба';
  if (tourCount >= 15) return 'Ветеран';
  if (tourCount >= 7)  return 'Бывалый';
  if (tourCount >= 3)  return 'Походник';
  return 'Первопроходец';
}

export async function savePhoneNumberAction(phoneRaw: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Не авторизован' };

  // Очищаем номер от пробелов, чтобы искать в базе корректно
  const phone = phoneRaw.replace(/[^\d+]/g, '');
  
  if (phone.length < 10) {
    return { success: false, error: 'Введен некорректный номер телефона' };
  }

  try {
    // 1. Проверяем, не занят ли этот номер кем-то другим
    const existing = await prisma.memberProfile.findUnique({ where: { phone } });
    if (existing && existing.userId !== user.id) {
      return { success: false, error: 'Этот номер уже привязан к другому аккаунту' };
    }

    // 2. Сохраняем телефон юзеру
    const profile = await prisma.memberProfile.update({
      where: { userId: user.id },
      data: { phone }
    });

    // 3. МАГИЯ: Ищем все исторические брони по этому номеру, у которых еще нет memberId
    const linked = await prisma.booking.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    // 4. Если нашли старые брони — пересчитываем статусы и километраж
    if (linked.count > 0) {
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
          level: getLevel(tourCount) 
        },
      });
    }

    revalidatePath('/account', 'layout'); // Сбрасываем кэш всего ЛК
    return { success: true, linkedCount: linked.count };
    
  } catch (error) {
    console.error('Onboarding Action Error:', error);
    return { success: false, error: 'Произошла ошибка при сохранении номера' };
  }
}