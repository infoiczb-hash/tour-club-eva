// __tests__/integration/refundPaymentAction.test.ts
import { refundPaymentAction } from '@/features/admin/actions/refundPayment';
import { prisma } from '@/lib/prisma';
import { apbClient } from '@/lib/apb/client';
import { revalidatePath } from 'next/cache';

// 1. Мокаем зависимости
jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/apb/client', () => ({
  apbClient: {
    processRefund: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/audit', () => ({
  withAdminAudit: jest.fn((config) => (handler: any) => async (...args: any[]) => {
    return await handler(...args);
  }),
}));

describe('Server Action: refundPaymentAction', () => {
  const mockBookingId = '123e4567-e89b-12d3-a456-426614174000';
  const mockPaidAt = new Date('2026-05-01T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    (apbClient.processRefund as jest.Mock).mockResolvedValue({ success: true });
    (prisma.booking.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  });

  // ==========================================
  // ТЕСТ 1: ВАЛИДАЦИЯ СУММЫ (Защита от овер-рефанда)
  // ==========================================
  it('должен отклонять возврат, если сумма превышает остаток (totalPrice - refundedAmount)', async () => {
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      id: mockBookingId,
      apbInvoiceId: 'INV-123',
      totalPrice: 1000,
      refundedAmount: 800,
      paidAt: mockPaidAt,
      status: 'confirmed', //   Исправлено на confirmed
    });

    await expect(refundPaymentAction({
      bookingId: mockBookingId,
      amount: 300, 
      reason: 'Ошибка'
    })).rejects.toThrow(/Максимально возможная сумма возврата/i);

    expect(apbClient.processRefund).not.toHaveBeenCalled();
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
  });

  // ==========================================
  // ТЕСТ 2: ОШИБКА ПРИ ОТСУТСТВИИ INVOICE ID
  // ==========================================
  it('должен выбрасывать ошибку, если у брони нет apbInvoiceId', async () => {
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      id: mockBookingId,
      apbInvoiceId: null,
      totalPrice: 1000,
      refundedAmount: 0,
      paidAt: mockPaidAt,
      status: 'confirmed', //   Исправлено на confirmed
    });

    await expect(refundPaymentAction({
      bookingId: mockBookingId,
      amount: 1000,
      reason: 'Отмена'
    })).rejects.toThrow(/не была оплачена через эквайринг АПБ/i);
  });

  // ==========================================
  // ТЕСТ 3: ПОЛНЫЙ ВОЗВРАТ (Смена статуса)
  // ==========================================
  it('должен делать полный возврат и менять статус на cancelled', async () => {
    const currentRefundedAmount = 200;
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      id: mockBookingId,
      apbInvoiceId: 'INV-123',
      totalPrice: 1000,
      refundedAmount: currentRefundedAmount,
      paidAt: mockPaidAt,
      status: 'confirmed', //   Исправлено на confirmed
    });

    const result = await refundPaymentAction({
      bookingId: mockBookingId,
      amount: 800,
      reason: 'Клиент заболел'
    });

    expect(apbClient.processRefund).toHaveBeenCalledWith('INV-123', 80000, mockPaidAt);

    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { 
        id: mockBookingId,
        refundedAmount: currentRefundedAmount 
      },
      data: {
        refundedAmount: 1000,
        status: 'cancelled', 
      },
    });

    expect(result).toEqual({ success: true, isFullRefund: true });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  // ==========================================
  // ТЕСТ 4: ЧАСТИЧНЫЙ ВОЗВРАТ (Статус сохраняется)
  // ==========================================
  it('должен делать частичный возврат и НЕ менять статус', async () => {
    const currentRefundedAmount = 0;
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      id: mockBookingId,
      apbInvoiceId: 'INV-123',
      totalPrice: 1000,
      refundedAmount: currentRefundedAmount,
      paidAt: mockPaidAt,
      status: 'confirmed', //   Исправлено на confirmed
    });

    const result = await refundPaymentAction({
      bookingId: mockBookingId,
      amount: 400,
      reason: 'Компенсация'
    });

    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { 
        id: mockBookingId,
        refundedAmount: currentRefundedAmount
      },
      data: {
        refundedAmount: 400,
        status: 'confirmed', //   Ожидаем сохранения статуса confirmed
      },
    });

    expect(result).toEqual({ success: true, isFullRefund: false });
  });

  // ==========================================
  // ТЕСТ 5: ОТКАЗ БАНКА
  // ==========================================
  it('не должен обновлять БД, если банк отклонил операцию возврата', async () => {
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      id: mockBookingId,
      apbInvoiceId: 'INV-123',
      totalPrice: 1000,
      refundedAmount: 0,
      paidAt: mockPaidAt,
      status: 'confirmed', //   Исправлено на confirmed
    });

    (apbClient.processRefund as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: 'Недостаточно средств на мерчант-счете' 
    });

    await expect(refundPaymentAction({
      bookingId: mockBookingId,
      amount: 1000,
      reason: 'Возврат'
    })).rejects.toThrow(/Недостаточно средств/i);

    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
  });

  // ==========================================
  // ТЕСТ 6: RACE CONDITION (Двойное списание)
  // ==========================================
  it('должен выбрасывать ошибку, если updateMany вернул count === 0 (гонка данных)', async () => {
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      id: mockBookingId,
      apbInvoiceId: 'INV-123',
      totalPrice: 1000,
      refundedAmount: 0,
      paidAt: mockPaidAt,
      status: 'confirmed', //   Исправлено на confirmed
    });

    (prisma.booking.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(refundPaymentAction({
      bookingId: mockBookingId,
      amount: 500,
      reason: 'Тест двойного клика'
    })).rejects.toThrow(/Сбой синхронизации с базой данных/i);
    
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { id: mockBookingId, refundedAmount: 0 },
      data: expect.any(Object),
    });
  });
});