import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { NotificationHub } from '@/lib/notifications/hub';
import { Ratelimit } from '@upstash/ratelimit';
import { handleTelegramCallback } from '@/features/admin/actions/telegramInteractive';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { logSystemAction } from '@/lib/audit';
import { updateBookingStatusAction } from '@/features/admin/actions/bookingStatus';
import { Prisma } from '@prisma/client';

// ─── ТИПИЗАЦИЯ БЕЗ ANY ───────────────────────────────────────────────────────

interface ChecklistItem {
  title: string;
  items: string;
}

type BookingWithDetails = Prisma.BookingGetPayload<{
  include: { 
    tour: { include: { category: true } };
    tourDate: true;
  }
}>;

// ─── КОНФИГУРАЦИЯ ────────────────────────────────────────────────────────────

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(50, '10 s'),
  analytics: true,
});

const ok = () => NextResponse.json({ ok: true }, { status: 200 });

// ─── ХЕЛПЕРЫ ВЕРСТКИ ─────────────────────────────────────────────────────────

function buildRichConfirmationMsg(booking: BookingWithDetails): string {
  const tourDateStr = booking.tourDate?.startDate
    ? new Date(booking.tourDate.startDate).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : '';

  const meetingInfo = booking.tourDate?.meetingPoint || booking.tour?.meetingPoint || 'Будет уточнено гидом';
  const meetingTime = booking.tourDate?.time || '08:30';
  const important = booking.tour?.importantInfo ? `\n\n🎒 <b>Важно:</b> ${booking.tour.importantInfo}` : '';

  let checklistBlock = '';
  const checklist = (booking.tour?.checklist as unknown as ChecklistItem[]) || [];
  if (checklist.length > 0) {
    checklistBlock = '\n\n🎒 <b>Что взять с собой:</b>\n';
    checklist.forEach((item) => {
      checklistBlock += `• <b>${item.title}</b>: ${item.items}\n`;
    });
  }

  const chatBlock = booking.tourDate?.groupChatUrl
    ? `\n\n<a href="${booking.tourDate.groupChatUrl}">💬 Вступить в чат группы</a>`
    : '';

  return [
    '🎉 <b>Участие подтверждено! Ждем вас!</b>',
    '',
    `Ваше место в туре «${booking.tour?.title}» официально забронировано.`,
    tourDateStr ? `📅 <b>Дата:</b> ${tourDateStr}` : '',
    `📍 <b>Место сбора:</b> ${meetingInfo}`,
    `⏰ <b>Время:</b> ${meetingTime}`,
    important,
    checklistBlock,
    chatBlock,
  ].filter(Boolean).join('\n');
}

