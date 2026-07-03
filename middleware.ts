import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProd = process.env.NODE_ENV === 'production';

  // --- Генерация nonce для script-src ---
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // --- Единый CSP (объединены домены из next.config и middleware + добавлен unsafe-eval) ---
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://telegram.org;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://telegram.org;
    img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://api.telegram.org https://t.me https://telegram.org https://grainy-gradients.vercel.app https://img.youtube.com https://images.unsplash.com;
    media-src 'self' https://res.cloudinary.com blob: data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://res.cloudinary.com https://va.vercel-scripts.com https://*.sentry.io;
    font-src 'self' data: https://fonts.gstatic.com;
    frame-src 'self' https://www.youtube.com https://oauth.telegram.org https://telegram.org https://t.me;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProd ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim();

  // --- Публичные маршруты (без авторизации) ---
  const isAuthRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account') ||
    pathname === '/login';

  if (!isAuthRoute) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', cspHeader);
    // Пробрасываем nonce для использования в layout.tsx или других компонентах
    response.headers.set('x-nonce', nonce);
    response.headers.append('Link', '<https://res.cloudinary.com>; rel=preconnect');
    return response;
  }

  // --- Защищённые маршруты ---
  const requestHeaders = new Headers(request.headers);
  // Передаём nonce дальше (например, для <Script nonce={...}>)
  requestHeaders.set('x-nonce', nonce);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ── /admin проверки ──
  if (pathname.startsWith('/admin')) {
    if (!user && pathname !== '/admin/login') {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      supabaseResponse = NextResponse.redirect(loginUrl);
    } else if (user) {
      const isAdmin = user.user_metadata?.role === 'admin';
      if (!isAdmin) {
        const accountUrl = request.nextUrl.clone();
        accountUrl.pathname = '/account/dashboard';
        return NextResponse.redirect(accountUrl);
      }
      if (pathname === '/admin/login') {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin';
        supabaseResponse = NextResponse.redirect(adminUrl);
      }
    }
  }

  // ── /account ──
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      supabaseResponse = NextResponse.redirect(loginUrl);
    }
  }

  // ── /login ──
  if (pathname === '/login') {
    if (user) {
      const next = request.nextUrl.searchParams.get('next') ?? '/account';
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.search = '';
      supabaseResponse = NextResponse.redirect(redirectUrl);
    }
  }

  supabaseResponse.headers.set('Content-Security-Policy', cspHeader);
  supabaseResponse.headers.set('x-nonce', nonce);
  supabaseResponse.headers.append('Link', '<https://res.cloudinary.com>; rel=preconnect');
  
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};