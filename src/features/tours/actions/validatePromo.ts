'use server';

import { prisma } from '@/lib/prisma';

export async function validatePromoCodeAction(code: string) {
  if (!code) return { success: false, error: 'Введите код' };

  try {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!promo || !promo.isActive) {
      return { success: false, error: 'Промокод недействителен' };
    }

    if (promo.validUntil && promo.validUntil < new Date()) {
      return { success: false, error: 'Срок действия промокода истёк' };
    }

    // Возвращаем данные для пересчета цены на клиенте
    return {
      success: true,
      discount: promo.discount, // По твоей схеме это 10 (или 100)
      type: promo.type,         // 'fixed' или 'percent'
    };
  } catch (error) {
    console.error('[validatePromoCodeAction] Error:', error);
    return { success: false, error: 'Ошибка при проверке кода' };
  }
}