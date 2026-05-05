// СТАЛО (НОВЫЙ ФАЙЛ): src/features/account/actions/uploadReceipt.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { env } from '@/lib/env';

export async function uploadClientReceiptAction(bookingId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'Файл не найден' };

    // Базовая защита
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Файл слишком большой (макс. 5МБ)' };
    }
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Пожалуйста, загрузите картинку (скриншот)' };
    }

    // 1. Проверяем авторизацию и владельца брони
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Необходима авторизация' };

    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    if (!profile) return { success: false, error: 'Профиль не найден' };

    const booking = await prisma.booking.findFirst({
      where: { 
        id: bookingId, 
        memberId: profile.id,
        status: { in: ['awaiting_payment', 'pending', 'rejected'] }
      },
      include: { tour: true }
    });

    if (!booking) return { success: false, error: 'Бронь не найдена или уже оплачена' };

    // 2. Загрузка файла в Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `receipts/${Date.now()}_${booking.shortId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('tours-images')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return { success: false, error: 'Ошибка при загрузке картинки' };
    }

    // Получаем публичную ссылку
    const { data } = supabase.storage.from('tours-images').getPublicUrl(fileName);
    const receiptUrl = data.publicUrl;

    // 3. Обновляем статус брони на "Модерация"
   // 3. Обновляем статус брони на "Модерация" и поднимаем наверх списка
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: 'moderation', 
        paymentProofUrl: receiptUrl,
        rejectReason: null, // 🔥 Очищаем старую причину отказа
        createdAt: new Date() // 🔥 Подбрасываем бронь на самый верх в Админке!
      }
    });

    // 4. Отправляем чек Админам в Telegram (Идентично тому, как это делает Webhook бота)
    const caption = `🔎 <b>МОДЕРАЦИЯ ОПЛАТЫ (Сайт)</b>\n\n🆔 Бронь: <b>#${booking.shortId}</b>\n👤 Клиент: <b>${booking.name}</b>\n💳 Способ: <b>${booking.paymentMethod || 'Не указан'}</b>\n💰 К оплате: <b>${booking.totalPrice} ${booking.tour?.currency || 'RUB'}</b>\n\nПодтверждаете получение средств?`;
    
    await publishToTelegram(caption, receiptUrl, undefined, false, {
      messageThreadId: env.TELEGRAM_TOPIC_MONEY || env.TELEGRAM_TOPIC_BOOKINGS,
      inlineKeyboard: [
        [{ text: '  Подтвердить', callback_data: `confirm_${booking.id}` }],
        [{ text: '❌ Отклонить', callback_data: `reject_${booking.id}` }]
      ]
    });

    // Ревалидируем кэш ЛК и админки
    revalidatePath(`/account/bookings/${bookingId}`);
    revalidatePath('/account/bookings');
    revalidatePath('/account/dashboard');
    revalidatePath('/admin');

    return { success: true };

  } catch (error) {
    console.error('Upload Client Receipt Error:', error);
    return { success: false, error: 'Внутренняя ошибка сервера' };
  }
}