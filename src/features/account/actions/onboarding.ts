'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Функция расчета уровня (Синхронизирована с новым LevelsInfoModal)
function getLevel(tourCount: number): string {
  if (tourCount >= 21) return 'Легенда';
  if (tourCount >= 11) return 'Мастер троп';
  if (tourCount >= 6)  return 'Следопыт';
  if (tourCount >= 3)  return 'Искатель';
  return 'Первопроходец';
}

export async function saveOnboardingDataAction(phoneRaw: string, name: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Не авторизован' };

  // Очищаем номер от пробелов, чтобы искать в базе корректно
  const phone = phoneRaw.replace(/[^\d+]/g, '');
  
  if (phone.length < 10) {
    return { success: false, error: 'Введен некорректный номер телефона' };
  }

  // ✅ НОВОЕ: Валидация имени
  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Пожалуйста, введите ваше реальное имя' };
  }

  try {
    // 1. ЗАЩИТА ОТ УГОНА: Проверяем, не занят ли этот номер кем-то другим
    const existing = await prisma.memberProfile.findUnique({ where: { phone } });
    if (existing && existing.userId !== user.id) {
      return { success: false, error: 'Этот номер уже привязан к другому аккаунту' };
    }

    // 2. Сохраняем телефон и ИМЯ юзеру
    const profile = await prisma.memberProfile.update({
      where: { userId: user.id },
      data: { 
        phone,
        name: name.trim() // ✅ Добавили сохранение имени
      }
    });

    // 3. МАГИЯ: Ищем все исторические брони по этому номеру, у которых еще нет memberId
    const linkedBookings = await prisma.booking.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    // ✅ НОВОЕ: Привязываем Листы ожидания (раз мы сделали это на дашборде)
    await prisma.waitlist.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    // 4. ПЕРЕСЧЕТ: Если нашли старые брони — пересчитываем статусы и километраж
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
          level: getLevel(tourCount) 
        },
      });
    }

    revalidatePath('/account', 'layout'); // Сбрасываем кэш всего ЛК
    return { success: true, linkedCount: linkedBookings.count };
    
  } catch (error) {
    console.error('Onboarding Action Error:', error);
    return { success: false, error: 'Произошла ошибка при сохранении данных' };
  }
}