// src/features/account/actions/updatePaymentMethod.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updatePaymentMethodAction(bookingId: string, paymentMethod: string) {
  try {
    // 1. Сначала проверяем текущее состояние брони
    const current = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true }
    });

    if (!current) {
      return { success: false, error: 'Бронирование не найдено' };
    }

    if (current.status === 'confirmed') {
      return { success: false, error: 'Билет уже оплачен, смена метода невозможна' };
    }

    // 2. Определяем новый статус (cash -> pending, остальные -> awaiting_payment)
    const newStatus = paymentMethod === 'cash' ? 'pending' : 'awaiting_payment';

    // 3. Обновляем данные и ОЧИЩАЕМ старые чеки/ошибки
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        paymentMethod,
        status: newStatus,
        receiptUrl: null,   // Сбрасываем старый скриншот чека
        rejectReason: null, // Удаляем старую причину отказа менеджером
      }
    });

    // 4. Очищаем кэш по всем направлениям, чтобы клиент сразу увидел изменения
    revalidatePath(`/account/bookings/${bookingId}`);
    revalidatePath('/account/bookings');
    revalidatePath('/account/dashboard');
    
    return { success: true };

  } catch (error) {
    console.error('[Action] Update Payment Method Error:', error);
    return { success: false, error: 'Не удалось обновить способ оплаты. Попробуйте еще раз.' };
  }
}