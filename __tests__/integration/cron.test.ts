// __tests__/integration/cron.test.ts
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// ─────────────────────────────────────────────
// МОКИ
// ─────────────────────────────────────────────

const mockRedisGet = jest.fn().mockResolvedValue(null);
const mockRedisSet = jest.fn().mockResolvedValue('OK');
const mockRedisDel = jest.fn().mockResolvedValue(1);

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn().mockReturnValue({
      get: mockRedisGet,
      set: mockRedisSet,
      del: mockRedisDel,
    }),
  },
}));

jest.mock('@upstash/qstash/nextjs', () => ({
  verifySignatureAppRouter: (fn: any) => fn,
}));

const mockDispatch = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/notifications/hub', () => ({
  NotificationHub: { dispatch: mockDispatch },
}));

const mockSendTelegramMessage = jest.fn().mockResolvedValue({ ok: true });
const mockNotifyWaitlist = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/telegram/notify', () => ({
  sendTelegramMessage: mockSendTelegramMessage,
  notifyWaitlistOnSpotFreed: mockNotifyWaitlist,
}));

const mockSendToUserTelegramAdvanced = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/features/admin/actions/telegram', () => ({
  sendToUserTelegramAdvanced: mockSendToUserTelegramAdvanced,
}));

const mockLogSystemAction = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/audit', () => ({
  logSystemAction: mockLogSystemAction,
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

// ─────────────────────────────────────────────
// ХЕЛПЕРЫ ВРЕМЕНИ (Синхронизация локальной таймзоны с Prisma)
// ─────────────────────────────────────────────
function daysOffset(days: number): Date {
  // 1. Эмулируем логику роута (начало суток в твоем локальном времени EEST)
  const localMidnight = new Date();
  localMidnight.setDate(localMidnight.getDate() + days);
  localMidnight.setHours(0, 0, 0, 0);

  // 2. Prisma обрезает время по UTC. Смотрим, какой день получился по UTC 
  // (Для EEST это будет на 1 день раньше локального!)
  const year = localMidnight.getUTCFullYear();
  const month = String(localMidnight.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localMidnight.getUTCDate()).padStart(2, '0');

  // 3. Возвращаем эту смещенную дату в полдень, чтобы база и роут "сошлись"
  return new Date(`${year}-${month}-${day}T12:00:00.000Z`);
}

const yesterday = () => daysOffset(-1);
const tomorrow = () => daysOffset(1);
const in3Days = () => daysOffset(3);
const fiveDaysAgo = () => daysOffset(-5);
const ninetyDaysAgo = () => daysOffset(-90);
const sevenDaysAgo = () => daysOffset(-7);

// ─────────────────────────────────────────────
// ХЕЛПЕРЫ ДЛЯ СОЗДАНИЯ ЗАПРОСОВ
// ─────────────────────────────────────────────
const CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret';

function makeRequest(url: string, withAuth = true): Request {
  return new Request(url, {
    method: 'GET',
    headers: withAuth ? { authorization: `Bearer ${CRON_SECRET}` } : {},
  });
}

