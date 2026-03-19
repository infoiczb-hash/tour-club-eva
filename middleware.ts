import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. ГЕНЕРАЦИЯ NONCE И CSP (Оставляем твой стабильный, рабочий вариант)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // 2. ИНИЦИАЛИЗАЦИЯ SUPABASE
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // 3. ЛОГИКА АВТОРИЗАЦИИ (ОПТИМИЗИРОВАННАЯ)
  const pathname = request.nextUrl.pathname;

  // Проверяем, нужна ли нам вообще авторизация на этом маршруте
  const isAuthRoute = pathname.startsWith('/admin') || pathname.startsWith('/account') || pathname === '/login';

  if (isAuthRoute) {
    // Делаем ровно ОДИН запрос к базе только для защищенных путей
    const { data: { user } } = await supabase.auth.getUser();

    // ── /admin ──────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      if (!user && pathname !== '/admin/login') {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        supabaseResponse = NextResponse.redirect(loginUrl);
      } else if (user && pathname === '/admin/login') {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin';
        supabaseResponse = NextResponse.redirect(adminUrl);
      }
    }

    // ── /account ─────────────────────────────────────────────────────
    if (pathname.startsWith('/account')) {
      if (!user) {
        // Сохраняем целевой URL в ?next= чтобы вернуться после входа
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('next', pathname);
        supabaseResponse = NextResponse.redirect(loginUrl);
      }
    }

    // ── /login ───────────────────────────────────────────────────────
    if (pathname === '/login') {
      if (user) {
        // Если уже залогинен — отправляем туда, куда он шел, либо в кабинет
        const next = request.nextUrl.searchParams.get('next') ?? '/account';
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = next;
        redirectUrl.search = '';
        supabaseResponse = NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 4. УСТАНАВЛИВАЕМ CSP В ОТВЕТ БРАУЗЕРУ
  supabaseResponse.headers.set('Content-Security-Policy', cspHeader);

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};