import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { createClient } from '@supabase/supabase-js'; 
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';
// Опционально импортируем нашу функцию защиты от Open Redirect для безопасного возврата
import { sanitizeNextUrl } from '@/lib/auth';

const redis = Redis.fromEnv();

/**
 * Валидация криптографической подписи Telegram.
 * @param data Все параметры из URL
 * @param botToken Токен Telegram-бота
 * @returns boolean (true если подпись верна)
 */
function verifyTelegramHash(data: Record<string, string>, botToken: string): boolean {
  const { hash, ...userData } = data;
  if (!hash) return false;

  // 1. secret_key = SHA256(bot_token)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // 2. data_check_string = отсортированные пары key=value через \n
  const dataCheckString = Object.keys(userData)
    // Исключаем пустые значения, undefined и служебный next (если мы его сами добавили)
    .filter(key => userData[key] !== undefined && userData[key] !== 'undefined' && key !== 'next')
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join('\n');
  
  // 3. HMAC-SHA256(secret_key, data_check_string)
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return hmac === hash;
}

export async function GET(request: Request) {
  try { 
    const { searchParams, origin } = new URL(request.url);
    const data = Object.fromEntries(searchParams.entries()) as Record<string, string>;

    const authBotToken = env.TELEGRAM_AUTH_BOT;
    if (!authBotToken) {
      throw new Error('TELEGRAM_AUTH_BOT is not defined in .env');
    }

    // ==========================================
    // 🛡 1. ПРОВЕРКА ПОДПИСИ TELEGRAM
    // ==========================================
    if (!verifyTelegramHash(data, authBotToken)) {
      console.error('Telegram auth failed: Invalid Hash');
      // Возвращаем строго 401, как указано в критериях приемки
      return NextResponse.json({ error: 'Unauthorized: Invalid hash signature' }, { status: 401 });
    }

    // ==========================================
    // 🛡 2. ЗАЩИТА ОТ УСТАРЕВШИХ ДАННЫХ (SEC-ADV-06)
    // ==========================================
    const authDate = parseInt(data.auth_date || '0', 10);
    const now = Math.floor(Date.now() / 1000); // Текущее время в секундах

    if (now - authDate > 86400) { // 24 часа = 86400 секунд
      console.warn(`[Telegram Auth] Отклонена попытка входа по устаревшим данным. ID: ${data.id}`);
      // Возвращаем строго 401 при истечении 24 часов
      return NextResponse.json({ error: 'Unauthorized: Auth data expired' }, { status: 401 });
    }

    // ==========================================
    // 🛡 3. ЗАЩИТА ОТ REPLAY-АТАК (Оставляем твою отличную логику)
    // ==========================================
    const replayKey = `tg:auth:${data.id}:${authDate}`;
    const isNewAuth = await redis.set(replayKey, '1', { ex: 86400, nx: true });
    if (!isNewAuth) {
      console.warn(`[Telegram Auth] Replay attack blocked. User ID: ${data.id}`);
      return NextResponse.json({ error: 'Unauthorized: Replay attack detected' }, { status: 401 });
    }

    // ==========================================
    // 4. АВТОРИЗАЦИЯ В SUPABASE
    // ==========================================
    const email = `tg_${data.id}@evaclub.tour`;
    const password = crypto.createHmac('sha256', authBotToken).update(data.id).digest('hex');

    const supabase = await createServerSupabaseClient();

    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let userId = signInData?.user?.id;

    // Регистрация нового пользователя
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in .env');
      }

      const supabaseAdmin = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: [data.first_name, data.last_name].filter(Boolean).join(' '),
          avatar_url: data.photo_url,
          telegram_id: data.id,
          telegram_username: data.username,
        }
      });

      if (adminError || !adminData.user) {
        console.error('Admin API Create User Error:', adminError);
        return NextResponse.redirect(`${origin}/login?error=signup_failed`);
      }

      userId = adminData.user.id;

      const { error: retrySignInError } = await supabase.auth.signInWithPassword({
        email, password,
      });

      if (retrySignInError) {
        return NextResponse.redirect(`${origin}/login?error=session_failed`);
      }
    } else if (signInError) {
      return NextResponse.redirect(`${origin}/login?error=signin_failed`);
    }

    // ==========================================
    // 5. СИНХРОНИЗАЦИЯ С PRISMA
    // ==========================================
    if (userId) {
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
      const tgUsername = data.username ? `@${data.username}` : null;

      await prisma.memberProfile.upsert({
        where: { userId: userId },
        update: {
          avatarUrl: data.photo_url || undefined,
          telegram: tgUsername || undefined,
          tgChatId: data.id, 
        },
        create: {
          userId: userId,
          name: fullName || null,
          avatarUrl: data.photo_url || null,
          telegram: tgUsername,
          tgChatId: data.id,
          level: 'Первопроходец',
        }
      });
    }

    // ==========================================
    // 6. БЕЗОПАСНЫЙ РЕДИРЕКТ
    // ==========================================
    // Берем next из параметров (если мы его прокинули из виджета) и санируем
    const rawNext = data.next;
    const safeNext = sanitizeNextUrl(rawNext); // Используем функцию из Задачи 2.1
    
    return NextResponse.redirect(`${origin}${safeNext}`);

  } catch (error: unknown) {
    console.error('Telegram Auth 500 Error:', error);
    // При системной ошибке возвращаем 500
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}