import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { createClient } from '@supabase/supabase-js'; 
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function GET(request: Request) {
  try { 
    const { searchParams, origin } = new URL(request.url);
    const data = Object.fromEntries(searchParams.entries());

    // 1. Извлекаем хэш, который прислал Telegram
    const { hash, ...userData } = data;
    if (!hash) {
      return NextResponse.redirect(`${origin}/login?error=no_telegram_data`);
    }

    // 2. Проверяем подлинность данных (магия криптографии Telegram)
    //   ИСПРАВЛЕНИЕ: Используем токен от бота авторизации, а не от бота уведомлений
    const authBotToken = env.TELEGRAM_AUTH_BOT;
    if (!authBotToken) {
      throw new Error('TELEGRAM_AUTH_BOT is not defined in .env');
    }

    const secretKey = crypto.createHash('sha256').update(authBotToken).digest();
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

    // ==========================================
    // 🛡 ЗАЩИТА ОТ УСТАРЕВШИХ ДАННЫХ (SEC-ADV-06)
    // ==========================================
    const authDate = parseInt(userData.auth_date?.toString() || '0', 10);
    const now = Math.floor(Date.now() / 1000); // Текущее время в секундах

    if (now - authDate > 86400) { // 24 часа = 86400 секунд
      console.warn(`[Telegram Auth] Отклонена попытка входа по устаревшим данным. ID: ${userData.id}`);
      return NextResponse.redirect(`${origin}/login?error=auth_expired`);
    }
    // ==========================================

    // 🛡 ЗАЩИТА ОТ REPLAY-АТАК
    const replayKey = `tg:auth:${userData.id}:${authDate}`;
    const isNewAuth = await redis.set(replayKey, '1', { ex: 86400, nx: true });
    if (!isNewAuth) {
      console.warn(`[Telegram Auth] Replay attack blocked. User ID: ${userData.id}`);
      return NextResponse.redirect(`${origin}/login?error=auth_replayed`);
    }

    // 3. Авторизуем в Supabase
    const email = `tg_${userData.id}@evaclub.tour`;
    //   ИСПРАВЛЕНИЕ: Пароль тоже генерируем на основе правильного токена
    const password = crypto.createHmac('sha256', authBotToken).update(userData.id).digest('hex');

    // Клиент для установки сессии (cookies) в браузере
    const supabase = await createServerSupabaseClient();

    // Пытаемся войти (если юзер уже существует)
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let userId = signInData?.user?.id;

    // Если такого пользователя еще нет — регистрируем его через Admin API
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in .env');
      }

      // Инициализируем админский клиент для обхода email-подтверждений
      const supabaseAdmin = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Создаем пользователя с автоподтвержденным email
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: [userData.first_name, userData.last_name].filter(Boolean).join(' '),
          avatar_url: userData.photo_url,
          telegram_id: userData.id,
          telegram_username: userData.username,
        }
      });

      if (adminError || !adminData.user) {
        console.error('Admin API Create User Error:', adminError);
        return NextResponse.redirect(`${origin}/login?error=signup_failed`);
      }

      userId = adminData.user.id;

      // Теперь логиним его обычным клиентом, чтобы установились cookies сессии
      const { error: retrySignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (retrySignInError) {
        console.error('Retry Sign In Error:', retrySignInError);
        return NextResponse.redirect(`${origin}/login?error=session_failed`);
      }
    } else if (signInError) {
      console.error('SignIn Error:', signInError);
      return NextResponse.redirect(`${origin}/login?error=signin_failed`);
    }

  // 4. Синхронизация профиля с Prisma (Создаем или обновляем MemberProfile)
    if (userId) {
      const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ');
      const tgUsername = userData.username ? `@${userData.username}` : null;

      await prisma.memberProfile.upsert({
        where: { userId: userId },
        update: {
          // ❌ МЫ УДАЛИЛИ ОТСЮДА `name: fullName || undefined`
          // Теперь при повторном входе имя пользователя не перезаписывается!
          avatarUrl: userData.photo_url || undefined,
          telegram: tgUsername || undefined,
          tgChatId: userData.id, 
        },
        create: {
          //   А ЗДЕСЬ ОСТАВИЛИ
          // При самом первом входе (регистрации) имя всё равно подтянется из ТГ
          userId: userId,
          name: fullName || null,
          avatarUrl: userData.photo_url || null,
          telegram: tgUsername,
          tgChatId: userData.id,
          level: 'Первопроходец',
        }
      });
    }
    // 5. Успех! Перенаправляем в личный кабинет
    return NextResponse.redirect(`${origin}/account/dashboard`);

  } catch (error: unknown) { //   Заменили any на unknown (OPT-09)
    console.error('Telegram Auth 500 Error:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}