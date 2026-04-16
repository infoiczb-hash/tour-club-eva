import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { NotificationHub } from '@/lib/notifications/hub';
import { Ratelimit } from '@upstash/ratelimit';
import { handleTelegramCallback } from '@/features/admin/actions/telegramInteractive';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { logSystemAction } from '@/lib/audit'; // ✅ ДОБАВЛЕН АУДИТ

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
    // СЦЕНАРИЙ 3: ОБРАБОТКА НАЖАТИЙ КНОПОК В TELEGRAM
    // ==========================================
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      if (!callbackData) return ok();

      // 🔥 НОВОЕ: СЦЕНАРИЙ КЛИЕНТ ПОДТВЕРЖДАЕТ ИЛИ ОТМЕНЯЕТ УЧАСТИЕ (НАЛИЧНЫЕ/ИНОСТРАНЦЫ)
      if (callbackData.startsWith('cash_confirm_') || callbackData.startsWith('cash_cancel_')) {
        const bookingId = callbackData.replace(/cash_confirm_|cash_cancel_/, '');
        const action = callbackData.startsWith('cash_confirm_') ? 'confirm' : 'cancel';
        
        const clientChatId = String(body.callback_query.message.chat.id);
        const messageId = body.callback_query.message.message_id;
        const originalText = body.callback_query.message.text || ''; // Забираем старый текст, чтобы он не пропал

        if (action === 'confirm') {
           // Клиент подтвердил: просто убираем кнопки и пишем "Успех"
           const newText = originalText + '\n\n✅ <b>Участие подтверждено! Ждем вас!</b>';
           await editClientMessage(clientChatId, messageId, newText);
        } else {
           // 🔥 НЕ отменяем автоматически. Переводим на менеджера.
          
          // 🔥 НОВОЕ: СЦЕНАРИЙ КЛИЕНТ НАЖАЛ "НАПИСАТЬ ОТЗЫВ"
      if (callbackData.startsWith('write_review_')) {
        const bookingId = callbackData.replace('write_review_', '');
        const clientChatId = String(body.callback_query.message.chat.id);
        const messageId = body.callback_query.message.message_id;
        const originalText = body.callback_query.message.text || ''; 

        // 1. Записываем состояние ожидания отзыва в Redis (ключ живет 1 час)
        await redis.set(`review_state:${clientChatId}`, bookingId, { ex: 3600 });
        
        // 2. Меняем сообщение, просим написать текст
        const newText = originalText + '\n\n👇 <b>Пожалуйста, отправьте ваш отзыв следующим текстовым сообщением прямо в этот чат.</b>';
        await editClientMessage(clientChatId, messageId, newText);
        await answerClientCallbackQuery(body.callback_query.id);
        return ok();
      }
          const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { tour: true }});
           
           if (booking && booking.status !== 'cancelled') {
               // 1. Уведомляем Администратора о запросе на отмену
               const adminMsg = `🚨 <b>ЗАПРОС НА ОТМЕНУ (Менее 24ч / 3 дней)</b>\nБронь #${booking.shortId} на тур «${booking.tour.title}».\n👤 Клиент: ${booking.name} (${booking.phone})\n\n⚠️ <b>Места ПОКА НЕ ОСВОБОЖДЕНЫ.</b>\nКлиент нажал кнопку отмены. Свяжитесь с ним для выяснения причин. Если отмена подтверждается — отмените бронь вручную в CRM (это автоматически вернет места в продажу и запустит Лист Ожидания).`;
               
               // Используем publishToTelegram (он уже импортирован в самом верху твоего файла)
               await publishToTelegram(
                 adminMsg,
                 undefined,
                 undefined,
                 false,
                 { messageThreadId: env.TELEGRAM_TOPIC_BOOKINGS } // Уйдет в топик с бронями
               ); 

               // 2. Меняем сообщение клиенту, направляя к менеджеру
               const newText = originalText + '\n\n⚠️ <b>Мы получили ваш запрос.</b>\nТак как до старта осталось мало времени, пожалуйста, напишите нашему менеджеру для решения этого вопроса: @romansvtirase';
               await editClientMessage(clientChatId, messageId, newText);
           } else {
               await editClientMessage(clientChatId, messageId, originalText + '\n\n⚠️ Бронь уже была отменена ранее.');
           }
        }
        await answerClientCallbackQuery(body.callback_query.id);
        return ok();
      }

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

          // ✅ СИСТЕМНЫЙ АУДИТ: Логируем подтверждение брони админом через кнопку Telegram
          Promise.resolve().then(() => {
            logSystemAction('TELEGRAM_BOOKING_CONFIRMED', {
              targetId: booking.id,
              changes: { shortId: booking.shortId, admin: adminName }
            }).catch(console.error);
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

          // ✅ СИСТЕМНЫЙ АУДИТ: Логируем отклонение оплаты админом
          Promise.resolve().then(() => {
            logSystemAction('TELEGRAM_BOOKING_REJECTED', {
              targetId: booking.id,
              changes: { shortId: booking.shortId, admin: adminName }
            }).catch(console.error);
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
    // 🔥 НОВОЕ: ПЕРЕХВАТЧИК ТЕКСТОВОГО ОТЗЫВА (REDIS)
    // ==========================================
    const reviewBookingId = await redis.get<string>(`review_state:${chatId}`);
    
    // Если мы ждем отзыв, текст существует и это не команда
    if (reviewBookingId && text && !text.startsWith('/')) {
        const booking = await prisma.booking.findUnique({ 
            where: { id: reviewBookingId }, 
            include: { tour: true } 
        });
        
        if (booking) {
            // 1. Строго по schema.prisma: сохраняем отзыв на модерацию (isActive: false)
            await prisma.review.create({
                data: {
                    tourId: booking.tourId,
                    memberId: booking.memberId, // Prisma спокойно примет null, если это Гость
                    name: booking.name,         // Имя клиента из брони
                    text: text,                 // Текст отзыва
                    rating: 5,                  // Дефолтная оценка
                    source: 'tg',               // Источник
                    isActive: false             // 🔥 Отправляет на модерацию (скрыт на сайте)
                }
            });

            // ✅ СИСТЕМНЫЙ АУДИТ: Логируем получение отзыва
            Promise.resolve().then(() => {
              logSystemAction('REVIEW_SUBMITTED_VIA_TELEGRAM', {
                targetId: booking.id,
                changes: { shortId: booking.shortId, textLength: text.length }
              }).catch(console.error);
            });
            
            // 2. Удаляем состояние ожидания из Redis
            await redis.del(`review_state:${chatId}`);
            
            // 3. Отправляем спасибо клиенту
            await sendMessage(chatId, '✅ <b>Спасибо за ваш отзыв!</b>\nОн отправлен на модерацию. Как только администратор опубликует его, мы начислим вам бонусные баллы!\n\n<i>Если вы захотите дополнить или отредактировать отзыв, это всегда можно сделать в Личном кабинете на сайте.</i>');
            
            // 4. Уведомляем админов в рабочий чат
            const adminMsg = `⭐️ <b>НОВЫЙ ОТЗЫВ (На модерации)</b>\nТур: «${booking.tour.title}»\n👤 Клиент: ${booking.name}\n\n💬 Текст: <i>${text}</i>\n\nМодерировать отзыв, чтобы начислить бонусы, можно в Админ-панели на сайте.`;
            
            await publishToTelegram(
                adminMsg, 
                undefined, 
                undefined, 
                false, 
                { messageThreadId: env.TELEGRAM_TOPIC_BOOKINGS } 
            );
        }
        return ok(); // Завершаем запрос
    }
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
    // СЦЕНАРИЙ 2: КЛИЕНТ ПРИСЛАЛ ФОТО ИЛИ ФАЙЛ (ЧЕК) - ОПТИМИЗИРОВАН
    // ==========================================
    if (body.message?.photo || body.message?.document) {
      console.log(`📸 Получен чек от chatId: ${chatId}`);

      // ✅ ИЩЕМ САМУЮ СВЕЖУЮ бронь, добавляем статус 'moderation' в поиск
      const booking = await prisma.booking.findFirst({
        where: { 
          payerTgChatId: chatId,
          status: { in: ['awaiting_payment', 'pending', 'rejected', 'moderation'] }
        },
        include: { tour: { select: { currency: true, title: true } } },
        orderBy: { createdAt: 'desc' }
      });

      if (!booking) {
        await sendMessage(chatId, 'У вас нет активных заявок, ожидающих оплаты. Если нужно — начните новую бронь на сайте.');
        return ok();
      }

      console.log(`✅ Найдена заявка #${booking.shortId} (статус: ${booking.status})`);

      let fileId = body.message.photo 
        ? body.message.photo[body.message.photo.length - 1].file_id 
        : body.message.document?.file_id;

      if (!fileId) return ok();

      try {
        const fileUrl = await getTelegramFileUrl(fileId);
        const receiptUrl = await uploadToCloudinary(fileUrl); // Сюда вернется либо Cloudinary URL, либо Telegram URL

        // 🔥 ИСПРАВЛЕНИЕ: используем update вместо updateMany
        await prisma.booking.update({
          where: { id: booking.id },
          data: { 
            status: 'moderation', 
            paymentProofUrl: receiptUrl 
          }
        });

        // Аудит
        Promise.resolve().then(() => {
          logSystemAction('PAYMENT_PROOF_RECEIVED', {
            targetId: booking.id,
            changes: { shortId: booking.shortId, receiptUrl }
          }).catch(console.error);
        });

        const caption = `🔎 <b>МОДЕРАЦИЯ ОПЛАТЫ</b>\n\n🆔 Бронь: <b>#${booking.shortId}</b>\n👤 ${booking.name}\n💳 ${booking.paymentMethod || '—'}\n💰 ${booking.totalPrice} ${booking.tour?.currency || 'MDL'}\n\nПодтверждаете получение средств?`;

        // Отправляем админу и клиенту
        await Promise.allSettled([
          sendModerationRequest(
            env.TELEGRAM_ADMIN_CHAT_ID, 
            receiptUrl, 
            caption, 
            booking.id
          ),
          sendMessage(chatId, `✅ Файл чека получен!\nМы проверяем оплату для заявки <b>#${booking.shortId}</b>. Как только администратор подтвердит её, мы сразу пришлём вам уведомление.`)
        ]);

      } catch (e: unknown) {
        console.error('Ошибка обработки чека:', e);
        await sendMessage(chatId, '❌ Не удалось сохранить чек. Попробуйте отправить ещё раз.');
      }
      return ok();
    }

    return ok();

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Telegram Webhook Error:', err);
    
    // ✅ СИСТЕМНЫЙ АУДИТ: Логируем падение вебхука
    Promise.resolve().then(() => {
      logSystemAction('TELEGRAM_WEBHOOK_CRITICAL_ERROR', {
        changes: { error: err.message, stack: err.stack }
      }).catch(console.error);
    });

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
  
// 🔥 РЕШЕНИЕ 1: Направляем сообщение в топик (ОБЯЗАТЕЛЬНО ЧИСЛОМ)
  const topicId = env.TELEGRAM_TOPIC_MONEY || env.TELEGRAM_TOPIC_BOOKINGS;
  if (topicId) {
    body.message_thread_id = parseInt(topicId, 10);
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

// Обновляет сообщение КЛИЕНТА (использует токен клиентского бота)
async function editClientMessage(chatId: string, messageId: number, newText: string) {
  const token = env.TELEGRAM_AUTH_BOT; // Используем токен клиентского бота!
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      message_id: messageId, 
      text: newText, 
      parse_mode: 'HTML', 
      reply_markup: { inline_keyboard: [] } // Очищаем кнопки после нажатия
    })
  });
}

// Отправляет Telegram сигнал, что кнопка нажата (убирает часики с кнопки)
async function answerClientCallbackQuery(callbackQueryId: string) {
  const token = env.TELEGRAM_AUTH_BOT;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId })
  });
}