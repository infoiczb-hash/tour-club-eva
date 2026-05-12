'use client';

// src/features/admin/components/views/ShopTab.tsx

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  ShoppingBag, Package, Coins, Plus, Edit2, Eye, EyeOff,
  Clock, CheckCircle, XCircle, Truck, Loader, X, Check, ChevronLeft
} from 'lucide-react';
import {
  createShopItemAction,
  updateShopItemAction,
  deleteShopItemAction,
  updateShopOrderStatusAction,
} from '@/features/shop/actions/admin';
import { getShopAdminDataAction } from '@/features/shop/actions/admin';

// ─── Типы ─────────────────────────────────────────────────────────────────────

type AdminShopItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  sortOrder: number;
  pendingOrders: number;
};

type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';

type AdminOrder = {
  id: string;
  status: OrderStatus;
  isPreorder: boolean;
  note: string | null;
  createdAt: string;
  item: { title: string; imageUrl: string | null; price: number };
  member: { id: string; name: string | null; phone: string | null };
};

// ─── Конфиг статусов ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:   { label: 'Ожидает',  icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50 border-amber-200' },
  APPROVED:  { label: 'Одобрен',  icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  REJECTED:  { label: 'Отклонён', icon: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200' },
  DELIVERED: { label: 'Выдан',    icon: Truck,        color: 'text-sky-600',     bg: 'bg-sky-50 border-sky-200' },
};

const STATUS_TABS: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL',      label: 'Все' },
  { key: 'PENDING',  label: 'Ожидают' },
  { key: 'APPROVED', label: 'Одобрены' },
  { key: 'DELIVERED',label: 'Выданы' },
  { key: 'REJECTED', label: 'Отклонены' },
];

// ─── Форма товара ─────────────────────────────────────────────────────────────

const EMPTY_FORM = { title: '', description: '', imageUrl: '', price: 0, stock: -1, isActive: true, sortOrder: 0 };