// ─── ГЛАВНЫЙ ОБРАБОТЧИК ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token') || req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (!secretHeader || secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') ?? 'telegram-servers';
    const { success } = await ratelimit.limit(`tg_webhook_rate:${ip}`);
    if (!success) {
      console.warn('[Webhook] Rate limit exceeded for IP:', ip);
      return ok();
    }

    const body = await req.json();

    const updateId = body.update_id;
    if (updateId) {
      const key = `tg:update:${updateId}`;
      const isNew = await redis.set(key, '1', { ex: 86400, nx: true });
      if (!isNew) {
        console.log(`[Telegram Webhook] Пропуск дубликата update_id: ${updateId}`);
        return ok();
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ОБРАБОТКА CALLBACK КНОПОК
    // ─────────────────────────────────────────────────────────────────────────
    if (body.callback_query) {
      const callbackData = body.callback_query.data;
      if (!callbackData) return ok();

      const clientChatId = String(body.callback_query.message.chat.id);
      const messageId = body.callback_query.message.message_id;
      const originalText = body.callback_query.message.text || '';
      const adminName = body.callback_query.from.username ? `@${body.callback_query.from.username}` : (body.callback_query.from.first_name || 'Admin');

      // СЦЕНАРИЙ: НАПИСАТЬ ОТЗЫВ
      if (callbackData.startsWith('write_review_')) {
        const bookingId = callbackData.replace('write_review_', '');
        await redis.set(`review_state:${clientChatId}`, bookingId, { ex: 3600 });
        const newText = originalText + '\n\n👇 <b>Пожалуйста, отправьте ваш отзыв следующим текстовым сообщением прямо в этот чат.</b>';
        await editClientMessage(clientChatId, messageId, newText);
        await answerClientCallbackQuery(body.callback_query.id);
        return ok();
      }

      // СЦЕНАРИЙ: ПОДТВЕРЖДЕНИЕ НАЛИЧНЫМИ / ЮРИДИЧЕСКАЯ ОТМЕНА
      if (callbackData.startsWith('cash_confirm_') || callbackData.startsWith('cash_cancel_')) {
        const bookingId = callbackData.replace(/cash_confirm_|cash_cancel_/, '');
        const action = callbackData.startsWith('cash_confirm_') ? 'confirm' : 'cancel';

        if (action === 'confirm') {
          // Обновляем статус в БД (списание мест и запуск логики подтверждения)
          await updateBookingStatusAction({
            bookingId,
            newStatus: 'confirmed',
            adminName: 'Клиент (наличные)'
          });

          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { tour: { include: { category: true } }, tourDate: true }
          }) as BookingWithDetails;

          if (booking) {
            const tasks: Promise<unknown>[] = [];
            
            // А) Хаб (Страховка: Email + Колокольчик на сайте)
            if (booking.memberId) {
              tasks.push(NotificationHub.dispatch({
                eventId: 'BOOKING_CONFIRMED',
                memberId: booking.memberId,
                data: {
                  bookingId: booking.id,
                  shortId: booking.shortId,
                  tourTitle: booking.tour?.title,
                  totalPrice: Number(booking.totalPrice),
                  currency: booking.tour?.currency ?? 'RUB',
                  meetingPoint: booking.tourDate?.meetingPoint || booking.tour?.meetingPoint,
                  meetingTime: booking.tourDate?.time,
                }
              }));
            }

            // Б) Памятка в Telegram (UX)
            const confirmMsg = buildRichConfirmationMsg(booking);
            tasks.push(editClientMessage(clientChatId, messageId, originalText + '\n\n' + confirmMsg));
            await Promise.allSettled(tasks);
          }
        } else {
          // ✅ ПРАВКА: Юридически грамотный отказ от отмены через кнопку
          const cancelMsg = `\n\n⚠️ <b>Отмена бронирования</b>\n\nЕсли вы хотите отменить свою бронь, пожалуйста, обратитесь к нашему администратору: @romansvtirase.\n\nОбратите внимание, что условия отмены и возврата средств регламентируются нашей <a href="https://твой-сайт.рф/offer">Публичной офертой</a>.`;
          
          await editClientMessage(clientChatId, messageId, originalText + cancelMsg);
        }
        await answerClientCallbackQuery(body.callback_query.id);
        return ok();
      }

      // СЦЕНАРИЙ: АДМИН ПОДТВЕРЖДАЕТ / ОТКЛОНЯЕТ ОПЛАТУ
      if (callbackData.startsWith('confirm_') || callbackData.startsWith('reject_')) {
        const adminChatId = String(body.callback_query.message.chat.id);

        if (callbackData.startsWith('confirm_')) {
          const bookingId = callbackData.replace('confirm_', '');
          const result = (await updateBookingStatusAction({ bookingId, newStatus: 'confirmed', adminName })) as { success: boolean };

          if (!result.success) return ok();

          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { tour: { include: { category: true } }, tourDate: true }
          }) as BookingWithDetails;

          if (booking) {
            const tasks: Promise<unknown>[] = [
              editAdminMessage(adminChatId, messageId, `✅ <b>ОПЛАЧЕНО (Бронь #${booking.shortId})</b>\nПодтвердил: ${adminName}`)
            ];

            // Дублируем в Хаб для Email-чека
            if (booking.memberId) {
              tasks.push(NotificationHub.dispatch({
                eventId: 'BOOKING_CONFIRMED',
                memberId: booking.memberId,
                data: {
                  bookingId: booking.id,
                  shortId: booking.shortId,
                  tourTitle: booking.tour?.title,
                  totalPrice: Number(booking.totalPrice),
                  currency: booking.tour?.currency ?? 'RUB',
                  meetingPoint: booking.tourDate?.meetingPoint || booking.tour?.meetingPoint,
                  meetingTime: booking.tourDate?.time,
                }
              }));
            }

            // Подробная памятка клиенту в TG
            if (booking.payerTgChatId) {
              const clientMsg = buildRichConfirmationMsg(booking);
              tasks.push(sendMessage(booking.payerTgChatId, clientMsg));
            }

            await Promise.allSettled(tasks);
          }
        } else if (callbackData.startsWith('reject_')) {
          const bookingId = callbackData.replace('reject_', '');
          await updateBookingStatusAction({ bookingId, newStatus: 'awaiting_payment', rejectReason: 'Отклонено менеджером через Telegram' });
          const booking = await prisma.booking.update({ where: { id: bookingId }, data: { paymentProofUrl: null }, include: { tour: true } });
          
          const tasks: Promise<unknown>[] = [
            editAdminMessage(adminChatId, messageId, `❌ <b>ОТКЛОНЕНО (Бронь #${booking.shortId})</b>\nОтклонил: ${adminName}`)
          ];

          if (booking.memberId) {
            tasks.push(NotificationHub.dispatch({ eventId: 'PAYMENT_REJECTED', memberId: booking.memberId, data: { bookingId: booking.id, shortId: booking.shortId, tourTitle: booking.tour?.title } }));
          } else if (booking.payerTgChatId) {
            const clientMsg = `❌ <b>Ошибка оплаты</b>\n\nК сожалению, мы не смогли подтвердить оплату заявки <b>#${booking.shortId}</b> на тур «${booking.tour?.title}».\nВозможно, скриншот/файл обрезан, размыт или платеж завис в банке.\n\nПожалуйста, отправьте чек еще раз прямо в этот чат.`;
            tasks.push(sendMessage(booking.payerTgChatId, clientMsg));
          }
          await Promise.allSettled(tasks);
        }
        await answerCallbackQuery(body.callback_query.id);
      } else {
        await handleTelegramCallback(body.callback_query);
      }
      return ok();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ И ФАЙЛОВ
    // ─────────────────────────────────────────────────────────────────────────
    if (!body.message) return ok();
    const chatId = String(body.message.chat.id);
    const text = body.message.text || '';

    // ПЕРЕХВАТЧИК ОТЗЫВА
    const reviewBookingId = await redis.get<string>(`review_state:${chatId}`);
    if (reviewBookingId && text && !text.startsWith('/')) {
      const booking = await prisma.booking.findUnique({ where: { id: reviewBookingId }, include: { tour: true } });
      if (booking) {
        await prisma.review.create({ data: { tourId: booking.tourId, memberId: booking.memberId, name: booking.name, text: text, rating: 5, source: 'tg', isActive: false } });
        await redis.del(`review_state:${chatId}`);
        await sendMessage(chatId, '✅ <b>Спасибо за ваш отзыв!</b>\nОн отправлен на модерацию. Как только администратор опубликует его, мы начислим вам бонусные баллы!\n\n<i>Если вы захотите дополнить или отредактировать отзыв, это всегда можно сделать в Личном кабинете на сайте.</i>');

        const adminMsg = `⭐️ <b>НОВЫЙ ОТЗЫВ (На модерации)</b>\nТур: «${booking.tour.title}»\n👤 Клиент: ${booking.name}\n\n💬 Текст: <i>${text}</i>\n\nМодерировать отзыв, чтобы начислить бонусы, можно в Админ-панели на сайте.`;
        await publishToTelegram(adminMsg, undefined, undefined, false, { messageThreadId: env.TELEGRAM_TOPIC_BOOKINGS });
      }
      return ok();
    }

    // ДИПЛИНК /START
    if (text.startsWith('/start ')) {
      const shortId = text.replace('/start ', '').trim().toUpperCase();
      if (shortId) {
        const booking = await prisma.booking.findUnique({ where: { shortId } });
        if (!booking) { await sendMessage(chatId, 'К сожалению, заявка не найдена. Пожалуйста, проверьте номер.'); return ok(); }
        
        await prisma.booking.update({ where: { id: booking.id }, data: { payerTgChatId: chatId } });
        
        if (booking.status === 'confirmed') { 
          await sendMessage(chatId, `Заявка <b>#${shortId}</b> уже оплачена и подтверждена! Ждем вас в туре.`); 
        } else if (booking.status === 'awaiting_payment' || booking.status === 'pending') { 
          await sendMessage(chatId, `Вы оформляете оплату для заявки <b>#${shortId}</b>.\n\n📸 <b>Пожалуйста, отправьте скриншот чека об оплате (или купленный билет) прямо в этот чат картинкой или файлом.</b>\nМы проверим его и подтвердим вашу бронь.`); 
        } else if (booking.status === 'moderation') {
          await sendMessage(chatId, `Ваш чек для заявки <b>#${shortId}</b> уже находится на проверке у администратора. Пожалуйста, ожидайте уведомления.`);
        }
      }
      return ok();
    }

    // ПРИЕМ ЧЕКА (ФОТО/ДОКУМЕНТ)
    if (body.message?.photo || body.message?.document) {
      const booking = await prisma.booking.findFirst({
        where: { payerTgChatId: chatId, status: { in: ['awaiting_payment', 'pending', 'rejected', 'moderation'] } },
        include: { tour: { select: { currency: true, title: true } } },
        orderBy: { createdAt: 'desc' }
      });
      if (!booking) { await sendMessage(chatId, 'У вас нет активных заявок, ожидающих оплаты. Если нужно — начните новую бронь на сайте.'); return ok(); }

      const fileId = body.message.photo ? body.message.photo[body.message.photo.length - 1].file_id : body.message.document?.file_id;
      if (!fileId) return ok();

      try {
        const fileUrl = await getTelegramFileUrl(fileId);
        const receiptUrl = await uploadToCloudinary(fileUrl);
        await prisma.booking.update({ where: { id: booking.id }, data: { status: 'moderation', paymentProofUrl: receiptUrl, rejectReason: null, createdAt: new Date() } });
        
        Promise.resolve().then(() => {
          logSystemAction('PAYMENT_PROOF_RECEIVED', { targetId: booking.id, changes: { shortId: booking.shortId, receiptUrl } }).catch(console.error);
        });

        const caption = `🔎 <b>МОДЕРАЦИЯ ОПЛАТЫ</b>\n\n🆔 Бронь: <b>#${booking.shortId}</b>\n👤 ${booking.name}\n💳 ${booking.paymentMethod || '—'}\n💰 ${booking.totalPrice} ${booking.tour?.currency || 'RUB'}\n\nПодтверждаете получение средств?`;
        
        await Promise.allSettled([
          sendModerationRequest(env.TELEGRAM_ADMIN_CHAT_ID, receiptUrl, caption, booking.id),
          sendMessage(chatId, `✅ Файл чека получен!\nМы проверяем оплату для заявки <b>#${booking.shortId}</b>. Как только администратор подтвердит её, мы сразу пришлём вам уведомление.`)
        ]);
      } catch (e) { await sendMessage(chatId, '❌ Не удалось сохранить чек. Попробуйте отправить ещё раз.'); }
      return ok();
    }

    return ok();
  } catch (error) {
    console.error('Critical Webhook Error:', error);
    return NextResponse.json({ error: 'Internal' }, { status: 200 });
  }
}