// ─────────────────────────────────────────────
// ФАБРИКИ ТЕСТОВЫХ ДАННЫХ
// ─────────────────────────────────────────────
async function createTourWithDate(overrides: { startDate?: Date; endDate?: Date | null; isActive?: boolean } = {}) {
  const slug = `cron-tour-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const category = await prisma.tourCategory.create({
    data: { slug: `cat-${slug}`, title: 'Test Cat', icon: 'Compass' },
  });
  const tour = await prisma.tour.create({
    data: {
      slug,
      title: 'Cron Test Tour',
      location: 'Test',
      price: 500,
      currency: 'RUB',
      spots: 10,
      spotsLeft: 10,
      categoryId: category.id,
      duration: '1d',
      isActive: overrides.isActive ?? true,
    },
  });
  const tourDate = await prisma.tourDate.create({
    data: {
      tourId: tour.id,
      startDate: overrides.startDate ?? tomorrow(),
      endDate: overrides.endDate !== undefined ? overrides.endDate : null,
      spots: 10,
      spotsLeft: 10,
    },
  });
  return { tour, tourDate, category };
}

async function createMember(suffix?: string) {
  const id = `${Date.now()}${suffix ?? ''}`;
  return prisma.memberProfile.create({
    data: {
      userId: `cron-user-${id}`,
      phone: `+3730000${id.slice(-4)}`,
      name: 'Cron Member',
      level: 'Первопроходец',
      balance: 100,
    },
  });
}

async function createBooking(
  tourId: string,
  tourDateId: string,
  memberId: string | null,
  overrides: Record<string, any> = {}
) {
  return prisma.booking.create({
    data: {
     shortId: Math.random().toString(36).substring(2, 6).toUpperCase(),
      tourId,
      tourDateId,
      memberId,
      name: 'Cron Client',
      phone: '+37300000000',
      totalPrice: 500,
      status: 'awaiting_payment',
      paymentMethod: 'qr',
      ...overrides,
    },
  });
}

// ─────────────────────────────────────────────
// 1. PAYMENT-REPORT
// ─────────────────────────────────────────────
describe('Cron: payment-report', () => {
  let GET: (req: Request) => Promise<Response>;
  let tourId: string;
  let tourDateId: string;
  let bookingId: string;
  let bookingId2: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/cron/payment-report/route'));
  });

  beforeEach(async () => {
    const { tour, tourDate, category } = await createTourWithDate();
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;
  });

  afterEach(async () => {
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (bookingId2) await prisma.booking.deleteMany({ where: { id: bookingId2 } });
    await prisma.tourDate.deleteMany({ where: { id: tourDateId } });
    await prisma.tour.deleteMany({ where: { id: tourId } });
    await prisma.tourCategory.deleteMany({ where: { id: categoryId } });
    jest.clearAllMocks();
    bookingId = '';
    bookingId2 = '';
  });

  it('возвращает 401 без авторизации', async () => {
    const res = await GET(makeRequest('http://localhost/api/cron/payment-report', false));
    expect(res.status).toBe(401);
  });

  it('возвращает "No pending bookings" когда нет pending броней', async () => {
    const res = await GET(makeRequest('http://localhost/api/cron/payment-report'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe('No pending bookings found');
    expect(mockSendTelegramMessage).not.toHaveBeenCalled();
  });

  it('отправляет отчёт для pending и awaiting_payment броней', async () => {
    const b1 = await createBooking(tourId, tourDateId, null, { status: 'pending' });
    const b2 = await createBooking(tourId, tourDateId, null, { status: 'awaiting_payment' });
    bookingId = b1.id;
    bookingId2 = b2.id;

    const res = await GET(makeRequest('http://localhost/api/cron/payment-report'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sent).toBeGreaterThanOrEqual(2);
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      expect.stringContaining('ЕЖЕДНЕВНЫЙ ОТЧЕТ')
    );
  });

  it('не включает confirmed брони в отчёт', async () => {
    const booking = await createBooking(tourId, tourDateId, null, { status: 'confirmed' });
    bookingId = booking.id;

    const res = await GET(makeRequest('http://localhost/api/cron/payment-report'));
    const data = await res.json();
    expect(data.message).toBe('No pending bookings found');
  });
});

// ─────────────────────────────────────────────
// 2. POST-TOUR-REVIEWS
// ─────────────────────────────────────────────
describe('Cron: post-tour-reviews', () => {
  // Меняем тип на any, чтобы избежать конфликтов Request/NextRequest в среде Jest
  let GET: any;
  let tourId: string;
  let tourDateId: string;
  let memberId: string;
  let bookingId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/cron/post-tour-reviews/route'));
  });

  afterEach(async () => {
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (memberId) await prisma.memberProfile.deleteMany({ where: { id: memberId } });
    if (tourDateId) await prisma.tourDate.deleteMany({ where: { id: tourDateId } });
    if (tourId) await prisma.tour.deleteMany({ where: { id: tourId } });
    if (categoryId) await prisma.tourCategory.deleteMany({ where: { id: categoryId } });
    jest.clearAllMocks();
  });

  it('возвращает 401 без авторизации', async () => {
    const res = await GET(makeRequest('http://localhost/api/cron/post-tour-reviews', false));
    expect(res.status).toBe(401);
  });

  it('отправляет запрос отзыва участнику с аккаунтом через NotificationHub', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: yesterday(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('review');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    const res = await GET(makeRequest('http://localhost/api/cron/post-tour-reviews'));
    const data = await res.json();

    expect(res.status).toBe(200);
    // Проверяем по новому формату ответа
    expect(data.success).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'POST_TOUR_REVIEW', memberId })
    );
  });

  it('отправляет запрос для многодневного тура, который закончился вчера (по endDate)', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ 
      startDate: fiveDaysAgo(), 
      endDate: yesterday() 
    });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('multiday');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    const res = await GET(makeRequest('http://localhost/api/cron/post-tour-reviews'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'POST_TOUR_REVIEW', memberId })
    );
  });

  it('отправляет запрос отзыва гостю без аккаунта через Telegram fetch', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: yesterday(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const booking = await createBooking(tourId, tourDateId, null, {
      status: 'confirmed',
      payerTgChatId: '555666777',
    });
    bookingId = booking.id;

    const res = await GET(makeRequest('http://localhost/api/cron/post-tour-reviews'));

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('не отправляет повторно если отзыв уже существует', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: yesterday(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('nodup');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    await prisma.review.create({
      data: { tourId, memberId, name: 'Cron Client', text: 'Already reviewed', rating: 5, source: 'tg', isActive: true },
    });

    const res = await GET(makeRequest('http://localhost/api/cron/post-tour-reviews'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Самая главная проверка — что пуш не отправлялся
    expect(mockDispatch).not.toHaveBeenCalled();

    await prisma.review.deleteMany({ where: { tourId, memberId } });
  });
});

// ─────────────────────────────────────────────
// 3. SALES-BOT (win-back + cross-sell)
// ─────────────────────────────────────────────
describe('Cron: sales-bot', () => {
  let GET: (req: Request) => Promise<Response>;
  let tourId: string;
  let tourDateId: string;
  let memberId: string;
  let bookingId: string;
  let promoId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/cron/sales-bot/route'));
  });

  afterEach(async () => {
    if (promoId) await prisma.promoCode.deleteMany({ where: { id: promoId } });
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (memberId) await prisma.memberProfile.deleteMany({ where: { id: memberId } });
    if (tourDateId) await prisma.tourDate.deleteMany({ where: { id: tourDateId } });
    if (tourId) await prisma.tour.deleteMany({ where: { id: tourId } });
    if (categoryId) await prisma.tourCategory.deleteMany({ where: { id: categoryId } });
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue('OK');
  });

  it('возвращает 401 без авторизации', async () => {
    const res = await GET(makeRequest('http://localhost/api/cron/sales-bot', false));
    expect(res.status).toBe(401);
  });

  it('win-back: создаёт промокод и отправляет WIN_BACK_OFFER', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: ninetyDaysAgo(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('wb');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    mockRedisSet.mockResolvedValue('OK');

    const res = await GET(makeRequest('http://localhost/api/cron/sales-bot'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.winbackSent).toBeGreaterThanOrEqual(1);

    const promo = await prisma.promoCode.findFirst({ where: { memberId } });
    expect(promo).not.toBeNull();
    if (promo) promoId = promo.id;

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'WIN_BACK_OFFER', memberId })
    );
  });

  it('win-back: логирует WIN_BACK_DELIVERY_FAILED если Hub упал, но не крашит роут', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: ninetyDaysAgo(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('wbfail');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    mockRedisSet.mockResolvedValue('OK');
    mockDispatch.mockRejectedValueOnce(new Error('Hub timeout'));

    const res = await GET(makeRequest('http://localhost/api/cron/sales-bot'));
    
    expect(res.status).toBe(200); 
    
    await new Promise(resolve => setTimeout(resolve, 50)); 

    expect(mockLogSystemAction).toHaveBeenCalledWith(
      'WIN_BACK_DELIVERY_FAILED',
      expect.objectContaining({ targetId: memberId })
    );

    const promo = await prisma.promoCode.findFirst({ where: { memberId } });
    if (promo) promoId = promo.id;
  });

  it('cross-sell: отправляет CROSS_SELL_OFFER для клиента 7-дневной давности', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: sevenDaysAgo(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('cs');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    mockRedisSet.mockResolvedValue('OK');

    const res = await GET(makeRequest('http://localhost/api/cron/sales-bot'));
    const data = await res.json();

    expect(data.crosssellSent).toBeGreaterThanOrEqual(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'CROSS_SELL_OFFER', memberId })
    );
  });
});

// ─────────────────────────────────────────────
// 4. CANCEL-UNPAID
// ─────────────────────────────────────────────
describe('Cron: cancel-unpaid', () => {
  let POST: (req: Request) => Promise<Response>;
  let tourId: string;
  let tourDateId: string;
  let memberId: string;
  let bookingId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ POST } = await import('@/app/api/cron/cancel-unpaid/route'));
  });

  afterEach(async () => {
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (memberId) await prisma.memberProfile.deleteMany({ where: { id: memberId } });
    if (tourDateId) await prisma.tourDate.deleteMany({ where: { id: tourDateId } });
    if (tourId) await prisma.tour.deleteMany({ where: { id: tourId } });
    if (categoryId) await prisma.tourCategory.deleteMany({ where: { id: categoryId } });
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue('OK');
  });

  it('отменяет бронь старше 48 часов, возвращает места, зовет Ждунов и логирует', async () => {
    const { tour, tourDate, category } = await createTourWithDate();
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('cancel');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, {
      status: 'awaiting_payment',
      ticketsAdult: 2,
    });
    // Тут Date.now() безопасно, так как мы вычисляем разницу (ageInHours) прямо сейчас
    await prisma.booking.update({
      where: { id: booking.id },
      data: { createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000) },
    });
    bookingId = booking.id;

    const spotsLeftBefore = tourDate.spotsLeft;
    mockRedisGet.mockResolvedValue(null);

    const res = await POST(makeRequest('http://localhost/api/cron/cancel-unpaid'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cancelled).toBeGreaterThanOrEqual(1);

    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDateId } });
    expect(updatedDate?.spotsLeft).toBe(spotsLeftBefore + 2);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'BOOKING_AUTO_CANCELLED', memberId })
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockLogSystemAction).toHaveBeenCalledWith(
      'BOOKING_AUTO_CANCELLED_BY_CRON',
      expect.objectContaining({ targetId: bookingId })
    );

    expect(mockNotifyWaitlist).toHaveBeenCalledWith(tourId, tourDateId);
  });

  it('отправляет напоминание для брони 24–48 часов (без отмены)', async () => {
    const { tour, tourDate, category } = await createTourWithDate();
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('remind');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'awaiting_payment' });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });
    bookingId = booking.id;

    mockRedisGet.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const res = await POST(makeRequest('http://localhost/api/cron/cancel-unpaid'));
    const data = await res.json();

    expect(data.reminded).toBeGreaterThanOrEqual(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'PAYMENT_REMINDER_24H', memberId })
    );
  });

  it('отправляет прямое Telegram-сообщение гостю (без аккаунта) при отмене', async () => {
    const { tour, tourDate, category } = await createTourWithDate();
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const booking = await createBooking(tourId, tourDateId, null, {
      status: 'awaiting_payment',
      payerTgChatId: '999888777',
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000) },
    });
    bookingId = booking.id;

    await POST(makeRequest('http://localhost/api/cron/cancel-unpaid'));

    expect(mockSendToUserTelegramAdvanced).toHaveBeenCalledWith(
      '999888777',
      expect.stringContaining('аннулирована'),
      [],
      true
    );
  });
});

// ─────────────────────────────────────────────
// 5. ROLLOVER
// ─────────────────────────────────────────────
describe('Cron: rollover', () => {
  let GET: (req: Request) => Promise<Response>;
  let tourId: string;
  let tourDateId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/cron/rollover/route'));
  });

  afterEach(async () => {
    if (tourDateId) await prisma.tourDate.deleteMany({ where: { id: tourDateId } });
    if (tourId) await prisma.tour.deleteMany({ where: { id: tourId } });
    if (categoryId) await prisma.tourCategory.deleteMany({ where: { id: categoryId } });
    jest.clearAllMocks();
  });

  it('деактивирует тур у которого все даты в прошлом и уведомляет админа', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: fiveDaysAgo() });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const res = await GET(makeRequest('http://localhost/api/cron/rollover'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.deactivated).toBeGreaterThanOrEqual(1);
    
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('АРХИВАЦИЯ ТУРОВ')
    );
  });
});

// ─────────────────────────────────────────────
// 6. REMINDERS (завтра / через 3 дня)
// ─────────────────────────────────────────────
describe('Cron: reminders', () => {
  let GET: (req: Request) => Promise<Response>;
  let tourId: string;
  let tourDateId: string;
  let memberId: string;
  let bookingId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/cron/reminders/route'));
  });

  afterEach(async () => {
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (memberId) await prisma.memberProfile.deleteMany({ where: { id: memberId } });
    if (tourDateId) await prisma.tourDate.deleteMany({ where: { id: tourDateId } });
    if (tourId) await prisma.tour.deleteMany({ where: { id: tourId } });
    if (categoryId) await prisma.tourCategory.deleteMany({ where: { id: categoryId } });
    jest.clearAllMocks();
    mockRedisSet.mockResolvedValue('OK');
    mockRedisDel.mockResolvedValue(1);
  });

  it('отправляет TOUR_TOMORROW_REMINDER', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: tomorrow(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('tmr');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    const res = await GET(makeRequest('http://localhost/api/cron/reminders'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.processed).toBeGreaterThanOrEqual(1);
    expect(data.sent).toBeGreaterThanOrEqual(1);
  });

  it('не отправляет напоминание повторно (дедупликация через Redis)', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: tomorrow(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('remdup');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    mockRedisSet.mockResolvedValueOnce(null); 

    await GET(makeRequest('http://localhost/api/cron/reminders'));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('откатывает ключ в Redis (del), если Hub упал при отправке', async () => {
    const { tour, tourDate, category } = await createTourWithDate({ startDate: tomorrow(), endDate: null });
    tourId = tour.id;
    tourDateId = tourDate.id;
    categoryId = category.id;

    const member = await createMember('remfail');
    memberId = member.id;

    const booking = await createBooking(tourId, tourDateId, memberId, { status: 'confirmed' });
    bookingId = booking.id;

    mockRedisSet.mockResolvedValueOnce('OK'); 
    mockDispatch.mockRejectedValueOnce(new Error('Hub Error')); 

    await GET(makeRequest('http://localhost/api/cron/reminders'));
    
    await new Promise(resolve => setTimeout(resolve, 50)); 

    expect(mockRedisDel).toHaveBeenCalledWith(expect.stringContaining(`reminder_sent:TOUR_TOMORROW_REMINDER:${bookingId}`));
  });
});