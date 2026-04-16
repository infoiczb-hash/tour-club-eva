import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // ✅ ПРОВЕРКА ОКРУЖЕНИЯ: Включаем HTTPS-апгрейд только в продакшене
  const isProd = process.env.NODE_ENV === 'production';

// CSP — строится один раз для всех маршрутов
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://telegram.org;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' https://res.cloudinary.com https://*.supabase.co https://api.telegram.org https://t.me blob: data:;
    media-src 'self' https://res.cloudinary.com blob: data:;
    connect-src 'self' https://*.supabase.co https://res.cloudinary.com https://va.vercel-scripts.com;
    font-src 'self' data: https://fonts.gstatic.com;
    frame-src 'self' https://www.youtube.com https://oauth.telegram.org https://telegram.org;
    object-src 'none';
    base-uri 'none';
    form-action 'self';
    frame-ancestors 'none';
    ${isProd ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim();

  // ── ПУБЛИЧНЫЕ МАРШРУТЫ ────────────────────────────────────────────
  // Supabase не инициализируется — нет сетевых запросов, нет задержки
  const isAuthRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account') ||
    pathname === '/login';

  if (!isAuthRoute) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', cspHeader);
    // ПАТЧ: Preconnect к Cloudinary для ускорения загрузки изображений (экономия 150-300мс)
    response.headers.append('Link', '<https://res.cloudinary.com>; rel=preconnect');
    return response;
  }

  // ── ЗАЩИЩЁННЫЕ МАРШРУТЫ (/admin, /account, /login) ───────────────
  // Supabase инициализируется только здесь
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── /admin ───────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user && pathname !== '/admin/login') {
      // Неавторизованных гостей отправляем на логин админки
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      supabaseResponse = NextResponse.redirect(loginUrl);
    } else if (user) {
      // ✅ ПРОВЕРКА РОЛИ АДМИНА
      // Проверяем наличие роли 'admin' в метадате пользователя
      const isAdmin = user.user_metadata?.role === 'admin';

      if (!isAdmin) {
        // Залогинен, но не админ? Выкидываем в обычный кабинет пользователя
        const accountUrl = request.nextUrl.clone();
        accountUrl.pathname = '/account/dashboard';
        return NextResponse.redirect(accountUrl);
      }

      // Если админ пытается зайти на страницу логина — пускаем его сразу внутрь
      if (pathname === '/admin/login') {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin';
        supabaseResponse = NextResponse.redirect(adminUrl);
      }
    }
  }

  // ── /account ─────────────────────────────────────────────────────
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      supabaseResponse = NextResponse.redirect(loginUrl);
    }
  }

  // ── /login ───────────────────────────────────────────────────────
  if (pathname === '/login') {
    if (user) {
      const next =
        request.nextUrl.searchParams.get('next') ?? '/account';
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.search = '';
      supabaseResponse = NextResponse.redirect(redirectUrl);
    }
  }

  supabaseResponse.headers.set('Content-Security-Policy', cspHeader);
  // ПАТЧ: Preconnect к Cloudinary для авторизованных страниц
  supabaseResponse.headers.append('Link', '<https://res.cloudinary.com>; rel=preconnect');
  
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};