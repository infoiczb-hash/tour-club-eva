'use client';

// src/app/account/shop/ShopClient.tsx

import { useState, useTransition, useCallback, memo } from 'react';
import Image from 'next/image';
import {
  ShoppingBag, Coins, Package, Clock, CheckCircle,
  XCircle, Truck, Inbox, Loader
} from 'lucide-react';

type ShopItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number; // -1 безлимит, 0 нет в наличии, >0 остаток
};

type ShopOrder = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';
  isPreorder: boolean;
  note: string | null;
  createdAt: string;
  item: { title: string; imageUrl: string | null };
};

interface ShopClientProps {
  balance: number;
  items: ShopItem[];
  orders: ShopOrder[];
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Ожидает',     icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  APPROVED:  { label: 'Одобрен',     icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REJECTED:  { label: 'Отклонён',    icon: XCircle,      color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20' },
  DELIVERED: { label: 'Получен',     icon: Truck,        color: 'text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/20' },
};

// ---- Компонент карточки товара (мемоизирован) ----
type ShopItemCardProps = {
  item: ShopItem;
  balance: number;
  onOrder: (id: string) => void;
  priority?: boolean; // для первого изображения
};

const ShopItemCard = memo(function ShopItemCard({
  item,
  balance,
  onOrder,
  priority = false,
}: ShopItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const isOutOfStock = item.stock === 0;
  const isUnlimited = item.stock === -1;
  const canAfford = balance >= item.price;

  const handleClick = () => {
    startTransition(async () => {
      // Динамический импорт экшена — не тянет его в основной бандл
      const { createShopOrderAction } = await import(
        '@/features/shop/actions/member'
      );
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
      {/* Изображение */}
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
        {/* Бейдж остатка */}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <span className="text-xs  font-bold px-2 py-0.5 rounded-full bg-ui-bg/80 backdrop-blur text-ui-muted border border-ui-border">
              Нет в наличии
            </span>
          ) : !isUnlimited ? (
            <span className="text-xs  font-bold px-2 py-0.5 rounded-full bg-ui-bg/80 backdrop-blur text-ui-text border border-ui-border">
              Осталось: {item.stock}
            </span>
          ) : null}
        </div>
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-ui-text leading-tight">{item.title}</h3>
          {item.description && (
            <p className="text-xs text-ui-muted mt-1 leading-relaxed line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Цена + кнопка */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-amber-400" />
            <span className="text-sm font-black text-ui-text">{item.price}</span>
            <span className="text-xs text-ui-muted">баллов</span>
          </div>

          {done ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle size={12} /> Запрошено
            </span>
          ) : (
            <button
              onClick={handleClick}
              disabled={isPending || (!isOutOfStock && !canAfford)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                ${isOutOfStock
                  ? 'bg-ui-bg border border-ui-border text-ui-muted hover:border-ui-accent/50 hover:text-ui-accent'
                  : canAfford
                    ? 'bg-ui-accent text-ui-bg hover:bg-ui-accent/80 shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.25)]'
                    : 'bg-ui-bg border border-ui-border text-ui-muted opacity-50 cursor-not-allowed'
                }
                disabled:opacity-50
              `}
            >
              {isPending ? (
                <Loader size={12} className="animate-spin" />
              ) : isOutOfStock ? (
                'Запросить'
              ) : !canAfford ? (
                'Мало баллов'
              ) : (
                'Купить'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ---- Строка заказа (мемоизирована) ----
const OrderRow = memo(function OrderRow({ order }: { order: ShopOrder }) {
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;
  const date = new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg}`}>
      {order.item.imageUrl ? (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <Image src={order.item.imageUrl} alt={order.item.title} fill className="object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-ui-bg flex items-center justify-center shrink-0">
          <Package size={16} className="text-ui-muted" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ui-text truncate">{order.item.title}</p>
        {order.note && (
          <p className="text-xs text-ui-muted mt-0.5 truncate">{order.note}</p>
        )}
        {order.isPreorder && order.status === 'PENDING' && (
          <p className="text-xs text-amber-400 mt-0.5">Предзаказ</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className={`flex items-center gap-1 ${cfg.color}`}>
          <Icon size={12} />
          <span className="text-xs font-bold">{cfg.label}</span>
        </div>
        <span className="text-xs  text-ui-muted">{date}</span>
      </div>
    </div>
  );
});

// ---- Главный компонент (ShopClient) ----
export default function ShopClient({ balance, items, orders }: ShopClientProps) {
  const [localBalance, setLocalBalance] = useState(balance);

  // Стабильная ссылка на колбэк
  const handleOrder = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (item && item.stock !== 0) {
        setLocalBalance((prev) => prev - item.price);
      }
    },
    [items],
  );

  return (
    <div className="space-y-8">
      {/* Шапка */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-ui-text tracking-tight flex items-center gap-2">
            <ShoppingBag size={22} className="text-ui-accent" />
            Магазин
          </h1>
          <p className="text-sm text-ui-muted mt-1">Тратьте баллы на призы от ЭВА</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-ui-panel border border-ui-border rounded-2xl">
          <Coins size={16} className="text-amber-400" />
          <div>
            <p className="text-xs  text-ui-muted uppercase tracking-wider leading-none">Баланс</p>
            <p className="text-lg font-black text-ui-text leading-tight">{localBalance}</p>
          </div>
        </div>
      </div>

      {/* Витрина */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="text-ui-muted/30 mx-auto mb-3" />
          <p className="text-ui-muted text-sm">Товары скоро появятся</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <ShopItemCard
              key={item.id}
              item={item}
              balance={localBalance}
              onOrder={handleOrder}
              priority={index === 0} // первый товар — LCP, загружаем приоритетно
            />
          ))}
        </div>
      )}

      {/* История заказов */}
      {orders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-ui-muted uppercase tracking-wider flex items-center gap-2">
            <Inbox size={14} />
            История заказов
          </h2>
          <div className="space-y-2">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}