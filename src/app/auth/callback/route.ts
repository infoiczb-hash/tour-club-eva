import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'; // Твой путь к серверному клиенту

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Если передали параметр next (куда отправить после логина), используем его, иначе в дашборд
  const next = searchParams.get('next') ?? '/account/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth Callback Error:', error.message);
    }
  }

  // Если что-то пошло не так, возвращаем на страницу логина с ошибкой
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}