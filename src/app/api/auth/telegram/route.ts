import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server'; // Проверь правильность пути к твоему серверному клиенту

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const data = Object.fromEntries(searchParams.entries());

  // 1. Извлекаем хэш, который прислал Telegram
  const { hash, ...userData } = data;
  if (!hash) {
    return NextResponse.redirect(`${origin}/login?error=no_telegram_data`);
  }

  // 2. Проверяем подлинность данных (магия криптографии Telegram)
  const botToken = process.env.TELEGRAM_AUTH_BOT;
  if (!botToken) {
    throw new Error('TELEGRAM_AUTH_BOT is not defined in .env');
  }

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const dataCheckString = Object.keys(userData)
    .filter(key => userData[key] !== undefined && userData[key] !== 'undefined')
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join('\n');
  
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Если хэши не совпали — это хакер, отправляем обратно
  if (hmac !== hash) {
    console.error('Telegram auth failed: Invalid Hash');
    return NextResponse.redirect(`${origin}/login?error=invalid_hash`);
  }

  // 3. Авторизуем в Supabase
  // Генерируем уникальный "технический" email и надежный пароль для этого Telegram-аккаунта
  const email = `tg_${userData.id}@evaclub.tour`;
  const password = crypto.createHmac('sha256', botToken).update(userData.id).digest('hex');

  const supabase = await createServerSupabaseClient();

  // Пытаемся войти
  let { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Если такого пользователя еще нет (первый вход) — регистрируем его
  if (signInError && signInError.message.includes('Invalid login credentials')) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: [userData.first_name, userData.last_name].filter(Boolean).join(' '),
          avatar_url: userData.photo_url,
          telegram_id: userData.id,
          telegram_username: userData.username,
        }
      }
    });
    
    if (signUpError) {
      console.error('Telegram Signup Error:', signUpError);
      return NextResponse.redirect(`${origin}/login?error=signup_failed`);
    }
  }

  // 4. Успех! Перенаправляем в личный кабинет
  return NextResponse.redirect(`${origin}/account/dashboard`);
}