import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

// Хелпер для быстрого ответа Telegram (чтобы он не дублировал запросы)
const ok = () => NextResponse.json({ ok: true }, { status: 200 });

export async function POST(req: Request) {
  try {
    // 1. Защита: Проверяем секретный токен Telegram
    const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (!secretHeader || secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // ==========================================\
    // СЦЕНАРИЙ 3: АДМИН НАЖАЛ КНОПКУ (МОДЕРАЦИЯ)
    // ==========================================\
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      const adminChatId = String(body.callback_query.message.chat.id);
      const messageId = body.callback_query.message.message_id;

      if (callbackData.startsWith('confirm_')) {
        const bookingId = callbackData.replace('confirm_', '');

        // Обновляем статус на confirmed
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'confirmed' }
        });

        // Меняем сообщение в админке
        await editAdminMessage(adminChatId, messageId, `✅ <b>ОПЛАЧЕНО (Бронь #${booking.shortId})</b>`);

        // Уведомляем клиента, если он привязан
        if (booking.payerTgChatId) {
          await sendMessage(
            booking.payerTgChatId,
            `🎉 Отличные новости! Ваша оплата по заявке <b>#${booking.shortId}</b> подтверждена.\nМы закрепили за вами места. Ждем вас в туре!`
          );
        }
      } else if (callbackData.startsWith('reject_')) {
        const bookingId = callbackData.replace('reject_', '');

        // Откатываем статус обратно к awaiting_payment, удаляем неверный чек
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'awaiting_payment', receiptUrl: null }
        });

        // Меняем сообщение в админке
        await editAdminMessage(adminChatId, messageId, `❌ <b>ОТКЛОНЕНО (Бронь #${booking.shortId})</b>`);

        // Уведомляем клиента
        if (booking.payerTgChatId) {
          await sendMessage(
            booking.payerTgChatId,
            `⚠️ К сожалению, администратор не смог подтвердить чек для заявки <b>#${booking.shortId}</b>.\nВозможно, скриншот обрезан, размыт или перевод не прошел.\nПожалуйста, проверьте данные и <b>отправьте фото чека еще раз</b> прямо в этот чат.`
          );
        }
      }

      // Обязательно отвечаем на callback_query, чтобы у админа не висели часики на кнопке
      await answerCallbackQuery(body.callback_query.id);
      return ok();
    }

    // Если это не сообщение, игнорируем
    if (!body.message) return ok();

    const chatId = String(body.message.chat.id);
    const text = body.message.text || '';

    // ==========================================\
    // СЦЕНАРИЙ 1: КЛИЕНТ ПЕРЕШЕЛ ПО ДИПЛИНКУ (/start {id})
    // ==========================================\
    if (text.startsWith('/start ')) {
      const shortIdStr = text.replace('/start ', '').trim();
      const shortId = parseInt(shortIdStr, 10);
      
      if (!isNaN(shortId)) {
        const booking = await prisma.booking.findUnique({
          where: { shortId }
        });

        if (!booking) {
          await sendMessage(chatId, 'К сожалению, заявка не найдена. Пожалуйста, проверьте номер.');
          return ok();
        }

        if (booking.status === 'confirmed') {
          await sendMessage(chatId, `Заявка <b>#${shortId}</b> уже оплачена и подтверждена! Ждем вас в туре.`);
          return ok();
        }

        // Привязываем текущий чат к этой брони
        await prisma.booking.update({
          where: { id: booking.id },
          data: { payerTgChatId: chatId }
        });

        if (booking.status === 'awaiting_payment') {
          await sendMessage(
            chatId, 
            `Вы оформляете оплату для заявки <b>#${shortId}</b>.\n\n📸 <b>Пожалуйста, отправьте скриншот чека об оплате (или купленный билет) прямо в этот чат картинкой.</b>\nМы проверим его и подтвердим вашу бронь.`
          );
        } else if (booking.status === 'moderation') {
          await sendMessage(chatId, `Ваш чек для заявки <b>#${shortId}</b> уже находится на проверке у администратора. Пожалуйста, ожидайте уведомления.`);
        }
      }
      return ok();
    }

    // ==========================================\
    // СЦЕНАРИЙ 2: КЛИЕНТ ПРИСЛАЛ ФОТО (ЧЕК)
    // ==========================================\
    if (body.message.photo) {
      // Ищем активную заявку пользователя, которая ждет чек
      const booking = await prisma.booking.findFirst({
        where: { payerTgChatId: chatId, status: 'awaiting_payment' },
        orderBy: { createdAt: 'desc' }
      });

      if (!booking) {
        await sendMessage(chatId, 'У вас нет заявок, ожидающих скриншота оплаты. Если вы хотите прислать чек для новой заявки, сначала перейдите в бота по кнопке с сайта.');
        return ok();
      }

      // Берем фото в самом высоком качестве (последнее в массиве)
      const bestPhoto = body.message.photo[body.message.photo.length - 1];
      const fileId = bestPhoto.file_id;

      try {
        // 1. Получаем прямую ссылку на файл от Telegram
        const fileUrl = await getTelegramFileUrl(fileId);
        
        // 2. Грузим в Cloudinary (если настроено, иначе сохраняем URL телеграма)
        const receiptUrl = await uploadToCloudinary(fileUrl);

        // 3. Обновляем статус брони на moderation
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'moderation', receiptUrl }
        });

      // 4. Отправляем чек админам на проверку через МЕНЕДЖЕРСКИЙ бот
        const caption = `🔎 <b>МОДЕРАЦИЯ ОПЛАТЫ</b>\n\n🆔 Бронь: <b>#${booking.shortId}</b>\n💳 Способ: <b>${booking.paymentMethod}</b>\n💰 Сумма: <b>${booking.totalPrice}</b>\n\nПодтверждаете получение средств?`;
        
        // ВАЖНО: Передаем receiptUrl (ссылку), а не fileId, потому что fileId не сработает в другом боте
        await sendModerationRequest(env.TELEGRAM_ADMIN_CHAT_ID, receiptUrl, caption, booking.id);

        // 5. Уведомляем клиента
        await sendMessage(chatId, `✅ Фото чека получено!\nМы проверяем оплату для заявки <b>#${booking.shortId}</b>. Как только администратор подтвердит её, мы сразу пришлём вам уведомление.`);
        
      } catch (e) {
        console.error('Ошибка обработки фото чека:', e);
        await sendMessage(chatId, 'Произошла ошибка при сохранении чека. Пожалуйста, попробуйте отправить фото еще раз.');
      }
      return ok();
    }

    return ok();

  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 200 }); // 200 чтобы ТГ не спамил
  }
}

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

