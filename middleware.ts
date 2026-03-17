import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. ГЕНЕРАЦИЯ NONCE И CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Формируем CSP на базе твоих старых настроек, но заменяем unsafe-inline на nonce для скриптов
// Формируем стабильный CSP: Next.js может грузить JS, шрифты работают
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src * blob: data:;
    media-src * blob: data:;
    connect-src *;
    font-src 'self' data: https://fonts.gstatic.com;
    frame-src 'self' https://www.youtube.com;
    object-src 'none';
    base-uri 'none';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Прокидываем заголовки в объект запроса для layout.tsx
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // 2. ИНИЦИАЛИЗАЦИЯ SUPABASE С НОВЫМИ ЗАГОЛОВКАМИ
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ 
            request: { headers: requestHeaders } 
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. ЛОГИКА АВТОРИЗАЦИИ (Отрабатывает только для /admin)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser();

    // Если не залогинен и пытается зайти в /admin
    if (!user) {
      if (request.nextUrl.pathname !== '/admin/login') {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        supabaseResponse = NextResponse.redirect(loginUrl);
      }
    } 
    // Если залогинен и открывает /admin/login — редирект в админку
    else if (user && request.nextUrl.pathname === '/admin/login') {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin';
      supabaseResponse = NextResponse.redirect(adminUrl);
    }
  }

  // 4. УСТАНАВЛИВАЕМ CSP В ОТВЕТ БРАУЗЕРУ
  supabaseResponse.headers.set('Content-Security-Policy', cspHeader);

  return supabaseResponse;
}

// 5. НАСТРОЙКА MATCHER (Должен срабатывать везде кроме статики, чтобы раздавать CSP)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};