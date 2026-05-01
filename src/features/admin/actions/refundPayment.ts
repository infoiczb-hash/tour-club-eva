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

type RefundInput = z.infer<typeof RefundSchema>;
type RefundOutput = { success: boolean; isFullRefund: boolean };

/**
 * Основная логика возврата через АПБ
 */
async function refundPaymentHandler(raw: RefundInput): Promise<RefundOutput> {
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

  // ✅ Вернули оригинальную проверку (без выдуманного 'paid')
  if (booking.status === 'cancelled' && booking.refundedAmount >= booking.totalPrice) {
    throw new Error('Бронь уже полностью отменена и средства возвращены');
  }

  const remainingAmount = booking.totalPrice - booking.refundedAmount;
  if (amount > remainingAmount) {
    throw new Error(`Максимально возможная сумма возврата: ${remainingAmount} руб.`);
  }

  // 2. Вызываем API банка 
  const amountKop = amount * 100;
  const result = await apbClient.processRefund(
    booking.apbInvoiceId,
    amountKop,
    booking.paidAt
  );

  if (!result.success) {
    throw new Error(result.error || 'Банк отклонил операцию возврата');
  }

  // 3. Обновляем данные в нашей БД с защитой от Race Condition (Optimistic Locking)
  const updatedRefundedAmount = booking.refundedAmount + amount;
  const isFullRefund = updatedRefundedAmount >= booking.totalPrice;

  const updateResult = await prisma.booking.updateMany({
    where: { 
      id: bookingId,
      // КРИТИЧНО: проверяем, что сумма возвратов не изменилась другими запросами
      refundedAmount: booking.refundedAmount 
    },
    data: {
      refundedAmount: updatedRefundedAmount,
      // Если вернули всё — отменяем бронь автоматически
      status: isFullRefund ? 'cancelled' : booking.status,
    },
  });

  if (updateResult.count === 0) {
    console.error(`[CRITICAL RACE CONDITION] Бронь ${bookingId}. Деньги возвращены через АПБ, но БД не обновилась из-за конфликта транзакций!`);
    throw new Error('Сбой синхронизации с базой данных при возврате. Обратитесь к разработчику.');
  }

  revalidatePath('/admin');
  return { success: true, isFullRefund };
}

export const refundPaymentAction = withAdminAudit<[RefundInput], RefundOutput>({
  actionName: 'APB_REFUND_OPERATION',
  getTargetId: (data) => data.bookingId,
  sanitizeChanges: (data) => ({ amount: data.amount, reason: data.reason }),
})(refundPaymentHandler);