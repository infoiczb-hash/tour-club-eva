import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ShopStorefront from './ShopStorefront';
import OrderHistory from './OrderHistory';

export const metadata = { title: 'Магазин' };

export default async function ShopPage() {
  const user = await getServerUser();
  if (!user) redirect('/login?next=/account/shop');

  // ПАРАЛЛЕЛЬНЫЙ ЗАПРОС: профиль и публичные товары не ждут друг друга
  const [profile, items] = await Promise.all([
    prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, balance: true },
    }),
    prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  if (!profile) redirect('/account');

  // Заказы зависят от profile.id, поэтому идут вторым шагом
  const orders = await prisma.shopOrder.findMany({
    where: { memberId: profile.id },
    include: { item: { select: { title: true, imageUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="space-y-8">
      {/* Клиентская часть: Интерактивная витрина и баланс */}
      <ShopStorefront
        balance={profile.balance ?? 0}
        items={items.map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          imageUrl: i.imageUrl,
          price: i.price,
          stock: i.stock,
        }))}
      />

      {/* Серверная часть: История заказов (HTML приходит готовым) */}
      <OrderHistory
        orders={orders.map(o => ({
          id: o.id,
          status: o.status,
          isPreorder: o.isPreorder,
          note: o.note,
          createdAt: o.createdAt.toISOString(),
          item: { title: o.item.title, imageUrl: o.item.imageUrl },
        }))}
      />
    </div>
  );
}