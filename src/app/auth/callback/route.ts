// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account/dashboard';

  // 1. Нет кода — сразу ошибка
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth Callback Error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 2. Всё ок — редирект куда просили
  return NextResponse.redirect(`${origin}${next}`);
}