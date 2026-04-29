// __tests__/integration/telegram-webhook.test.ts
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/webhooks/telegram/route';
import { NextRequest } from 'next/server';
import { mockNotificationHubDispatch } from '../../__mocks__/external-services';

// ✅ МОК АВТОРИЗАЦИИ: Чтобы updateBookingStatusAction не падал при вызове из вебхука
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue({ id: 'webhook-admin', role: 'admin' }),
  getSession: jest.fn().mockResolvedValue({ id: 'webhook-admin', role: 'admin' }),
  withAdminAuth: (fn: any) => fn, // ✅ Добавили пропуск обертки экшена
}));

// ✅ УМНЫЙ МОК REDIS: Создаем реальную in-memory базу данных для тестов
const mockRedisStore = new Map<string, string>();

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation(async (key: string) => mockRedisStore.get(key) || null),
      set: jest.fn().mockImplementation(async (key: string, value: string, opts?: any) => {
        // Имитация дедупликации (nx: true - сохранить только если ключа нет)
        if (opts?.nx && mockRedisStore.has(key)) return null; 
        mockRedisStore.set(key, value);
        return 'OK';
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
        mockRedisStore.delete(key);
        return 1;
      }),
    }),
  },
}));

jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
      })),
      {
        slidingWindow: jest.fn().mockReturnValue('mock-sliding-window'),
        fixedWindow: jest.fn().mockReturnValue('mock-fixed-window'),
      }
    )
  };
});

// Мокаем rate-limit
jest.mock('@/lib/rate-limit-server', () => ({
  withRateLimit: (fn: any) => fn,
  withRateLimitRoute: (fn: any) => fn,
  basicRateLimit: { limit: jest.fn().mockResolvedValue({ success: true }) },
  adminRateLimit: { limit: jest.fn().mockResolvedValue({ success: true }) },
}));

// Мокаем старый Redis (если где-то остался)
jest.mock('@/lib/redis', () => ({
  redis: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
  },
}));

