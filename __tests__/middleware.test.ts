import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// --- МОКИ ---
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test_anon_key',
  },
}));

describe('Middleware', () => {
  let mockGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Дефолтный мок: пользователь не авторизован
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });

    (createServerClient as jest.Mock).mockReturnValue({
      auth: { getUser: mockGetUser },
    });
  });

  // Вспомогательная функция для генерации запроса
  const createRequest = (pathname: string) => {
    return new NextRequest(new URL(`http://localhost:3000${pathname}`));
  };

  it('1. Неавторизованный на /admin → редирект на /admin/login', async () => {
    const req = createRequest('/admin/dashboard');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/admin/login');
  });

  it('2. Авторизованный не-админ на /admin → редирект на /account/dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: '123', user_metadata: { role: 'user' } } },
    });

    const req = createRequest('/admin/dashboard');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/account/dashboard');
  });

  it('3. Админ на /admin/login → редирект на /admin', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: '123', user_metadata: { role: 'admin' } } },
    });

    const req = createRequest('/admin/login');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/admin');
  });

  it('4. Неавторизованный на /account → редирект на /login?next=/account', async () => {
    const req = createRequest('/account/settings');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Faccount%2Fsettings');
  });

  it('5. Публичный роут (/) → отдает CSP и не дергает Supabase', async () => {
    const req = createRequest('/');
    const res = await middleware(req);

    // Проверяем, что запрос прошел дальше (status 200/NextResponse.next)
    expect(res.headers.get('x-middleware-rewrite')).toBeNull(); 
    
    // Проверяем наличие CSP заголовка
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("https://telegram.org");

    // Проверяем, что Supabase не инициализировался (экономим ресурсы)
    expect(createServerClient).not.toHaveBeenCalled();
  });
});