'use server';

// src/features/shop/member.ts
// Все действия участника в магазине баллов

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NotificationHub } from '@/lib/notifications/hub';
import { sendToUserTelegramAdvanced } from '@/features/admin/actions/telegram';
import { env } from '@/lib/env';

// ─────────────────────────────────────────────
// createShopOrderAction
// Участник нажимает «Купить» или «Запросить»
// ─────────────────────────────────────────────

type CreateShopOrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export async function createShopOrderAction(itemId: string): Promise<CreateShopOrderResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Необходима авторизация' };

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { success: false, error: 'Профиль не найден' };

  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item || !item.isActive) return { success: false, error: 'Товар недоступен' };

  const currentBalance = profile.balance ?? 0;
  const isPreorder = item.stock === 0;

  if (!isPreorder && currentBalance < item.price) {
    return { success: false, error: 'Недостаточно баллов' };
  }

  const existing = await prisma.shopOrder.findFirst({
    where: {
      memberId: profile.id,
      itemId,
      status: { in: ['PENDING', 'APPROVED'] },
    },
  });
  if (existing) return { success: false, error: 'У вас уже есть активный запрос на этот товар' };

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.shopOrder.create({
        data: { itemId, memberId: profile.id, status: 'PENDING', isPreorder },
      });

      if (!isPreorder) {
        await tx.memberProfile.update({
          where: { id: profile.id },
          data: { balance: { decrement: item.price } },
        });
        if (item.stock > 0) {
          await tx.shopItem.update({
            where: { id: itemId },
            data: { stock: { decrement: 1 } },
          });
        }
      }

      return newOrder;
    });

    // Уведомление участнику
    await NotificationHub.dispatch({
      eventId: 'SHOP_ORDER_CREATED',
      memberId: profile.id,
      data: { orderId: order.id, itemTitle: item.title, price: item.price, isPreorder },
    });

    // Уведомление админу — используем sendToUserTelegramAdvanced с ADMIN_CHAT_ID
    if (env.TELEGRAM_ADMIN_CHAT_ID) {
      const msg = isPreorder
        ? `🛒 <b>ПРЕДЗАКАЗ В МАГАЗИНЕ</b>\n\n👤 ${profile.name ?? profile.phone}\n📦 «${item.title}»\n💰 ${item.price} баллов\n⚠️ Товар закончился — предзаказ`
        : `🛒 <b>НОВЫЙ ЗАКАЗ В МАГАЗИНЕ</b>\n\n👤 ${profile.name ?? profile.phone}\n📦 «${item.title}»\n💰 ${item.price} баллов\n  Баллы списаны. Ожидает подтверждения.`;

      await sendToUserTelegramAdvanced(
        env.TELEGRAM_ADMIN_CHAT_ID,
        msg,
        [[
          { text: '  Одобрить', callback_data: `shop_approve_${order.id}` },
          { text: '❌ Отклонить', callback_data: `shop_reject_${order.id}` },
        ]],
        false // useAuthBot = false, используем основной бот
      );
    }

    revalidatePath('/account/shop');
    return { success: true, orderId: order.id };
  } catch (err) {
    console.error('[createShopOrder]', err);
    return { success: false, error: 'Не удалось оформить заказ' };
  }
}