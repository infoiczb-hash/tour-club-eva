// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sanitizeNextUrl } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  
  // Получаем безопасный путь через централизованную функцию
  const safeNext = sanitizeNextUrl(rawNext);

  // 1. Нет кода — сразу ошибка
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 2. Блокируем небезопасные редиректы И сохраняем логирование попыток взлома
  // Если сырой next не совпадает с безопасным (значит функция его обрезала до fallback'а)
  if (rawNext && rawNext !== safeNext) {
    console.warn(`[SECURITY] Blocked open redirect attempt: ${rawNext}`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth Callback Error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 3. Всё ок — редирект только на проверенный относительный путь
  return NextResponse.redirect(`${origin}${safeNext}`);
}