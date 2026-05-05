// src/app/account/shop/page.tsx
import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ShopClient from './ShopClient';

export const metadata = { title: 'Магазин баллов | ЭВА' };

export default async function ShopPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/shop');

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, balance: true },
  });
  if (!profile) redirect('/account');

  const [items, orders] = await Promise.all([
    prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.shopOrder.findMany({
      where: { memberId: profile.id },
      include: { item: { select: { title: true, imageUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <ShopClient
      balance={profile.balance ?? 0}
      items={items.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        imageUrl: i.imageUrl,
        price: i.price,
        stock: i.stock,
      }))}
      orders={orders.map(o => ({
        id: o.id,
        status: o.status,
        isPreorder: o.isPreorder,
        note: o.note,
        createdAt: o.createdAt.toISOString(),
        item: { title: o.item.title, imageUrl: o.item.imageUrl },
      }))}
    />
  );
}
