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

    // ==========================================
    // СЦЕНАРИЙ 3: АДМИН НАЖАЛ КНОПКУ В ТГ (МОДЕРАЦИЯ)
    // ==========================================
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      const adminChatId = String(body.callback_query.message.chat.id);
      const messageId = body.callback_query.message.message_id;
      // Вытягиваем имя админа, который нажал кнопку (для логов)
      const adminName = body.callback_query.from.username ? `@${body.callback_query.from.username}` : (body.callback_query.from.first_name || 'Admin');

      if (callbackData.startsWith('confirm_')) {
        const bookingId = callbackData.replace('confirm_', '');

        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: { 
            status: 'confirmed',
            confirmedBy: adminName,
            confirmedAt: new Date()
          }
        });

        const telegramTasks = [
          editAdminMessage(adminChatId, messageId, `✅ <b>ОПЛАЧЕНО (Бронь #${booking.shortId})</b>\nПодтвердил: ${adminName}`)
        ];

        if (booking.payerTgChatId) {
          telegramTasks.push(
            sendMessage(
              booking.payerTgChatId,
              `🎉 Отличные новости! Ваша оплата по заявке <b>#${booking.shortId}</b> подтверждена.\nМы закрепили за вами места. Ждем вас в туре!`
            )
          );
        }

        await Promise.allSettled(telegramTasks);
        
      } else if (callbackData.startsWith('reject_')) {
        const bookingId = callbackData.replace('reject_', '');

        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'awaiting_payment', paymentProofUrl: null }
        });

        const telegramTasks = [
          editAdminMessage(adminChatId, messageId, `❌ <b>ОТКЛОНЕНО (Бронь #${booking.shortId})</b>\nОтклонил: ${adminName}`)
        ];

        if (booking.payerTgChatId) {
          telegramTasks.push(
            sendMessage(
              booking.payerTgChatId,
              `⚠️ К сожалению, мы не смогли подтвердить чек для заявки <b>#${booking.shortId}</b>.\nВозможно, скриншот обрезан, размыт или перевод не прошел.\nПожалуйста, проверьте данные и <b>отправьте фото чека еще раз</b> прямо в этот чат.`
            )
          );
        }
        
        await Promise.allSettled(telegramTasks);
      }

      await answerCallbackQuery(body.callback_query.id);
      return ok();
    }

    if (!body.message) return ok();

    const chatId = String(body.message.chat.id);
    const text = body.message.text || '';

    // ==========================================
    // СЦЕНАРИЙ 1: КЛИЕНТ ПЕРЕШЕЛ ПО ДИПЛИНКУ (/start {id})
    // ==========================================
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

        await prisma.booking.update({
          where: { id: booking.id },
          data: { payerTgChatId: chatId }
        });

        if (booking.status === 'awaiting_payment' || booking.status === 'pending') {
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

    // ==========================================
    // СЦЕНАРИЙ 2: КЛИЕНТ ПРИСЛАЛ ФОТО ИЛИ ФАЙЛ (ЧЕК)
    // ==========================================
    if (body.message?.photo || body.message?.document) {
      console.log(`📸 Получен чек от chatId: ${chatId}`);

      // 1. Ищем заявку этого клиента. 
      // ВАЖНО: Добавлен include: { tour: true }, чтобы достать валюту (MDL/RUB)
      const booking = await prisma.booking.findFirst({
        where: { 
            payerTgChatId: chatId, 
            status: { in: ['awaiting_payment', 'pending', 'rejected'] } 
        },
        include: { tour: { select: { currency: true } } },
        orderBy: { createdAt: 'desc' }
      });

      if (!booking) {
        // Если заявка не найдена, возможно она УЖЕ на модерации (дубль из альбома)
        const checkModeration = await prisma.booking.findFirst({
          where: { payerTgChatId: chatId, status: 'moderation' }
        });

        if (checkModeration) {
          console.log(`📸 Игнорируем дубликат фото из альбома для chatId: ${chatId}`);
          return ok();
        }

        await sendMessage(chatId, 'У вас нет заявок, ожидающих скриншота оплаты. Если вы хотите прислать чек для новой заявки, сначала перейдите в бота по кнопке с сайта.');
        return ok();
      }

      console.log(`✅ Найдена заявка #${booking.shortId}`);

      let fileId = '';
      if (body.message.photo) {
          fileId = body.message.photo[body.message.photo.length - 1].file_id;
      } else if (body.message.document) {
          fileId = body.message.document.file_id;
      }

      try {
        const fileUrl = await getTelegramFileUrl(fileId);
        const receiptUrl = await uploadToCloudinary(fileUrl);

        // 2. АТОМАРНОЕ ОБНОВЛЕНИЕ (ЗАЩИТА ОТ ГОНКИ ЗАПРОСОВ ПРИ ОТПРАВКЕ АЛЬБОМА)
        const updateResult = await prisma.booking.updateMany({
          where: { 
            id: booking.id,
            status: { in: ['awaiting_payment', 'pending', 'rejected'] }
          },
          data: { status: 'moderation', paymentProofUrl: receiptUrl }
        });

        // Если count === 0, значит другой процесс (соседнее фото из альбома) уже обновил статус до миллисекунды назад
        if (updateResult.count === 0) {
          console.log(`📸 Фото дубль. Бронь #${booking.shortId} уже захвачена другим процессом.`);
          return ok();
        }

        const caption = `🔎 <b>МОДЕРАЦИЯ ОПЛАТЫ</b>\n\n🆔 Бронь: <b>#${booking.shortId}</b>\n👤 Клиент: <b>${booking.name}</b>\n💳 Способ: <b>${booking.paymentMethod || 'Не указан'}</b>\n💰 К оплате: <b>${booking.totalPrice} ${booking.tour?.currency || 'MDL'}</b>\n\nПодтверждаете получение средств?`;
        
        // 3. ТУРБО-РЕЖИМ: Отправляем админу и клиенту параллельно
        await Promise.allSettled([
          sendModerationRequest(env.TELEGRAM_ADMIN_CHAT_ID, receiptUrl, caption, booking.id),
          sendMessage(chatId, `✅ Фото чека получено!\nМы проверяем оплату для заявки <b>#${booking.shortId}</b>. Как только администратор подтвердит её, мы сразу пришлём вам уведомление.`)
        ]);
        
      } catch (e) {
        console.error('Ошибка обработки фото чека:', e);
        await sendMessage(chatId, 'Произошла ошибка при сохранении чека. Пожалуйста, попробуйте отправить фото еще раз чуть позже.');
      }
      return ok();
    }

    return ok();

  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 200 }); 
  }
}

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

async function sendMessage(chatId: string, text: string) {
  const token = env.TELEGRAM_AUTH_BOT; 
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}

async function editAdminMessage(chatId: string, messageId: number, newText: string) {
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
  const token = env.TELEGRAM_BOT_TOKEN; 
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: adminChatId, 
      photo: imageUrl, 
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
  const token = env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId })
  });
}

async function getTelegramFileUrl(fileId: string): Promise<string> {
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