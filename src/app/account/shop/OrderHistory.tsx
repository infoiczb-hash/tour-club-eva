import React from 'react';
import Image from 'next/image';
import { Clock, CheckCircle, XCircle, Truck, Inbox, Package } from 'lucide-react';

export type ShopOrder = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';
  isPreorder: boolean;
  note: string | null;
  createdAt: string;
  item: { title: string; imageUrl: string | null };
};

const STATUS_CONFIG = {
  PENDING:   { label: 'Ожидает', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  APPROVED:  { label: 'Одобрен', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  REJECTED:  { label: 'Отклонён', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  DELIVERED: { label: 'Получен', icon: Truck, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
};

export default function OrderHistory({ orders }: { orders: ShopOrder[] }) {
  if (orders.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-ui-muted uppercase tracking-wider flex items-center gap-2">
        <Inbox size={14} /> История заказов
      </h2>
      
      <div className="space-y-2">
        {orders.map((order) => {
          const cfg = STATUS_CONFIG[order.status];
          const Icon = cfg.icon;
          const date = new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

          return (
            <div key={order.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg}`}>
              {order.item.imageUrl ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                  {/* ИСПРАВЛЕНО: sizes="40px" гарантирует, что Next.js отдаст миниатюру в 3кб, а не 4K-картинку */}
                  <Image 
                    src={order.item.imageUrl} 
                    alt={order.item.title} 
                    fill 
                    className="object-cover" 
                    sizes="40px" 
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-ui-bg flex items-center justify-center shrink-0">
                  <Package size={16} className="text-ui-muted" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ui-text truncate">{order.item.title}</p>
                {order.note && <p className="text-xs text-ui-muted mt-0.5 truncate">{order.note}</p>}
                {order.isPreorder && order.status === 'PENDING' && <p className="text-xs text-amber-400 mt-0.5">Предзаказ</p>}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className={`flex items-center gap-1 ${cfg.color}`}>
                  <Icon size={12} />
                  <span className="text-xs font-bold">{cfg.label}</span>
                </div>
                <span className="text-[10px] text-ui-muted">{date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}