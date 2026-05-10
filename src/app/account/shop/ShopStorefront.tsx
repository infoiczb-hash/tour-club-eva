'use client';

import { useState, useTransition, useCallback, memo } from 'react';
import Image from 'next/image';
import { ShoppingBag, Coins, Package, CheckCircle, Loader } from 'lucide-react';

export type ShopItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
};

type ShopItemCardProps = {
  item: ShopItem;
  balance: number;
  onOrder: (id: string) => void;
  priority?: boolean;
};

const ShopItemCard = memo(function ShopItemCard({ item, balance, onOrder, priority = false }: ShopItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const isOutOfStock = item.stock === 0;
  const isUnlimited = item.stock === -1;
  const canAfford = balance >= item.price;

  const handleClick = () => {
    startTransition(async () => {
      const { createShopOrderAction } = await import('@/features/shop/actions/member');
      const res = await createShopOrderAction(item.id);
      if (res.success) {
        setDone(true);
        onOrder(item.id);
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="bg-ui-panel border border-ui-border rounded-2xl overflow-hidden flex flex-col transition-all hover:border-ui-accent/30 hover:shadow-lg hover:shadow-ui-accent/5">
      <div className="relative h-40 bg-ui-bg flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <Package size={40} className="text-ui-muted/30" />
        )}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ui-bg/80 backdrop-blur text-ui-muted border border-ui-border">Нет в наличии</span>
          ) : !isUnlimited ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ui-bg/80 backdrop-blur text-ui-text border border-ui-border">Осталось: {item.stock}</span>
          ) : null}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-ui-text leading-tight">{item.title}</h3>
          {item.description && <p className="text-xs text-ui-muted mt-1 leading-relaxed line-clamp-2">{item.description}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-amber-400" />
            <span className="text-sm font-black text-ui-text">{item.price}</span>
            <span className="text-xs text-ui-muted">баллов</span>
          </div>

          {done ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Запрошено</span>
          ) : (
            <button
              onClick={handleClick}
              disabled={isPending || (!isOutOfStock && !canAfford)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                ${isOutOfStock ? 'bg-ui-bg border border-ui-border text-ui-muted hover:border-ui-accent/50 hover:text-ui-accent'
                  : canAfford ? 'bg-ui-accent text-ui-bg hover:bg-ui-accent/80 shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.25)]'
                  : 'bg-ui-bg border border-ui-border text-ui-muted opacity-50 cursor-not-allowed'}
                disabled:opacity-50
              `}
            >
              {isPending ? <Loader size={12} className="animate-spin" /> : isOutOfStock ? 'Запросить' : !canAfford ? 'Мало баллов' : 'Купить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default function ShopStorefront({ balance, items }: { balance: number; items: ShopItem[] }) {
  const [localBalance, setLocalBalance] = useState(balance);

  const handleOrder = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        // ИСПРАВЛЕНО: Теперь списываем всегда, в том числе и при предзаказе
        setLocalBalance((prev) => prev - item.price);
      }
    },
    [items]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-ui-text tracking-tight flex items-center gap-2">
            <ShoppingBag size={22} className="text-ui-accent" /> Магазин
          </h1>
          <p className="text-sm text-ui-muted mt-1">Тратьте баллы на призы от ЭВА</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-ui-panel border border-ui-border rounded-2xl">
          <Coins size={16} className="text-amber-400" />
          <div>
            <p className="text-[10px] text-ui-muted uppercase tracking-wider leading-none">Баланс</p>
            <p className="text-lg font-black text-ui-text leading-tight">{localBalance}</p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="text-ui-muted/30 mx-auto mb-3" />
          <p className="text-ui-muted text-sm">Товары скоро появятся</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <ShopItemCard key={item.id} item={item} balance={localBalance} onOrder={handleOrder} priority={index === 0} />
          ))}
        </div>
      )}
    </div>
  );
}