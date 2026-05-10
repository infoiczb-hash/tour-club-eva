// ─── 0. ЖЕСТКОЕ ПЕРЕОПРЕДЕЛЕНИЕ БАЗЫ ДАННЫХ ДЛЯ ТЕСТОВ ───────────────────────
// Защита от случайной записи в Prod. Prisma 5 читает эти переменные при старте.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
process.env.DIRECT_URL = process.env.TEST_DATABASE_URL!;

//   ДОБАВЛЕНО: Устанавливаем значения для топиков и секретов, чтобы в тестах они не были undefined
if (!process.env.TELEGRAM_TOPIC_BOOKINGS) process.env.TELEGRAM_TOPIC_BOOKINGS = 'test-bookings-topic';
if (!process.env.TELEGRAM_TOPIC_MONEY)    process.env.TELEGRAM_TOPIC_MONEY    = 'test-money-topic';
if (!process.env.CRON_SECRET)             process.env.CRON_SECRET             = 'test-cron-secret';
if (!process.env.TELEGRAM_WEBHOOK_SECRET) process.env.TELEGRAM_WEBHOOK_SECRET = 'test-tg-webhook-secret';

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import {
  mockSendToTelegram,
  mockResendEmailsSend,
  mockNotificationHubDispatch,
} from './__mocks__/external-services';

// ─── 1. Мокаем Next.js APIs (cookies, headers) ───────────────────────────────
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => null),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => new Map()),
}));

// Мок next/cache — revalidatePath/revalidateTag вызываются в конце экшена
//   ДОБАВЛЕНО: unstable_cache для тестов – просто пробрасывает оригинальную функцию
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));

// ─── 2. Мокаем внешние сервисы ───────────────────────────────────────────────
jest.mock('@/features/admin/actions/telegram', () => ({
  sendToTelegram: mockSendToTelegram,
  publishToTelegram: mockSendToTelegram,
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockResendEmailsSend },
  })),
}));

jest.mock('@/lib/notifications/hub', () => ({
  NotificationHub: { dispatch: mockNotificationHubDispatch },
}));

// ─── 3. Мокаем Supabase SSR-клиент ───────────────────────────────────────────
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }),
}));

// ─── 4. Мокаем rate-limit — в тестах IP-заголовков нет ───────────────────────
jest.mock('@/lib/rate-limit-server', () => ({
  withRateLimit: (fn: (...args: unknown[]) => unknown) => fn,
  withRateLimitRoute: (fn: (...args: unknown[]) => unknown) => fn,
}));

// ─── 5. Инфраструктура БД ────────────────────────────────────────────────────
const prisma = new PrismaClient();

beforeAll(() => {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    env: { ...process.env },
    stdio: 'inherit',
  });
});

beforeEach(async () => {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `;

  const tables = tablenames.map(({ tablename }) => `"${tablename}"`).join(', ');

  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.error('Ошибка очистки БД:', error);
    }
  }

  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});