// ─── ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (API TELEGRAM) ──────────────────────────────────

async function sendMessage(chatId: string, text: string) {
  const token = env.TELEGRAM_AUTH_BOT;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: false })
  });
}

async function editAdminMessage(chatId: string, messageId: number, newText: string) {
  const token = env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/editMessageCaption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, caption: newText, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } })
  });
}

async function sendModerationRequest(adminChatId: string, fileUrl: string, caption: string, bookingId: string) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const isDoc = fileUrl.toLowerCase().includes('.pdf');
  const body: any = { 
    chat_id: adminChatId, caption, parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [[{ text: '✅ Подтвердить', callback_data: `confirm_${bookingId}` }], [{ text: '❌ Отклонить', callback_data: `reject_${bookingId}` }]] }
  };
  if (isDoc) body.document = fileUrl; else body.photo = fileUrl;
  const topicId = env.TELEGRAM_TOPIC_MONEY || env.TELEGRAM_TOPIC_BOOKINGS;
  if (topicId) body.message_thread_id = parseInt(topicId, 10);

  await fetch(`https://api.telegram.org/bot${token}/${isDoc ? 'sendDocument' : 'sendPhoto'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
}

async function answerCallbackQuery(id: string) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: id })
  });
}

async function getTelegramFileUrl(fileId: string): Promise<string> {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/getFile?file_id=${fileId}`);
  const data = await res.json();
  return `https://api.telegram.org/file/bot${env.TELEGRAM_AUTH_BOT}/${data.result.file_path}`;
}

async function uploadToCloudinary(fileUrl: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', fileUrl);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData });
  const data = await res.json();
  return data.secure_url || fileUrl;
}

async function editClientMessage(chatId: string, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/editMessageText`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } })
  });
}

async function answerClientCallbackQuery(id: string) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_AUTH_BOT}/answerCallbackQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: id })
  });
}