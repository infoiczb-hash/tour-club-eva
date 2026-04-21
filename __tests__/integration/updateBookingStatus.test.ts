// __tests__/integration/updateBookingStatus.test.ts

import { prisma } from '@/lib/prisma';
import { updateBookingStatusAction } from '@/features/admin/actions/bookingStatus';
import {
  mockNotificationHubDispatch,
  mockSendToTelegram,
  mockResendEmailsSend,
} from '../../__mocks__/external-services';

// ─── Определяем тип результата экшена ───────────────────────────────────────
type ActionResult = { success: true } | { success: false; error: string };

// ─── Моки (без изменений) ───────────────────────────────────────────────────
jest.mock('@/lib/auth', () => ({
  withAdminAuth: (fn: (...args: unknown[]) => unknown) => fn,
  requireAuth: jest.fn().mockResolvedValue({ id: 'admin-user-id' }),
}));

jest.mock('@/lib/audit', () => ({
  withAdminAudit: () => (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('@/lib/telegram/notify', () => ({
  notifyWaitlistOnSpotFreed: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/features/admin/actions/telegram', () => ({
  sendToTelegram: mockSendToTelegram,
  publishToTelegram: mockSendToTelegram,
  sendToUserTelegramAdvanced: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/notifications/hub', () => ({
  NotificationHub: { dispatch: mockNotificationHubDispatch },
}));

// ─── Вспомогательная функция создания тестовых данных ────────────────────────
async function createTestFixtures() {
  const category = await prisma.tourCategory.create({
    data: { slug: 'status-test-cat-' + Date.now(), title: 'Test', icon: 'Compass' },
  });

  const tour = await prisma.tour.create({
    data: {
      slug: 'status-test-tour-' + Date.now(),
      title: 'Тур для тестов статусов',
      location: 'Лес',
      price: 1000,
      spots: 50,
      spotsLeft: 50,
      categoryId: category.id,
      duration: '1 день',
      isActive: true,
    },
  });

  const tourWithoutDate = await prisma.tour.create({
    data: {
      slug: 'no-date-tour-' + Date.now(),
      title: 'Тур без даты',
      location: 'Горы',
      price: 2000,
      spots: 20,
      spotsLeft: 20,
      categoryId: category.id,
      duration: '2 дня',
      isActive: true,
    },
  });

  const tourDate = await prisma.tourDate.create({
    data: {
      tourId: tour.id,
      startDate: new Date(Date.now() + 86400000),
      spots: 10,
      spotsLeft: 5,
    },
  });

  const member = await prisma.memberProfile.create({
    data: {
      userId: 'admin-test-user-' + Date.now(),
      phone: '+37377788888',
      name: 'Тестовый участник',
      level: 'Первопроходец',
      balance: 0,
    },
  });

  return { tour, tourWithoutDate, tourDate, member };
}

describe('updateBookingStatusAction – интеграционные тесты', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    console.log('\n🧹 Очистка моков перед тестом');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 1: moderation → confirmed
  // ─────────────────────────────────────────────────────────────────────────
  it('переводит бронь moderation → confirmed, отправляет BOOKING_CONFIRMED участнику', async () => {
    console.log('\n📌 [ТЕСТ 1] moderation → confirmed');
    const { tour, tourDate, member } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
        shortId: 501,
        tourId: tour.id,
        tourDateId: tourDate.id,
        memberId: member.id,
        name: 'Иван Петров',
        phone: '+37377711111',
        ticketsAdult: 2,
        totalPrice: 2000,
        status: 'moderation',
        paymentMethod: 'qr',
      },
    });

    // ✅ Ключевое исправление: явное приведение типа
    const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'confirmed',
      adminName: 'admin',
    })) as ActionResult;

    if (!result.success) throw new Error('Expected success');

    expect(result.success).toBe(true);

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated!.status).toBe('confirmed');
    expect(updated!.confirmedBy).toBe('admin');
    expect(updated!.confirmedAt).not.toBeNull();

    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(updatedDate!.spotsLeft).toBe(5);

    expect(mockNotificationHubDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'BOOKING_CONFIRMED',
        memberId: member.id,
      })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 2: moderation → awaiting_payment (отклонение чека)
  // ─────────────────────────────────────────────────────────────────────────
  it('отклоняет чек (moderation → awaiting_payment), сохраняет rejectReason и обновляет createdAt', async () => {
    console.log('\n📌 [ТЕСТ 2] moderation → awaiting_payment');
    const { tour, tourDate, member } = await createTestFixtures();
    const oldDate = new Date(Date.now() - 10 * 60 * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        shortId: 502,
        tourId: tour.id,
        tourDateId: tourDate.id,
        memberId: member.id,
        name: 'Анна Сидорова',
        phone: '+37377722222',
        ticketsAdult: 1,
        totalPrice: 1000,
        status: 'moderation',
        paymentMethod: 'qr',
        createdAt: oldDate,
      },
    });

    const rejectReason = 'Скриншот нечитаемый, отправьте заново';
    const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'awaiting_payment',
      rejectReason,
      adminName: 'admin',
    })) as ActionResult;

    if (!result.success) throw new Error('Expected success');

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated!.status).toBe('awaiting_payment');
    expect(updated!.rejectReason).toBe(rejectReason);
    expect(updated!.createdAt.getTime()).toBeGreaterThan(oldDate.getTime());

    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(updatedDate!.spotsLeft).toBe(5);

    expect(mockNotificationHubDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'PAYMENT_REJECTED' })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 3: awaiting_payment → cancelled (с tourDate)
  // ─────────────────────────────────────────────────────────────────────────
  it('отменяет бронь (awaiting_payment → cancelled) и возвращает места в tourDate', async () => {
    console.log('\n📌 [ТЕСТ 3] awaiting_payment → cancelled');
    const { tour, tourDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
        shortId: 503,
        tourId: tour.id,
        tourDateId: tourDate.id,
        name: 'Пётр Иванов',
        phone: '+37377733333',
        ticketsAdult: 3,
        totalPrice: 3000,
        status: 'awaiting_payment',
        paymentMethod: 'biletpmr',
      },
    });

    const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'cancelled',
    })) as ActionResult;

    if (!result.success) throw new Error('Expected success');

    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(updatedDate!.spotsLeft).toBe(8); // 5 + 3 = 8

    const { notifyWaitlistOnSpotFreed } = require('@/lib/telegram/notify');
    expect(notifyWaitlistOnSpotFreed).toHaveBeenCalledWith(tour.id, tourDate.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 4: cancelled для тура БЕЗ tourDateId
  // ─────────────────────────────────────────────────────────────────────────
  it('отменяет бронь БЕЗ tourDateId и возвращает места в Tour.spotsLeft', async () => {
    console.log('\n📌 [ТЕСТ 4] Отмена брони без даты');
    const { tourWithoutDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
        shortId: 504,
        tourId: tourWithoutDate.id,
        tourDateId: null,
        name: 'Мария Козлова',
        phone: '+37377744444',
        ticketsAdult: 2,
        ticketsChild: 1,
        totalPrice: 5000,
        status: 'pending',
        paymentMethod: 'cash',
      },
    });

    const tourBefore = await prisma.tour.findUnique({ where: { id: tourWithoutDate.id } });
    expect(tourBefore!.spotsLeft).toBe(20);

    const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'cancelled',
    })) as ActionResult;

    if (!result.success) throw new Error('Expected success');

    const tourAfter = await prisma.tour.findUnique({ where: { id: tourWithoutDate.id } });
    expect(tourAfter!.spotsLeft).toBe(23);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 5: защита от двойной отмены (cancelled → cancelled)
  // ─────────────────────────────────────────────────────────────────────────
  it('не возвращает места повторно если бронь уже была cancelled', async () => {
    console.log('\n📌 [ТЕСТ 5] Защита от двойной отмены');
    const { tour, tourDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
        shortId: 505,
        tourId: tour.id,
        tourDateId: tourDate.id,
        name: 'Олег Смирнов',
        phone: '+37377755555',
        ticketsAdult: 2,
        totalPrice: 2000,
        status: 'cancelled',
        paymentMethod: 'cash',
      },
    });

    const dateBefore = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(dateBefore!.spotsLeft).toBe(5);

    const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'cancelled',
    })) as ActionResult;

    if (!result.success) throw new Error('Expected success');

    const dateAfter = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(dateAfter!.spotsLeft).toBe(5);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 6: реактивация cancelled → confirmed (списывает места)
  // ─────────────────────────────────────────────────────────────────────────
  it('реактивирует отменённую бронь (cancelled → confirmed) и списывает места заново', async () => {
    console.log('\n📌 [ТЕСТ 6] Реактивация cancelled → confirmed');
    const { tour, tourDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
        shortId: 506,
        tourId: tour.id,
        tourDateId: tourDate.id,
        name: 'Светлана Орлова',
        phone: '+37377766666',
        ticketsAdult: 2,
        totalPrice: 2000,
        status: 'cancelled',
        paymentMethod: 'cash',
      },
    });

    const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'confirmed',
    })) as ActionResult;

    if (!result.success) throw new Error('Expected success');

    const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updatedBooking!.status).toBe('confirmed');

    const dateAfter = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(dateAfter!.spotsLeft).toBe(3); // 5 - 2 = 3
  });
});