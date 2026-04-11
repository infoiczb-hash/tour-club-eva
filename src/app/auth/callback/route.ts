// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Разрешаем только относительные пути — защита от Open Redirect
function isAllowedRedirect(path: string | null): boolean {
  if (!path) return true;
  return path.startsWith('/') && !path.startsWith('//');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account/dashboard';

  // 1. Нет кода — сразу ошибка
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 2. Блокируем небезопасные редиректы
  if (!isAllowedRedirect(next)) {
    console.warn(`[SECURITY] Blocked open redirect attempt: ${next}`);
    return NextResponse.redirect(`${origin}/`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth Callback Error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 3. Всё ок — редирект только на относительный путь
  return NextResponse.redirect(`${origin}${next}`);
}