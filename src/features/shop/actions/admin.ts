'use server';

// src/features/shop/actions/admin.ts
// Все действия администратора в магазине баллов

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth';
import { NotificationHub } from '@/lib/notifications/hub';

// ─────────────────────────────────────────────
// ЗАГРУЗКА ДАННЫХ ДЛЯ SHOPТАБА
// ─────────────────────────────────────────────

export const getShopAdminDataAction = withAdminAuth(async () => {
  try {
    const [items, orders] = await Promise.all([
      prisma.shopItem.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { orders: { where: { status: 'PENDING' } } } },
        },
      }),
      prisma.shopOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          item: { select: { title: true, imageUrl: true, price: true } },
          member: { select: { id: true, name: true, phone: true } },
        },
      }),
    ]);

    return {
      success: true,
      items: items.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        imageUrl: i.imageUrl,
        price: i.price,
        stock: i.stock,
        isActive: i.isActive,
        sortOrder: i.sortOrder,
        pendingOrders: i._count.orders,
      })),
      orders: orders.map(o => ({
        id: o.id,
        status: o.status as any,
        isPreorder: o.isPreorder,
        note: o.note,
        createdAt: o.createdAt.toISOString(),
        item: { title: o.item.title, imageUrl: o.item.imageUrl, price: o.item.price },
        member: { id: o.member.id, name: o.member.name, phone: o.member.phone },
      })),
    };
  } catch (err) {
    console.error('[getShopAdminData]', err);
    return { success: false, items: [], orders: [], error: 'Ошибка загрузки данных' };
  }
});

// ─────────────────────────────────────────────
// УПРАВЛЕНИЕ ТОВАРАМИ
// ─────────────────────────────────────────────

export type ShopItemInput = {
  title: string;
  description?: string;
  imageUrl?: string;
  price: number;
  stock: number; // -1 = безлимит, 0 = нет в наличии
  isActive?: boolean;
  sortOrder?: number;
};

// Создать товар
export const createShopItemAction = withAdminAuth(
  async (data: ShopItemInput) => {
    try {
      const item = await prisma.shopItem.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
          price: data.price,
          stock: data.stock,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
      });
      revalidatePath('/admin');
      revalidatePath('/account/shop');
      return { success: true, item };
    } catch (err) {
      console.error('[createShopItem]', err);
      return { success: false, error: 'Ошибка создания товара' };
    }
  }
);

// Обновить товар
export const updateShopItemAction = withAdminAuth(
  async ({ id, ...data }: ShopItemInput & { id: string }) => {
    try {
      const item = await prisma.shopItem.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
          price: data.price,
          stock: data.stock,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
      });
      revalidatePath('/admin');
      revalidatePath('/account/shop');
      return { success: true, item };
    } catch (err) {
      console.error('[updateShopItem]', err);
      return { success: false, error: 'Ошибка обновления товара' };
    }
  }
);

// Скрыть товар (мягкое удаление)
export const deleteShopItemAction = withAdminAuth(
  async ({ id }: { id: string }) => {
    try {
      await prisma.shopItem.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath('/admin');
      revalidatePath('/account/shop');
      return { success: true };
    } catch (err) {
      console.error('[deleteShopItem]', err);
      return { success: false, error: 'Ошибка удаления товара' };
    }
  }
);

// ─────────────────────────────────────────────
// УПРАВЛЕНИЕ ЗАКАЗАМИ
// ─────────────────────────────────────────────

export type UpdateShopOrderInput = {
  orderId: string;
  newStatus: 'APPROVED' | 'REJECTED' | 'DELIVERED';
  note?: string;
};

export const updateShopOrderStatusAction = withAdminAuth(
  async ({ orderId, newStatus, note }: UpdateShopOrderInput) => {
    try {
      const order = await prisma.shopOrder.findUnique({
        where: { id: orderId },
        include: { item: true, member: true },
      });

      if (!order) return { success: false, error: 'Заказ не найден' };
      if (order.status === 'DELIVERED') return { success: false, error: 'Заказ уже выдан' };

      await prisma.$transaction(async (tx) => {
        await tx.shopOrder.update({
          where: { id: orderId },
          data: { status: newStatus, note: note ?? null },
        });

        // При отклонении обычного заказа — возвращаем баллы и сток
        if (newStatus === 'REJECTED' && !order.isPreorder) {
          await tx.memberProfile.update({
            where: { id: order.memberId },
            data: { balance: { increment: order.item.price } },
          });
          if (order.item.stock >= 0) {
            await tx.shopItem.update({
              where: { id: order.itemId },
              data: { stock: { increment: 1 } },
            });
          }
        }

        // При одобрении предзаказа — списываем баллы сейчас
        if (newStatus === 'APPROVED' && order.isPreorder) {
          const member = await tx.memberProfile.findUnique({
            where: { id: order.memberId },
            select: { balance: true },
          });
          if (!member || (member.balance ?? 0) < order.item.price) {
            throw new Error('Недостаточно баллов для подтверждения предзаказа');
          }
          await tx.memberProfile.update({
            where: { id: order.memberId },
            data: { balance: { decrement: order.item.price } },
          });
          if (order.item.stock >= 0) {
            await tx.shopItem.update({
              where: { id: order.itemId },
              data: { stock: { decrement: 1 } },
            });
          }
        }
      });

      // Уведомляем участника
      if (newStatus === 'APPROVED') {
        await NotificationHub.dispatch({
          eventId: 'SHOP_ORDER_APPROVED',
          memberId: order.memberId,
          data: { orderId: order.id, itemTitle: order.item.title },
        });
      } else if (newStatus === 'REJECTED') {
        await NotificationHub.dispatch({
          eventId: 'SHOP_ORDER_REJECTED',
          memberId: order.memberId,
          data: {
            orderId: order.id,
            itemTitle: order.item.title,
            price: order.item.price,
            reason: note,
          },
        });
      }

      revalidatePath('/admin');
      revalidatePath('/account/shop');
      return { success: true };
    } catch (err) {
      console.error('[updateShopOrderStatus]', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка обновления заказа' };
    }
  }
);