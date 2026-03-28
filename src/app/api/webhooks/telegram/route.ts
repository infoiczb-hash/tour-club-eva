import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { BookingStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // 1. Защита: Проверяем секретный токен Telegram
    const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (!secretHeader || secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // ==========================================
    // СЦЕНАРИЙ 0: АДМИН НАЖАЛ КНОПКУ [✅ Подтвердить оплату]
    // ==========================================
    // Проверяем нажатие кнопок ДО проверки обычных сообщений!
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      const adminChatId = String(body.callback_query.message.chat.id);
      const messageId = body.callback_query.message.message_id;

      if (callbackData.startsWith('confirm_')) {
        const bookingId = callbackData.replace('confirm_', '');

        // 1. Меняем статус брони в БД на подтвержденный
        const updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.confirmed },
          select: { shortId: true, memberId: true }
        });

        // 2. Меняем кнопку у админа на зеленую галочку (чтобы не нажать дважды)
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: [[{ text: '✅ ОПЛАЧЕНО', callback_data: 'ignore' }]] }
          })
        });

        // 3. Достаем профиль клиента и отправляем сообщение
        if (updatedBooking.memberId) {
          const profile = await prisma.memberProfile.findUnique({
            where: { id: updatedBooking.memberId },
            select: { tgChatId: true }
          });

          if (profile?.tgChatId) {
            await sendMessage(
              profile.tgChatId, 
              `🎉 Ура! Твоя оплата за бронь <b>#${updatedBooking.shortId}</b> успешно подтверждена.\n\nБилет активирован! Накануне выезда мы пришлем сюда точное время и место сбора.`
            );
          }
        }
      }
      
      // Обязательно отвечаем Telegram, что мы обработали клик
      return NextResponse.json({ status: 'ok' });
    }

    // ==========================================
    // ОБРАБОТКА ОБЫЧНЫХ СООБЩЕНИЙ (Текст, Фото)
    // ==========================================
    const message = body.message;

    // Если это не сообщение и не callback - игнорируем
    if (!message) {
      return NextResponse.json({ status: 'ignored' });
    }

    const chatId = String(message.chat.id);
    const text = message.text || '';

    // ==========================================
    // СЦЕНАРИЙ А: ПРИВЯЗКА КАБИНЕТА (/start user_XXX)
    // ==========================================
    if (text.startsWith('/start user_')) {
      const profileId = text.replace('/start user_', '').trim();
      
      if (profileId) {
        const profile = await prisma.memberProfile.findUnique({ where: { id: profileId } });
        if (profile) {
          await prisma.memberProfile.update({
            where: { id: profileId },
            data: { tgChatId: chatId }
          });
          await sendMessage(chatId, `🎉 Отлично, ${profile.name || 'путешественник'}! Telegram успешно привязан.\n\nТеперь вы будете первыми узнавать о новых датах для туров из вашего листа ожидания.`);
        } else {
          await sendMessage(chatId, `❌ Ошибка: Профиль не найден. Попробуйте перейти по ссылке из личного кабинета еще раз.`);
        }
      }
      return NextResponse.json({ status: 'ok' });
    }

    // ==========================================
    // СЦЕНАРИЙ Б: КЛИЕНТ ПЕРЕШЕЛ С САЙТА С НОМЕРОМ БРОНИ (/start 1024)
    // ==========================================
    if (text.match(/^\/start \d+$/)) {
      const shortIdStr = text.replace('/start ', '').trim();
      const shortId = parseInt(shortIdStr, 10);
      
      const booking = await prisma.booking.findFirst({ 
        where: { shortId },
        select: { 
          shortId: true, 
          totalPrice: true, 
          paymentMethod: true,
          tour: {
            select: { slug: true } // Просто проверяем связь
          }
        }
      });

      if (booking) {
        let replyText = `👋 Привет! Я нашел твою бронь <b>#${booking.shortId}</b> на сумму ${booking.totalPrice} руб.`;
        
        if (booking.paymentMethod === 'qr') {
          replyText += `\n\n🧾 Если ты уже оплатил тур по QR-коду Агропромбанка, <b>просто отправь фотографию чека (скриншот) прямо в этот чат!</b> Я передам её менеджеру.`;
        } else if (booking.paymentMethod === 'cash') {
          replyText += `\n\n💵 Ты выбрал оплату наличными на месте. За сутки до тура я пришлю сюда запрос на подтверждение участия. Не отключай уведомления!`;
        } else {
          replyText += `\n\nКак только менеджер подтвердит оплату, твой билет активируется. Сюда же придет точное место сбора и памятка по туру.`;
        }

        await sendMessage(chatId, replyText);
      } else {
        await sendMessage(chatId, `К сожалению, я не нашел бронь с номером #${shortId}. Пожалуйста, свяжитесь с менеджером.`);
      }
      return NextResponse.json({ status: 'ok' });
    }

    // ==========================================
    // СЦЕНАРИЙ В: КЛИЕНТ ПРИСЛАЛ ФОТОГРАФИЮ (ЧЕК)
    // ==========================================
    if (message.photo && message.photo.length > 0) {
      const photoId = message.photo[message.photo.length - 1].file_id;
      const caption = message.caption || '';
      const senderName = message.from?.first_name || 'Клиент';
      const username = message.from?.username ? `(@${message.from.username})` : '';

      await sendPhotoToAdmin(
        photoId, 
        `🧾 <b>НОВЫЙ ЧЕК / СКРИНШОТ</b>\nОт: ${senderName} ${username}\n${caption ? `💬 Подпись: ${escapeHtml(caption)}` : '<i>Без подписи</i>'}\n\nПроверьте оплату и переведите статус брони в "Оплачено" в админке.`
      );

      await sendMessage(chatId, `✅ Фото получено! Я передал его менеджеру. Как только оплату подтвердят, я сообщу тебе.`);
      return NextResponse.json({ status: 'ok' });
    }

    // Если просто текст без команды
    if (text && !text.startsWith('/')) {
      await sendMessage(chatId, `Если у вас есть вопросы по туру, лучше напишите нашему менеджеру. Я пока умею только принимать чеки и выдавать билеты 🤖`);
    }

    return NextResponse.json({ status: 'ok' });
    
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 200 });
  }
}

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

async function sendMessage(chatId: string, text: string) {
  const token = env.TELEGRAM_AUTH_BOT; // Отвечаем от лица того же бота, на котором висит вебхук
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text, 
      parse_mode: 'HTML' 
    })
  });
}

async function sendPhotoToAdmin(photoId: string, caption: string) {
  const token = env.TELEGRAM_AUTH_BOT; 
  const adminChatId = env.TELEGRAM_ADMIN_CHAT_ID;
  
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: adminChatId, 
      photo: photoId, 
      caption, 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '👤 Открыть Админку', url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin` }]
        ]
      }
    })
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}