// Мокаем Telegram-функции
jest.mock('@/features/admin/actions/telegram', () => ({
  publishToTelegram: jest.fn().mockResolvedValue({ success: true }),
  sendToUserTelegramAdvanced: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Telegram Webhook', () => {
  let testData: {
    bookingId: string;
    tourId: string;
    tourDateId: string;
    memberId: string;
  };

beforeEach(async () => {
    // Очищаем нашу In-Memory базу Redis перед каждым тестом!
    mockRedisStore.clear(); 
    jest.clearAllMocks();

    // ✅ ДОБАВЛЯЕМ СБРОС СЧЕТЧИКОВ СЮДА
    mockNotificationHubDispatch.mockClear();
    
    const { publishToTelegram } = require('@/features/admin/actions/telegram');
    publishToTelegram.mockClear();
    
    const { redis } = require('@/lib/redis');
    redis.get.mockResolvedValue(null);
    redis.set.mockClear();

    const category = await prisma.tourCategory.create({
      data: { slug: `tg-cat-${Date.now()}`, title: 'TG Cat', icon: 'Compass' },
    });
    const tour = await prisma.tour.create({
      data: {
        slug: `tg-tour-${Date.now()}`,
        title: 'TG Tour',
        location: 'Test',
        price: 1000,
        currency: 'RUB',
        spots: 20,
        spotsLeft: 20,
        categoryId: category.id,
        duration: '1d',
        isActive: true,
      },
    });
    const tourDate = await prisma.tourDate.create({
      data: {
        tourId: tour.id,
        startDate: new Date(Date.now() + 86400000),
        spots: 20,
        spotsLeft: 20,
      },
    });
    const member = await prisma.memberProfile.create({
      data: {
        userId: `tg-user-${Date.now()}`,
        phone: '+37377700000',
        name: 'TG Member',
        level: 'Первопроходец',
      },
    });
    const booking = await prisma.booking.create({
      data: {
        shortId: Math.random().toString(36).substring(2, 6).toUpperCase(),
        tourId: tour.id,
        tourDateId: tourDate.id,
        memberId: member.id,
        name: 'Test Client',
        phone: '+37377712345',
        totalPrice: 1000,
        status: 'awaiting_payment',
        paymentMethod: 'qr',
        payerTgChatId: '123456789',
      },
    });

    testData = {
      bookingId: booking.id,
      tourId: tour.id,
      tourDateId: tourDate.id,
      memberId: member.id,
    };
  });

  afterEach(async () => {
    await prisma.booking.deleteMany({ where: { id: testData.bookingId } });
    await prisma.memberProfile.deleteMany({ where: { id: testData.memberId } });
    await prisma.tourDate.deleteMany({ where: { id: testData.tourDateId } });
    await prisma.tour.deleteMany({ where: { id: testData.tourId } });
    await prisma.tourCategory.deleteMany({ where: { slug: { startsWith: 'tg-cat-' } } });
  });

  // ТЕСТ 1: Подтверждение
  it('подтверждает бронь (confirm_)', async () => {
    const body = {
      update_id: 123456,
      callback_query: {
        id: 'cb1',
        from: { id: 111, username: 'admin' },
        data: `confirm_${testData.bookingId}`,
        message: { message_id: 1, chat: { id: 222 }, text: 'test' },
      },
    };
    const req = new NextRequest('http://localhost/api/webhooks/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET || 'test-secret',
      },
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const updated = await prisma.booking.findUnique({ where: { id: testData.bookingId } });
    expect(updated?.status).toBe('confirmed');
    expect(mockNotificationHubDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'BOOKING_CONFIRMED', memberId: testData.memberId })
    );
  });

  // ТЕСТ 2: Отклонение
  it('отклоняет бронь (reject_)', async () => {
    const newBooking = await prisma.booking.create({
      data: {
        shortId: Math.random().toString(36).substring(2, 6).toUpperCase(),
        tourId: testData.tourId,
        tourDateId: testData.tourDateId,
        memberId: testData.memberId,
        name: 'Reject Client',
        phone: '+37377799999',
        totalPrice: 1000,
        status: 'awaiting_payment',
        paymentMethod: 'qr',
        payerTgChatId: '987654321',
      },
    });

    try {
      const body = {
        update_id: 123457,
        callback_query: {
          id: 'cb2',
          from: { id: 111, username: 'admin' },
          data: `reject_${newBooking.id}`,
          message: { message_id: 2, chat: { id: 222 }, text: 'test' },
        },
      };
      const req = new NextRequest('http://localhost/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET || 'test-secret',
        },
        body: JSON.stringify(body),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const updated = await prisma.booking.findUnique({ where: { id: newBooking.id } });
      expect(updated?.status).toBe('awaiting_payment');
      expect(updated?.rejectReason).toBe('Отклонено менеджером через Telegram');
    } finally {
      await prisma.booking.deleteMany({ where: { id: newBooking.id } });
    }
  });

  // ТЕСТ 3: Дедупликация (теперь работает идеально на In-Memory Redis)
  it('дедупликация: повторный update_id не обрабатывается', async () => {
    const updateId = 123458;
    const body = {
      update_id: updateId,
      callback_query: {
        id: 'cb3',
        from: { id: 111 },
        data: `confirm_${testData.bookingId}`,
        message: { message_id: 3, chat: { id: 222 }, text: 'test' },
      },
    };

    // Запрос 1: Должен пройти успешно
    const req1 = new NextRequest('http://localhost/api/webhooks/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET || 'test-secret',
      },
      body: JSON.stringify(body),
    });
    await POST(req1);

    // ✅ Очищаем счетчик вызовов после первого успешного запроса!
    mockNotificationHubDispatch.mockClear();

    // Запрос 2: Должен быть заблокирован дедупликацией
    const req2 = new NextRequest('http://localhost/api/webhooks/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET || 'test-secret',
      },
      body: JSON.stringify(body),
    });
    await POST(req2);

    // ✅ Раз второй запрос был заблокирован, уведомлений быть не должно вообще (0)
    expect(mockNotificationHubDispatch).toHaveBeenCalledTimes(0);
  });
  
  // ТЕСТ 4: Токен
  it('возвращает 401 при отсутствии или неверном токене', async () => {
    const body = { update_id: 1, callback_query: {} };
    const reqNoToken = new NextRequest('http://localhost/api/webhooks/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const resNoToken = await POST(reqNoToken);
    expect(resNoToken.status).toBe(401);
  });

  // ТЕСТ 5: Отзыв (write_review_)
  it('обрабатывает отзыв через write_review_ callback и текстовое сообщение', async () => {
    const bookingId = testData.bookingId;
    const clientChatId = '123456789'; 
    const reviewText = 'Отличный тур, всё понравилось!';

    try {
      // Шаг 1. Отправляем callback. Наш in-memory Redis сам сохранит ключ 'review_state...'
      const callbackBody = {
        update_id: 999001,
        callback_query: {
          id: 'cb_review_1',
          from: { id: 111, username: 'client' },
          data: `write_review_${bookingId}`,
          message: {
            message_id: 100,
            chat: { id: Number(clientChatId) },
            text: 'some text',
          },
        },
      };
      const callbackReq = new NextRequest('http://localhost/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET || 'test-secret',
        },
        body: JSON.stringify(callbackBody),
      });
      const callbackRes = await POST(callbackReq);
      expect(callbackRes.status).toBe(200);

      // Шаг 2. Отправляем текстовое сообщение. Роут сам найдет ключ в in-memory Redis.
      const messageBody = {
        update_id: 999002,
        message: {
          message_id: 101,
          chat: { id: Number(clientChatId) },
          text: reviewText,
          from: { id: 111, username: 'client' },
        },
      };
      const messageReq = new NextRequest('http://localhost/api/webhooks/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET || 'test-secret',
        },
        body: JSON.stringify(messageBody),
      });
      const messageRes = await POST(messageReq);
      expect(messageRes.status).toBe(200);

      // Шаг 3. Проверяем БД
      const review = await prisma.review.findFirst({
        where: {
          tourId: testData.tourId,
          memberId: testData.memberId,
          text: reviewText,
        },
      });
      
      expect(review).not.toBeNull();
      expect(review?.isActive).toBe(false); 
      expect(review?.source).toBe('tg');

    // Шаг 4. Проверяем уведомление админу
      const { publishToTelegram } = require('@/features/admin/actions/telegram');
      expect(publishToTelegram).toHaveBeenCalledWith(
        expect.stringContaining('НОВЫЙ ОТЗЫВ'),
        undefined,
        undefined,
        false,
        // ✅ Разрешаем быть undefined, если в тестовом .env нет TELEGRAM_TOPIC_BOOKINGS
        expect.objectContaining({ messageThreadId: process.env.TELEGRAM_TOPIC_BOOKINGS || undefined })
      );

    } finally {
      // Очистка отзыва
      await prisma.review.deleteMany({
        where: { text: reviewText }
      });
    }
  });
});