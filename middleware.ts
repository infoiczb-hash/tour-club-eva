import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // CSP — строится один раз для всех маршрутов
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

  // ── ПУБЛИЧНЫЕ МАРШРУТЫ ────────────────────────────────────────────
  // Supabase не инициализируется — нет сетевых запросов, нет задержки
  const isAuthRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account') ||
    pathname === '/login';

  if (!isAuthRoute) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', cspHeader);
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
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};