// src/features/admin/actions/refundPayment.ts
'use server';

import { prisma } from '@/lib/prisma';
import { apbClient } from '@/lib/apb/client';
import { revalidatePath } from 'next/cache';
import { withAdminAudit } from '@/lib/audit';
import { z } from 'zod';

const RefundSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive('Сумма должна быть больше нуля'),
  reason: z.string().min(3, 'Укажите причину возврата'),
});

/**
 * Основная логика возврата через АПБ
 */
async function refundPaymentHandler(raw: z.infer<typeof RefundSchema>) {
  const { bookingId, amount, reason } = RefundSchema.parse(raw);

  // 1. Ищем бронь и проверяем возможность возврата
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      apbInvoiceId: true,
      totalPrice: true,
      refundedAmount: true,
      paidAt: true,
      status: true,
    }
  });

  if (!booking || !booking.apbInvoiceId || !booking.paidAt) {
    throw new Error('Данная бронь не была оплачена через эквайринг АПБ');
  }

  if (booking.status !== 'confirmed' && booking.status !== 'cancelled') {
    throw new Error('Возврат возможен только для подтвержденных броней');
  }

  // Проверка: нельзя вернуть больше, чем было оплачено
  const remainingAmount = booking.totalPrice - booking.refundedAmount;
  if (amount > remainingAmount) {
    throw new Error(`Максимально возможная сумма возврата: ${remainingAmount} руб.`);
  }

  // 2. Вызываем API банка (умный выбор Cancel vs Refund внутри клиента)
  // amount приходит в рублях (как хранится в БД) → переводим в копейки для АПБ
  const amountKop = amount * 100;
  const result = await apbClient.processRefund(
    booking.apbInvoiceId,
    amountKop,
    booking.paidAt
  );

  if (!result.success) {
    throw new Error(result.error || 'Банк отклонил операцию возврата');
  }

  // 3. Обновляем данные в нашей БД
  const updatedRefundedAmount = booking.refundedAmount + amount;
  const isFullRefund = updatedRefundedAmount >= booking.totalPrice;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      refundedAmount: updatedRefundedAmount,
      // Если вернули всё — отменяем бронь автоматически
      status: isFullRefund ? 'cancelled' : booking.status,
      // comment не трогаем совсем, история сохраняется через audit лог
    },
  });

  revalidatePath('/admin');
  return { success: true, isFullRefund };
}

type RefundInput = z.infer<typeof RefundSchema>;
// ✅ Создаем тип для результата
type RefundOutput = { success: boolean; isFullRefund: boolean };

export const refundPaymentAction = withAdminAudit({
  actionName: 'APB_REFUND_OPERATION',
  getTargetId: (data: RefundInput) => data.bookingId,
  sanitizeChanges: (data: RefundInput) => ({ amount: data.amount, reason: data.reason }),
})(refundPaymentHandler) as (data: RefundInput) => Promise<RefundOutput>;