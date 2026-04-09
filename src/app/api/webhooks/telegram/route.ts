import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { NotificationHub } from '@/lib/notifications/hub';
import { Ratelimit } from '@upstash/ratelimit';
import { handleTelegramCallback } from '@/features/admin/actions/telegramInteractive';

// Инициализируем Redis (оставляем твой вариант из оригинала)
const redis = Redis.fromEnv();

// Инициализируем Лимитер: 50 апдейтов в 10 секунд
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(50, '10 s'),
  analytics: true,
});

// Хелпер для быстрого ответа Telegram (чтобы он не дублировал запросы)
const ok = () => NextResponse.json({ ok: true }, { status: 200 });

export async function POST(req: Request) {
  try {
    // 1. Защита: Проверяем секретный токен Telegram
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token') || req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (!secretHeader || secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate Limiting (Защита от спама)
    const ip = req.headers.get('x-forwarded-for') ?? 'telegram-servers';
    const { success } = await ratelimit.limit(`tg_webhook_rate:${ip}`);
    if (!success) {
      console.warn('[Webhook] Rate limit exceeded for IP:', ip);
      return ok(); // Отвечаем 200, чтобы Telegram не переотправлял спам
    }

    const body = await req.json();

    // ==========================================
    // 🛡 ЗАЩИТА ОТ REPLAY-АТАК И ДУБЛЕЙ (SEC-ADV-01)
    // ==========================================
    const updateId = body.update_id;
    if (updateId) {
      const key = `tg:update:${updateId}`;
      
      // Атомарная запись: установит '1' и вернет "OK", ТОЛЬКО если ключа еще нет.
      // ex: 86400 (храним 24 часа), nx: true (Not eXists - только если нет)
      const isNew = await redis.set(key, '1', { ex: 86400, nx: true });
      
      if (!isNew) {
        console.log(`[Telegram Webhook] Пропуск дубликата update_id: ${updateId}`);
        return ok(); // Отдаем 200, чтобы Telegram перестал слать этот запрос
      }
    }
    // ==========================================

    // ==========================================
    // СЦЕНАРИЙ 3: АДМИН НАЖАЛ КНОПКУ В ТГ (МОДЕРАЦИЯ)
    // ==========================================
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      if (!callbackData) return ok();

      // ✅ ВАЖНО: Разделяем твою старую логику оплат и новую логику Пакета 2
      if (callbackData.startsWith('confirm_') || callbackData.startsWith('reject_')) {
        const adminChatId = String(body.callback_query.message.chat.id);
        const messageId = body.callback_query.message.message_id;
        const adminName = body.callback_query.from.username ? `@${body.callback_query.from.username}` : (body.callback_query.from.first_name || 'Admin');

        if (callbackData.startsWith('confirm_')) {
          const bookingId = callbackData.replace('confirm_', '');

          // 1. Меняем статус в базе
          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { 
              status: 'confirmed',
              confirmedBy: adminName,
              confirmedAt: new Date()
            },
            include: { tour: true, tourDate: true }
          });

          // 2. Уведомляем админа в рабочем чате напрямую
          const telegramTasks: Promise<any>[] = [
            editAdminMessage(adminChatId, messageId, `✅ <b>ОПЛАЧЕНО (Бронь #${booking.shortId})</b>\nПодтвердил: ${adminName}`)
          ];

          // 3. 🔥 Уведомляем клиента через Единую Шину (Хаб)
          if (booking.memberId) {
            telegramTasks.push(NotificationHub.dispatch({
              eventId: 'BOOKING_CONFIRMED',
              memberId: booking.memberId,
              data: {
                bookingId: booking.id,
                shortId: booking.shortId,
                tourTitle: booking.tour?.title,
                tourSlug: booking.tour?.slug,
                meetingPoint: booking.tourDate?.meetingPoint || booking.tour?.meetingPoint,
                meetingTime: booking.tourDate?.time,
                importantInfo: booking.tour?.importantInfo
              }
            }));
          } else if (booking.payerTgChatId) {
            // 🔥 РЕШЕНИЕ 3: Красивое сообщение для "Гостей" (без аккаунта)
            const meetingInfo = booking.tourDate?.meetingPoint || booking.tour?.meetingPoint || 'Будет уточнено гидом';
            const meetingTime = booking.tourDate?.time || '08:30';
            const important = booking.tour?.importantInfo ? `\n\n🎒 <b>Важно:</b> ${booking.tour.importantInfo}` : '';
            const clientMsg = `🎉 <b>Оплата получена!</b>\n\nВаше место в туре «${booking.tour?.title}» официально забронировано.\n\n📍 <b>Место сбора:</b> ${meetingInfo}\n⏰ <b>Время:</b> ${meetingTime}${important}`;
            telegramTasks.push(sendMessage(booking.payerTgChatId, clientMsg));
          }

          await Promise.allSettled(telegramTasks);
          
        } else if (callbackData.startsWith('reject_')) {
          const bookingId = callbackData.replace('reject_', '');

          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'awaiting_payment', paymentProofUrl: null },
            include: { tour: true }
          });

          const telegramTasks: Promise<any>[] = [
            editAdminMessage(adminChatId, messageId, `❌ <b>ОТКЛОНЕНО (Бронь #${booking.shortId})</b>\nОтклонил: ${adminName}`)
          ];

          // 🔥 Уведомляем клиента через Хаб об ошибке
          if (booking.memberId) {
            telegramTasks.push(NotificationHub.dispatch({
              eventId: 'PAYMENT_REJECTED',
              memberId: booking.memberId,
              data: {
                bookingId: booking.id,
                shortId: booking.shortId,
                tourTitle: booking.tour?.title,
              }
            }));
          } else if (booking.payerTgChatId) {
            // 🔥 РЕШЕНИЕ 3: Сообщение об ошибке для "Гостей" (без аккаунта)
            const clientMsg = `❌ <b>Ошибка оплаты</b>\n\nК сожалению, мы не смогли подтвердить оплату заявки <b>#${booking.shortId}</b> на тур «${booking.tour?.title}».\nВозможно, скриншот/файл обрезан, размыт или платеж завис в банке.\n\nПожалуйста, отправьте чек еще раз прямо в этот чат.`;
            telegramTasks.push(sendMessage(booking.payerTgChatId, clientMsg));
          }
          
          await Promise.allSettled(telegramTasks);
        }

        await answerCallbackQuery(body.callback_query.id);
      } else {
        // 🔥 ДЕЛЕГИРУЕМ НОВЫЕ КНОПКИ (из Пакета 2: Отзывы, Лиды и т.д.)
        await handleTelegramCallback(body.callback_query);
      }
      
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
            `Вы оформляете оплату для заявки <b>#${shortId}</b>.\n\n📸 <b>Пожалуйста, отправьте скриншот чека об оплате (или купленный билет) прямо в этот чат картинкой или файлом.</b>\nМы проверим его и подтвердим вашу бронь.`
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

      const booking = await prisma.booking.findFirst({
        where: { 
            payerTgChatId: chatId, 
            status: { in: ['awaiting_payment', 'pending', 'rejected'] } 
        },
        include: { tour: { select: { currency: true } } },
        orderBy: { createdAt: 'desc' }
      });

      if (!booking) {
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

        const updateResult = await prisma.booking.updateMany({
          where: { 
            id: booking.id,
            status: { in: ['awaiting_payment', 'pending', 'rejected'] }
          },
          data: { status: 'moderation', paymentProofUrl: receiptUrl }
        });

        if (updateResult.count === 0) {
          console.log(`📸 Фото дубль. Бронь #${booking.shortId} уже захвачена другим процессом.`);
          return ok();
        }

        const caption = `🔎 <b>МОДЕРАЦИЯ ОПЛАТЫ</b>\n\n🆔 Бронь: <b>#${booking.shortId}</b>\n👤 Клиент: <b>${booking.name}</b>\n💳 Способ: <b>${booking.paymentMethod || 'Не указан'}</b>\n💰 К оплате: <b>${booking.totalPrice} ${booking.tour?.currency || 'MDL'}</b>\n\nПодтверждаете получение средств?`;
        
        await Promise.allSettled([
          sendModerationRequest(env.TELEGRAM_ADMIN_CHAT_ID, receiptUrl, caption, booking.id),
          sendMessage(chatId, `✅ Файл чека получен!\nМы проверяем оплату для заявки <b>#${booking.shortId}</b>. Как только администратор подтвердит её, мы сразу пришлём вам уведомление.`)
        ]);
        
      } catch (e: unknown) {
        console.error('Ошибка обработки фото чека:', e);
        await sendMessage(chatId, 'Произошла ошибка при сохранении чека. Пожалуйста, попробуйте отправить его еще раз чуть позже.');
      }
      return ok();
    }

    return ok();

  } catch (error: unknown) {
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

async function sendModerationRequest(adminChatId: string, fileUrl: string, caption: string, bookingId: string) {
  const token = env.TELEGRAM_BOT_TOKEN; 
  
  // 🔥 РЕШЕНИЕ 1: Поддержка отправки PDF-документов
  const isDocument = fileUrl.toLowerCase().includes('.pdf');
  const method = isDocument ? 'sendDocument' : 'sendPhoto';

  const body: any = { 
    chat_id: adminChatId, 
    caption, 
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Подтвердить', callback_data: `confirm_${bookingId}` }],
        [{ text: '❌ Отклонить', callback_data: `reject_${bookingId}` }]
      ]
    }
  };

  if (isDocument) body.document = fileUrl;
  else body.photo = fileUrl;

  // 🔥 РЕШЕНИЕ 1: Направляем сообщение в топик (если он есть)
  if (env.TELEGRAM_TOPIC_MONEY) {
    body.message_thread_id = env.TELEGRAM_TOPIC_MONEY;
  } else if (env.TELEGRAM_TOPIC_BOOKINGS) {
    body.message_thread_id = env.TELEGRAM_TOPIC_BOOKINGS;
  }

  await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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

  // 🔥 РЕШЕНИЕ 2: Используем /auto/upload чтобы Cloudinary кушал PDF
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  
  return fileUrl;
}