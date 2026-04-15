// src/features/account/actions/updatePaymentMethod.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server'; // 👈 Добавлен импорт

export async function updatePaymentMethodAction(bookingId: string, paymentMethod: string) {
  try {
    // 1. Проверка авторизации и получение profile.id
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Необходима авторизация' };
    }

    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!profile) {
      return { success: false, error: 'Профиль не найден' };
    }

    // 2. Проверка существования брони И ЕЁ ПРИНАДЛЕЖНОСТИ пользователю
    const current = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        memberId: profile.id // 👈 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: проверка владельца
      },
      select: { status: true }
    });

    if (!current) {
      return { success: false, error: 'Бронирование не найдено или вам не принадлежит' };
    }

    if (current.status === 'confirmed') {
      return { success: false, error: 'Билет уже оплачен, смена метода невозможна' };
    }

    // 3. Определяем новый статус
    const newStatus = paymentMethod === 'cash' ? 'pending' : 'awaiting_payment';

    // 4. Обновляем данные и ОЧИЩАЕМ старые чеки/ошибки
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        paymentMethod,
        status: newStatus,
        receiptUrl: null,   // Сбрасываем старый скриншот чека
        rejectReason: null, // Удаляем старую причину отказа менеджером
      }
    });

    // 5. Ревалидация кэша
    revalidatePath(`/account/bookings/${bookingId}`);
    revalidatePath('/account/bookings');
    revalidatePath('/account/dashboard');
    
    return { success: true };

  } catch (error) {
    console.error('[Action] Update Payment Method Error:', error);
    return { success: false, error: 'Не удалось обновить способ оплаты. Попробуйте еще раз.' };
  }
}