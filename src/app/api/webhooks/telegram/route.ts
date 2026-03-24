import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Проверяем, что это текстовое сообщение (игнорируем эдиты, картинки и т.д.)
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: 'ignored' });
    }

    const text = body.message.text;
    const chatId = String(body.message.chat.id);

    // 2. Ловим команду привязки: /start user_XXXXX
    if (text.startsWith('/start user_')) {
      const profileId = text.replace('/start user_', '').trim();

      if (!profileId) {
        return NextResponse.json({ status: 'invalid_user_id' });
      }

      // 3. Ищем профиль в базе
      const profile = await prisma.memberProfile.findUnique({
        where: { id: profileId }
      });

      if (profile) {
        // 4. Сохраняем chatId в существующее поле tgChatId
        await prisma.memberProfile.update({
          where: { id: profileId },
          data: { tgChatId: chatId } // ✅ ИСПОЛЬЗУЕМ ТВОЕ ПОЛЕ
        });

        // 5. Радуем юзера успешной привязкой
        await sendMessage(
          chatId, 
          `🎉 Отлично, ${profile.name || 'путешественник'}! Telegram успешно привязан.\n\nТеперь вы будете первыми узнавать о новых датах для туров из вашего листа ожидания.`
        );
      } else {
         await sendMessage(chatId, `❌ Ошибка: Профиль не найден. Пожалуйста, попробуйте перейти по ссылке из личного кабинета еще раз.`);
      }
    }

    // Возвращаем 200 OK, иначе Telegram будет спамить этим запросом бесконечно
    return NextResponse.json({ status: 'ok' });
    
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Вспомогательная функция для ответа юзеру
async function sendMessage(chatId: string, text: string) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
}