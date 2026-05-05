// __tests__/integration/updateBookingStatus.test.ts

import { prisma } from '@/lib/prisma';
import { updateBookingStatusAction } from '@/features/admin/actions/bookingStatus';
import { NotificationHub } from '@/lib/notifications/hub';
import { notifyWaitlistOnSpotFreed } from '@/lib/telegram/notify';

// ─── Тип результата экшена ───────────────────────────────────────────────────
type ActionResult = { success: true } | { success: false; error: string };

// ─── Моки ────────────────────────────────────────────────────────────────────
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
  sendToTelegram: jest.fn(),
  publishToTelegram: jest.fn(),
  sendToUserTelegramAdvanced: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/notifications/hub', () => ({
  NotificationHub: { dispatch: jest.fn() },
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

  // Второй тур — без tourDate, для теста 4
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

  // tourDate: из 10 мест 5 уже занято (spotsLeft = 5)
  const tourDate = await prisma.tourDate.create({
    data: {
      tourId: tour.id,
      startDate: new Date(Date.now() + 86400000),
      spots: 10,
      spotsLeft: 5,
    },
  });

  // Участник клуба — нужен для проверки NotificationHub
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

// ─── Тесты ───────────────────────────────────────────────────────────────────

describe('updateBookingStatusAction – интеграционные тесты', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 1: moderation → confirmed
  // Менеджер подтверждает оплату. Места НЕ меняются.
  // Участнику отправляется BOOKING_CONFIRMED.
  // ─────────────────────────────────────────────────────────────────────────
  it('переводит бронь moderation → confirmed, отправляет BOOKING_CONFIRMED участнику', async () => {
    const { tour, tourDate, member } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
       shortId: 'A501',
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

    // ИСПРАВЛЕНО: два позиционных аргумента, не объект
   const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'confirmed'
    })) as ActionResult;

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated!.status).toBe('confirmed');

    // Места НЕ изменились — клиент их занимал до подтверждения
    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(updatedDate!.spotsLeft).toBe(5);

    // NotificationHub вызван с правильным eventId
    expect(NotificationHub.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'BOOKING_CONFIRMED',
        memberId: member.id,
      })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 2: moderation → rejected (отклонение чека)
  // В коде: newStatus === 'rejected' → eventId = 'PAYMENT_REJECTED'
  //
  // ВАЖНО: 'awaiting_payment' → eventId = 'BOOKING_CREATED' (не PAYMENT_REJECTED).
  // rejectReason и сброс createdAt — в коде НЕ реализованы в updateBookingStatusAction.
  // Функция пишет только { status: newStatus }. Если нужно — добавить в код.
  // ─────────────────────────────────────────────────────────────────────────
  it('отклоняет чек (moderation → rejected) и отправляет PAYMENT_REJECTED участнику', async () => {
    const { tour, tourDate, member } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
        shortId: 'A502',
        tourId: tour.id,
        tourDateId: tourDate.id,
        memberId: member.id,
        name: 'Анна Сидорова',
        phone: '+37377722222',
        ticketsAdult: 1,
        totalPrice: 1000,
        status: 'moderation',
        paymentMethod: 'qr',
      },
    });

    // ИСПРАВЛЕНО: правильный переход — 'rejected', а не 'awaiting_payment'
    // При rejected → PAYMENT_REJECTED. При awaiting_payment → BOOKING_CREATED (другой сценарий).