function ItemForm({ initial, onClose, onSave }: { initial?: AdminShopItem; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState(initial
    ? { title: initial.title, description: initial.description ?? '', imageUrl: initial.imageUrl ?? '', price: initial.price, stock: initial.stock, isActive: initial.isActive, sortOrder: initial.sortOrder }
    : EMPTY_FORM
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const f = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return setError('Введите название');
    if (form.price <= 0) return setError('Цена должна быть больше 0');
    setError('');
    startTransition(async () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        price: form.price,
        stock: form.stock,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };
      const res = initial
        ? await updateShopItemAction({ id: initial.id, ...payload })
        : await createShopItemAction(payload);
      if (res.success) { onSave(); onClose(); }
      else setError(res.error ?? 'Ошибка');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">{initial ? 'Редактировать товар' : 'Новый товар'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
        </div>
        {error && <p className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2 border border-rose-200">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Название *</label>
            <input value={form.title} onChange={e => f('title', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
              placeholder="Брендовая бутылка ЭВА" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Описание</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 resize-none"
              placeholder="Краткое описание" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">URL изображения</label>
            <input value={form.imageUrl} onChange={e => f('imageUrl', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
              placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Цена (баллы) *</label>
              <input type="number" min={1} value={form.price} onChange={e => f('price', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Сток (-1 = ∞)</label>
              <input type="number" min={-1} value={form.stock} onChange={e => f('stock', parseInt(e.target.value) ?? -1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => f('isActive', !form.isActive)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${form.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {form.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
              {form.isActive ? 'Активен' : 'Скрыт'}
            </button>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Порядок:</label>
              <input type="number" value={form.sortOrder} onChange={e => f('sortOrder', parseInt(e.target.value) || 0)}
                className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-900 focus:outline-none text-center" />
            </div>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover: bg-teal-500 text-slate-950  font-bold py-3 rounded-xl transition-all disabled:opacity-50">
          {isPending ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
          {initial ? 'Сохранить' : 'Создать товар'}
        </button>
      </div>
    </div>
  );
}

// ─── Карточка заказа ─────────────────────────────────────────────────────────

function OrderCard({ order, onUpdate }: { order: AdminOrder; onUpdate: (id: string, status: OrderStatus, note?: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;
  const date = new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const handleAction = (newStatus: 'APPROVED' | 'REJECTED' | 'DELIVERED', note?: string) => {
  startTransition(async () => {
    const res = await updateShopOrderStatusAction({ orderId: order.id, newStatus, note });
    if (res.success) { onUpdate(order.id, newStatus, note); setShowReject(false); }
    else alert(res.error);
  });
};

  return (
    <div className={`rounded-2xl p-4 border space-y-3 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          {order.item.imageUrl
            ? <Image src={order.item.imageUrl} alt={order.item.title} fill className="object-cover" />
            : <Package size={18} className="text-slate-400 absolute inset-0 m-auto" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">{order.item.title}</p>
          <p className="text-xs text-slate-500">{order.member.name ?? order.member.phone ?? 'Аноним'}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <Coins size={10} /> {order.item.price} баллов
            </span>
            {order.isPreorder && (
              <span className="text-xs  font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">ПРЕДЗАКАЗ</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className={`flex items-center gap-1 text-xs font-bold ${cfg.color}`}>
            <Icon size={12} /> {cfg.label}
          </div>
          <span className="text-xs  text-slate-400">{date}</span>
        </div>
      </div>

      {order.note && (
        <p className="text-xs text-slate-500 bg-white/70 rounded-lg px-3 py-2 border border-slate-200">{order.note}</p>
      )}

      {order.status === 'PENDING' && (
        showReject ? (
          <div className="space-y-2">
            <input value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="Причина отклонения (необязательно)"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-400" />
            <div className="flex gap-2">
              <button onClick={() => setShowReject(false)}
                className="flex-1 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
                Отмена
              </button>
              <button onClick={() => handleAction('REJECTED', rejectNote || undefined)} disabled={isPending}
                className="flex-1 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                {isPending ? <Loader size={12} className="animate-spin" /> : <XCircle size={12} />} Отклонить
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowReject(true)}
              className="flex-1 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">
              Отклонить
            </button>
            <button onClick={() => handleAction('APPROVED')} disabled={isPending}
              className="flex-1 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
              {isPending ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />} Одобрить
            </button>
          </div>
        )
      )}

      {order.status === 'APPROVED' && (
        <button onClick={() => handleAction('DELIVERED')} disabled={isPending}
          className="w-full py-2 bg-sky-50 border border-sky-200 text-sky-700 rounded-xl text-xs font-bold hover:bg-sky-100 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
          {isPending ? <Loader size={12} className="animate-spin" /> : <Truck size={12} />} Отметить выданным
        </button>
      )}
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function ShopTab() {
  const [view, setView] = useState<'items' | 'orders'>('items');
  const [items, setItems] = useState<AdminShopItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<AdminShopItem | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'ALL'>('PENDING');
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getShopAdminDataAction();
    if (res.success) {
      setItems(res.items ?? []);
      setOrders(res.orders ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

const handleToggleActive = (item: AdminShopItem) => {
  startTransition(async () => {
    await updateShopItemAction({
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
      price: item.price,
      stock: item.stock,
      isActive: !item.isActive,
      sortOrder: item.sortOrder,
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
  });
};
  const handleOrderUpdate = (id: string, status: OrderStatus, note?: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, note: note ?? o.note } : o));
  };

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const filteredOrders = orderFilter === 'ALL' ? orders : orders.filter(o => o.status === orderFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={24} className="animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag size={20} className="text-teal-600" /> Магазин баллов
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {items.filter(i => i.isActive).length} активных товаров · {pendingCount > 0 ? `${pendingCount} ожидают решения` : 'Все заказы обработаны'}
          </p>
        </div>
        <div className="flex gap-2">
          {view === 'items' && (
            <button onClick={() => { setEditItem(undefined); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-500 transition-all">
              <Plus size={14} /> Добавить товар
            </button>
          )}
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {[
          { id: 'items', label: 'Товары', count: items.length },
          { id: 'orders', label: 'Заказы', count: pendingCount || undefined },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${view === tab.id ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs  font-black px-1.5 py-0.5 rounded-full ${view === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Товары ── */}
      {view === 'items' && (
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              Товаров пока нет. Добавьте первый.
            </div>
          ) : items.map(item => (
            <div key={item.id}
              className={`flex items-center gap-4 p-4 bg-white border rounded-2xl transition-all hover:border-slate-300 ${item.isActive ? 'border-slate-200' : 'border-slate-100 opacity-50'}`}>
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {item.imageUrl
                  ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                  : <Package size={18} className="text-slate-300 absolute inset-0 m-auto" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <Coins size={10} /> {item.price} баллов
                  </span>
                  <span className="text-xs text-slate-400">
                    Сток: {item.stock === -1 ? '∞' : item.stock}
                  </span>
                  {item.pendingOrders > 0 && (
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200">
                      {item.pendingOrders} заявок
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleToggleActive(item)} disabled={isPending}
                  className={`p-2 rounded-lg border transition-all ${item.isActive ? 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                  {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => { setEditItem(item); setShowForm(true); }}
                  className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all">
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Заказы ── */}
      {view === 'orders' && (
        <div className="space-y-4">
          {/* Фильтры */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_TABS.map(tab => {
              const count = tab.key === 'ALL' ? orders.length : orders.filter(o => o.status === tab.key).length;
              return (
                <button key={tab.key} onClick={() => setOrderFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${orderFilter === tab.key ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                  <span className={`text-xs  px-1.5 py-0.5 rounded-full ${orderFilter === tab.key ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Нет заказов</div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderCard key={order.id} order={order} onUpdate={handleOrderUpdate} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Форма создания/редактирования */}
      {showForm && (
        <ItemForm
          initial={editItem}
          onClose={() => setShowForm(false)}
          onSave={load}
        />
      )}
    </div>
  );
}
