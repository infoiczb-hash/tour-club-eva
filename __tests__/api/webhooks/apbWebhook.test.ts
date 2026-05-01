// __tests__/api/webhooks/apbWebhook.test.ts
import { POST } from '@/app/api/webhooks/apb/route'; // Путь к твоему route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apbClient } from '@/lib/apb/client';
import { logSystemAction } from '@/lib/audit';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { NotificationHub } from '@/lib/notifications/hub';
import { revalidatePath } from 'next/cache';

// --- 1. МОКАЕМ ВСЕ ЗАВИСИМОСТИ ---
jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/apb/client', () => ({
  apbClient: {
    verifyWebhookSignature: jest.fn(),
    getPaymentState: jest.fn(),
  },
}));

jest.mock('@/lib/audit', () => ({ logSystemAction: jest.fn() }));
jest.mock('@/features/admin/actions/telegram', () => ({ publishToTelegram: jest.fn() }));
jest.mock('@/lib/notifications/hub', () => ({ NotificationHub: { dispatch: jest.fn() } }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

describe('API Route: APB Webhook (/api/webhooks/apb)', () => {
  const mockBooking = {
    id: 'booking-123',
    shortId: 'B-123',
    apbInvoiceId: 'INV-777',
    totalPrice: 1500, // В рублях. В копейках = 150000
    status: 'awaiting_payment',
    memberId: 'user-1',
    name: 'Иван',
    phone: '+37377700000',
    tour: { title: 'Тур на Днестр', slug: 'dnestr', currency: 'RUB' },
  };

  const createWebhookRequest = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return new NextRequest('http://localhost/api/webhooks/apb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: searchParams.toString(),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Дефолтные моки (успешный сценарий)
    (apbClient.verifyWebhookSignature as jest.Mock).mockReturnValue(true);
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
    (apbClient.getPaymentState as jest.Mock).mockResolvedValue({
      isPaid: true,
      sum: 150000, // 1500 рублей * 100
      rrn: 'RRN12345',
      authCode: 'AUTH99',
      lastDigits: '4321',
      paidAt: new Date('2026-05-01T12:00:00Z'),
    });
  });

  // ==========================================
  // ТЕСТ 1: ВАЛИДАЦИЯ ПОДПИСИ (MD5)
  // ==========================================
  it('должен блокировать запрос с неверной подписью и логировать это', async () => {
    (apbClient.verifyWebhookSignature as jest.Mock).mockReturnValue(false);

    const req = createWebhookRequest({ invoiceid: 'INV-777', status: 'paid', signature: 'bad_hash' });
    const response = await POST(req);

    // Вебхук всегда должен возвращать 200 OK банку, чтобы тот не спамил ретраями
    expect(response.status).toBe(200); 
    expect(logSystemAction).toHaveBeenCalledWith('APB_WEBHOOK_INVALID_SIGNATURE', expect.any(Object));
    expect(prisma.booking.findUnique).not.toHaveBeenCalled(); // До базы не дошли
  });

  // ==========================================
  // ТЕСТ 2: ЗАЩИТА ОТ ДВОЙНОГО ПОДТВЕРЖДЕНИЯ (Idempotency)
  // ==========================================
  it('должен игнорировать вебхук, если бронь уже в статусе confirmed', async () => {
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      ...mockBooking,
      status: 'confirmed', // Уже подтверждена
    });

    const req = createWebhookRequest({ invoiceid: 'INV-777', status: 'paid', signature: 'valid_hash' });
    await POST(req);

    // Не делаем лишних SOAP-запросов к банку, если уже подтвердили
    expect(apbClient.getPaymentState).not.toHaveBeenCalled();
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  // ==========================================
  // ТЕСТ 3: ЗАЩИТА ОТ FRAUD (Подмена суммы)
  // ==========================================
  it('должен блокировать оплату, если сумма банка не совпадает с totalPrice', async () => {
    (apbClient.getPaymentState as jest.Mock).mockResolvedValue({
      isPaid: true,
      sum: 1000, // Хакер оплатил 10 рублей (1000 копеек) вместо 1500 руб!
    });

    const req = createWebhookRequest({ invoiceid: 'INV-777', status: 'paid', signature: 'valid_hash' });
    await POST(req);

    expect(logSystemAction).toHaveBeenCalledWith('APB_PAYMENT_FRAUD_AMOUNT', expect.objectContaining({
      changes: { expected: 150000, actual: 1000 }
    }));
    expect(prisma.booking.update).not.toHaveBeenCalled(); // Бронь не подтверждается
  });

  // ==========================================
  // ТЕСТ 4: ОБРАБОТКА СТАТУСА FAIL
  // ==========================================
  it('не должен подтверждать бронь при статусе fail, но должен уведомить клиента при stateCode=4 (просрочен)', async () => {
    (apbClient.getPaymentState as jest.Mock).mockResolvedValue({
      isPaid: false,
      stateCode: 4, // Просрочено
      stateDescription: 'Время ожидания оплаты истекло'
    });

    const req = createWebhookRequest({ invoiceid: 'INV-777', status: 'fail', signature: 'valid_hash' });
    await POST(req);

    // Бронь НЕ обновляется (остается awaiting_payment)
    expect(prisma.booking.update).not.toHaveBeenCalled();
    
    // Логируется правильное событие (исправлено в исходнике)
    expect(logSystemAction).toHaveBeenCalledWith('APB_PAYMENT_FAILED', expect.any(Object));

    // Клиенту летит уведомление, что время вышло
    expect(NotificationHub.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'PAYMENT_REJECTED',
      memberId: mockBooking.memberId
    }));
  });

  // ==========================================
  // ТЕСТ 5: ПОЛНЫЙ УСПЕШНЫЙ ЦИКЛ (Happy Path)
  // ==========================================
  it('должен подтвердить бронь, разослать уведомления и сбросить кэш', async () => {
    const req = createWebhookRequest({ invoiceid: 'INV-777', status: 'paid', signature: 'valid_hash' });
    const response = await POST(req);

    expect(response.status).toBe(200);

    // 1. Атомарное обновление базы
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: mockBooking.id },
      data: expect.objectContaining({
        status: 'confirmed',
        apbRrn: 'RRN12345',
        apbAuthCode: 'AUTH99',
        amountPaid: 1500,
        confirmedBy: 'APB_AUTO',
      }),
    });

    // 2. Лог аудита
    expect(logSystemAction).toHaveBeenCalledWith('APB_PAYMENT_CONFIRMED', expect.any(Object));

    // 3. Сообщение в Telegram-топик
    expect(publishToTelegram).toHaveBeenCalledWith(
      expect.stringContaining('Онлайн-оплата подтверждена'),
      undefined,
      undefined,
      false,
      { messageThreadId: expect.any(String) }
    );

    // 4. Уведомление клиенту (in-app hub)
    expect(NotificationHub.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'BOOKING_CONFIRMED',
      memberId: mockBooking.memberId,
      data: expect.objectContaining({ shortId: mockBooking.shortId })
    }));

    // 5. Инвалидация кэша
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(revalidatePath).toHaveBeenCalledWith('/account/bookings');
    expect(revalidatePath).toHaveBeenCalledWith(`/tour/${mockBooking.tour.slug}`);
  });
});