const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'rejected'
    })) as ActionResult;

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated!.status).toBe('rejected');

    // Места НЕ меняются — rejected не освобождает места
    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(updatedDate!.spotsLeft).toBe(5);

    // ИСПРАВЛЕНО: PAYMENT_REJECTED — правильный eventId для rejected
    expect(NotificationHub.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'PAYMENT_REJECTED',
        memberId: member.id,
      })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 3: awaiting_payment → cancelled (с tourDate)
  // Места возвращаются в tourDate. Вейтлист уведомляется.
  // ─────────────────────────────────────────────────────────────────────────
  it('отменяет бронь (awaiting_payment → cancelled) и возвращает места в tourDate', async () => {
    const { tour, tourDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
         shortId: 'A503',
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
      newStatus: 'cancelled'
    })) as ActionResult;

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated!.status).toBe('cancelled');

    // КЛЮЧЕВАЯ ПРОВЕРКА: было 5 свободных мест, вернули 3 → 8
    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(updatedDate!.spotsLeft).toBe(8);

    // Вейтлист уведомлён о свободных местах
    expect(notifyWaitlistOnSpotFreed).toHaveBeenCalledWith(tour.id, tourDate.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 4: отмена брони БЕЗ tourDateId
  // Места возвращаются в Tour.spotsLeft (ветка else в коде).
  // ─────────────────────────────────────────────────────────────────────────
  it('отменяет бронь БЕЗ tourDateId и возвращает места в Tour.spotsLeft', async () => {
    const { tourWithoutDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
         shortId: 'A504',
        tourId: tourWithoutDate.id,
        tourDateId: null,
        name: 'Мария Козлова',
        phone: '+37377744444',
        ticketsAdult: 2,
        ticketsChild: 1, // итого 3 места
        totalPrice: 5000,
        status: 'pending',
        paymentMethod: 'cash',
      },
    });

    const tourBefore = await prisma.tour.findUnique({ where: { id: tourWithoutDate.id } });
    expect(tourBefore!.spotsLeft).toBe(20);

  const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'cancelled'
    })) as ActionResult;


    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);

    // КЛЮЧЕВАЯ ПРОВЕРКА: 20 + 3 (2 взрослых + 1 ребёнок) = 23
    const tourAfter = await prisma.tour.findUnique({ where: { id: tourWithoutDate.id } });
    expect(tourAfter!.spotsLeft).toBe(23);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 5: защита от двойной отмены (cancelled → cancelled)
  // Условие в коде: newStatus === 'cancelled' && current.status !== 'cancelled'
  // Если бронь уже отменена — места НЕ возвращаются повторно.
  // ─────────────────────────────────────────────────────────────────────────
  it('не возвращает места повторно если бронь уже была cancelled', async () => {
    const { tour, tourDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
          shortId: 'A505',
        tourId: tour.id,
        tourDateId: tourDate.id,
        name: 'Олег Смирнов',
        phone: '+37377755555',
        ticketsAdult: 2,
        totalPrice: 2000,
        status: 'cancelled', // уже отменена
        paymentMethod: 'cash',
      },
    });

    const dateBefore = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(dateBefore!.spotsLeft).toBe(5);

 const result = (await updateBookingStatusAction({
      bookingId: booking.id,
      newStatus: 'cancelled'
    })) as ActionResult;

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);

    // КЛЮЧЕВАЯ ПРОВЕРКА: spotsLeft не изменился
    const dateAfter = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(dateAfter!.spotsLeft).toBe(5);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ТЕСТ 6: реактивация cancelled → confirmed
  // Менеджер вернул отменённую бронь — места СПИСЫВАЮТСЯ заново.
  // Условие в коде: current.status === 'cancelled' && newStatus !== 'cancelled'
  // ─────────────────────────────────────────────────────────────────────────
  it('реактивирует отменённую бронь (cancelled → confirmed) и списывает места заново', async () => {
    const { tour, tourDate } = await createTestFixtures();

    const booking = await prisma.booking.create({
      data: {
         shortId: 'A506',
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
      newStatus: 'confirmed' //   ИСПРАВЛЕНО НА CONFIRMED
    })) as ActionResult;

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);

    const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updatedBooking!.status).toBe('confirmed');

    // КЛЮЧЕВАЯ ПРОВЕРКА: было 5 мест, списали 2 → 3
    const dateAfter = await prisma.tourDate.findUnique({ where: { id: tourDate.id } });
    expect(dateAfter!.spotsLeft).toBe(3);
  });
});