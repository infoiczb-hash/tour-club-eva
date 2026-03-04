import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  // Если не залогинен и пытается зайти в /admin
  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    // Разрешаем /admin/login — иначе бесконечный редирект
    if (request.nextUrl.pathname === '/admin/login') {
      return supabaseResponse;
    }
    // Все остальные /admin/* — редирект на логин
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  // Если залогинен и открывает /admin/login — редирект в админку
  if (user && request.nextUrl.pathname === '/admin/login') {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = '/admin';
    return NextResponse.redirect(adminUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};