async function sendMessage(chatId: string, text: string) {
  // КЛИЕНТСКИЙ БОТ (отвечаем пользователю)
  const token = env.TELEGRAM_AUTH_BOT; 
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

async function editAdminMessage(chatId: string, messageId: number, newText: string) {
  // АДМИНСКИЙ БОТ (редактируем сообщение в чате менеджеров)
  const token = env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/editMessageCaption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      message_id: messageId,
      caption: newText,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] } 
    })
  });
}

async function sendModerationRequest(adminChatId: string, imageUrl: string, caption: string, bookingId: string) {
  // АДМИНСКИЙ БОТ (кидаем чек на проверку)
  const token = env.TELEGRAM_BOT_TOKEN; 
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: adminChatId, 
      photo: imageUrl, // Передаем URL картинки из Cloudinary
      caption, 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Подтвердить', callback_data: `confirm_${bookingId}` }],
          [{ text: '❌ Отклонить', callback_data: `reject_${bookingId}` }]
        ]
      }
    })
  });
}

async function answerCallbackQuery(callbackQueryId: string) {
  // АДМИНСКИЙ БОТ (т.к. админ нажал кнопку под сообщением админского бота)
  const token = env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId })
  });
}

async function getTelegramFileUrl(fileId: string): Promise<string> {
  // КЛИЕНТСКИЙ БОТ (т.к. клиент прислал фото именно туда)
  const token = env.TELEGRAM_AUTH_BOT;
  const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (!data.ok) throw new Error('Не удалось получить файл от Telegram');
  return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}

async function uploadToCloudinary(fileUrl: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary ENV keys missing. Saving raw Telegram file URL.');
    return fileUrl;
  }

  const formData = new FormData();
  formData.append('file', fileUrl);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  
  return fileUrl;
}