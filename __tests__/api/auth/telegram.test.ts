import { GET } from '@/app/api/auth/telegram/route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. НАСТРОЙКА МОКОВ (MOCKS)
// ==========================================
jest.mock('@/lib/prisma', () => ({
  prisma: {
    memberProfile: { upsert: jest.fn() },
  },
}));

jest.mock('@upstash/redis', () => {
  const mRedis = { set: jest.fn() };
  return {
    Redis: { fromEnv: jest.fn(() => mRedis) },
  };
});

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  env: {
    TELEGRAM_AUTH_BOT: 'test_bot_token',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  },
}));

// ==========================================
// 2. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОДПИСИ
// ==========================================
function generateValidHash(data: Record<string, string>, botToken: string) {
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const dataCheckString = Object.keys(data)
    // ДОБАВЛЕНО: игнорируем кастомный параметр next при проверке подписи
    .filter(key => data[key] !== undefined && data[key] !== 'undefined' && key !== 'next')
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');
  
  return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
}

// ==========================================
// 3. САМИ ТЕСТЫ
// ==========================================
describe('GET /api/auth/telegram', () => {
  const baseUrl = 'http://localhost:3000/api/auth/telegram';
  const originUrl = 'http://localhost:3000';

  let mockRedisSet: jest.Mock;
  let mockPrismaUpsert: jest.Mock;
  let mockSignInWithPassword: jest.Mock;
  let mockAdminCreateUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Получаем инстансы замоканных функций
    mockRedisSet = Redis.fromEnv().set as jest.Mock;
    mockPrismaUpsert = prisma.memberProfile.upsert as jest.Mock;

    // Дефолтный ответ: успешный логин в Supabase
    mockSignInWithPassword = jest.fn().mockResolvedValue({
      data: { user: { id: 'test_user_id' } },
      error: null,
    });
    (createServerSupabaseClient as jest.Mock).mockResolvedValue({
      auth: { signInWithPassword: mockSignInWithPassword },
    });

    // Дефолтный ответ: успешная регистрация через Admin API
    mockAdminCreateUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'test_user_id' } },
      error: null,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: { admin: { createUser: mockAdminCreateUser } },
    });

    // Дефолтный ответ: Redis успешно установил ключ (нет Replay-атаки)
    mockRedisSet.mockResolvedValue('OK');
  });

  // ----------------------------------------------------
  it('1. Валидация подписи: должен блокировать запросы с поддельным хэшем', async () => {
    const url = new URL(baseUrl);
    url.searchParams.set('id', '123456');
    url.searchParams.set('first_name', 'Ivan');
    url.searchParams.set('auth_date', Math.floor(Date.now() / 1000).toString());
    url.searchParams.set('hash', 'fake_hacker_hash_123'); // Поддельный хэш

    const req = new NextRequest(url);
    const res = await GET(req);

    // ИЗМЕНЕНО: теперь мы ждем 401 статус вместо редиректа
    expect(res.status).toBe(401); 
    const json = await res.json();
    expect(json.error).toContain('Invalid hash signature');
    expect(mockPrismaUpsert).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------
  it('2. Защита от устаревших данных: блокирует auth_date > 24 часов', async () => {
    const staleDate = Math.floor(Date.now() / 1000) - 90000; // 25 часов назад
    
    const userData = { id: '123', first_name: 'Ivan', auth_date: staleDate.toString() };
    const hash = generateValidHash(userData, 'test_bot_token');

    const url = new URL(baseUrl);
    Object.entries(userData).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('hash', hash);

    const req = new NextRequest(url);
    const res = await GET(req);

    // ИЗМЕНЕНО: теперь мы ждем 401 статус
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Auth data expired');
  });

  // ----------------------------------------------------
  it('3. Защита от replay-атак: блокирует, если ключ в Redis уже существует', async () => {
    // Мокаем, что ключ УЖЕ есть в Redis (Redis возвращает null при параметре nx)
    mockRedisSet.mockResolvedValue(null); 

    const authDate = Math.floor(Date.now() / 1000);
    const userData = { id: '123', first_name: 'Ivan', auth_date: authDate.toString() };
    const hash = generateValidHash(userData, 'test_bot_token');

    const url = new URL(baseUrl);
    Object.entries(userData).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('hash', hash);

    const req = new NextRequest(url);
    const res = await GET(req);

    expect(mockRedisSet).toHaveBeenCalledWith(
      `tg:auth:123:${authDate}`, '1', { ex: 86400, nx: true }
    );
    
    // ИЗМЕНЕНО: теперь мы ждем 401 статус
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Replay attack detected');
  });

  // ----------------------------------------------------
  it('4. Первичная регистрация: создает пользователя через Admin API, если логин не удался', async () => {
    // Имитируем, что пользователя нет (signIn вернул ошибку)
    mockSignInWithPassword
      .mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid login credentials' } }) // Первая попытка
      .mockResolvedValueOnce({ data: { user: { id: 'new_user_id' } }, error: null }); // Вторая попытка после регистрации

    const authDate = Math.floor(Date.now() / 1000);
    const userData = { id: '777', first_name: 'New', last_name: 'User', auth_date: authDate.toString() };
    const hash = generateValidHash(userData, 'test_bot_token');

    const url = new URL(baseUrl);
    Object.entries(userData).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('hash', hash);

    const req = new NextRequest(url);
    const res = await GET(req);

    // Проверяем, что вызвался Admin API для создания юзера
    expect(mockAdminCreateUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'tg_777@evaclub.tour',
      email_confirm: true,
      user_metadata: expect.objectContaining({ telegram_id: '777' }),
    }));

    // Проверяем редирект в ЛК
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${originUrl}/account/dashboard`);
  });

  // ----------------------------------------------------
  it('5. Повторный вход: обновляет tgChatId без затирания ручного имени', async () => {
    const authDate = Math.floor(Date.now() / 1000);
    const userData = { 
      id: '888', 
      first_name: 'Old', 
      username: 'olduser', 
      photo_url: 'http://photo.com/1.jpg',
      auth_date: authDate.toString() 
    };
    const hash = generateValidHash(userData, 'test_bot_token');

    const url = new URL(baseUrl);
    Object.entries(userData).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('hash', hash);

    const req = new NextRequest(url);
    await GET(req);

    // Проверяем, что в `upsert` правильно распределены поля (name только в create)
    expect(mockPrismaUpsert).toHaveBeenCalledWith({
      where: { userId: 'test_user_id' },
      update: {
        avatarUrl: 'http://photo.com/1.jpg',
        telegram: '@olduser',
        tgChatId: '888',
        // ВАЖНО: убеждаемся, что 'name' здесь НЕТ, чтобы не затереть то, что юзер ввел руками
      },
      create: expect.objectContaining({
        userId: 'test_user_id',
        name: 'Old', // Имя ставится только при первичном создании записи
        telegram: '@olduser',
        tgChatId: '888',
      })
    });
  });

  // ----------------------------------------------------
  it('6. Безопасность: Open Redirect Protection корректно обрабатывает параметр next', async () => {
    const authDate = Math.floor(Date.now() / 1000);
    const userData = { id: '999', first_name: 'Safe', auth_date: authDate.toString() };
    const hash = generateValidHash(userData, 'test_bot_token');

    const url = new URL(baseUrl);
    Object.entries(userData).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('hash', hash);
    // Добавляем параметр next, с которым юзер пришел
    url.searchParams.set('next', '/tour/kayaking');

    const req = new NextRequest(url);
    const res = await GET(req);

    // Должен перенаправить на безопасный локальный роут, а не на fallback
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${originUrl}/tour/kayaking`);
  });
});