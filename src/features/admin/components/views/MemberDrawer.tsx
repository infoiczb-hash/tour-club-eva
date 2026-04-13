// src/features/admin/components/views/MemberDrawer.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Send, Award, History, Heart, Bell, BookOpen, CreditCard, Loader2, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { getMemberDetailsAction, adjustBalanceAction } from '@/features/admin/actions/members';
import { LEVELS_CONFIG } from '@/lib/constants/levels';
import { cn } from '@/lib/utils';
import { useToast } from '@/shared/context/ToastContext';

interface MemberDrawerProps {
  memberId: string;
  onClose: () => void;
}

type TabType = 'profile' | 'bookings' | 'activity' | 'management';

export default function MemberDrawer({ memberId, onClose }: MemberDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!memberId) return;
    const load = async () => {
      setLoading(true);
      const res = await getMemberDetailsAction(memberId);
      if (res.success) {
        setMember(res.data);
      } else {
        showToast('Ошибка загрузки данных участника', 'error');
      }
      setLoading(false);
    };
    load();
  }, [memberId]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      showToast('Введите корректную сумму', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('Укажите причину изменения баланса', 'error');
      return;
    }
    setAdjustLoading(true);
    const res = await adjustBalanceAction(memberId, amount, adjustReason);
    if (res.success) {
      showToast('Баланс успешно обновлён', 'success');
      setMember((prev: any) => ({ ...prev, balance: prev.balance + amount }));
      setAdjustAmount('');
      setAdjustReason('');
      // Обновить историю (опционально можно перезагрузить детали)
    } else {
      showToast(res.error || 'Ошибка', 'error');
    }
    setAdjustLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl border-l border-slate-200 flex items-center justify-center z-50">
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </div>
    );
  }

  if (!member) return null;

  const levelConfig = LEVELS_CONFIG.find(l => l.name === member.level) || LEVELS_CONFIG[0];
  const LevelIcon = levelConfig.icon;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Профиль', icon: <User size={16} /> },
    { id: 'bookings', label: 'Брони', icon: <CreditCard size={16} /> },
    { id: 'activity', label: 'Активность', icon: <History size={16} /> },
    { id: 'management', label: 'Управление', icon: <Award size={16} /> },
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[700px] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
              {member.avatarUrl ? (
                <Image src={member.avatarUrl} alt="" width={56} height={56} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User size={28} />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{member.name || 'Без имени'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-xs font-bold uppercase tracking-wider", levelConfig.color)}>
                  <LevelIcon size={14} className="inline mr-1" />
                  {member.level}
                </span>
                <span className="text-xs text-slate-500">ID: {member.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px",
                activeTab === tab.id
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Contacts */}
              <Section title="Контакты">
                <div className="grid grid-cols-2 gap-4">
                  {member.phone && <InfoItem icon={<Phone size={16} />} label="Телефон" value={member.phone} />}
                  {member.email && <InfoItem icon={<Mail size={16} />} label="Email" value={member.email} />}
                  {member.telegram && (
                    <InfoItem
                      icon={<Send size={16} />}
                      label="Telegram"
                      value={`@${member.telegram}`}
                      link={member.tgChatId ? `https://t.me/${member.telegram}` : undefined}
                    />
                  )}
                  {member.instagram && <InfoItem icon={<Send size={16} />} label="Instagram" value={member.instagram} />}
                </div>
              </Section>

              {/* Gear */}
              <Section title="Снаряжение">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Размер одежды" value={member.clothesSize || '—'} />
                  <InfoItem label="Размер обуви" value={member.shoeSize || '—'} />
                  <InfoItem label="Спасжилет" value={member.lifeJacketSize || '—'} />
                  <InfoItem label="Питание" value={member.foodPref || '—'} />
                </div>
                {member.inventory?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Личное снаряжение</p>
                    <div className="flex flex-wrap gap-2">
                      {member.inventory.map((item: string) => (
                        <span key={item} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              {/* Promo */}
              {member.promoCode && (
                <Section title="Реферальная программа">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-amber-800">Промокод: {member.promoCode.code}</p>
                    <p className="text-xs text-amber-600 mt-1">Скидка другу: {member.promoCode.discount} ₽</p>
                    <p className="text-xs text-amber-600">Вознаграждение: {member.promoCode.reward} ₽</p>
                  </div>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">История бронирований</h3>
                <span className="text-sm text-slate-500">Всего: {member.bookings?.length || 0}</span>
              </div>
              {member.bookings?.length > 0 ? (
                <div className="space-y-2">
                  {member.bookings.map((b: any) => (
                    <div key={b.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-800">{b.tour?.title || 'Тур'}</span>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          b.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                          b.status === 'cancelled' ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                        )}>
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {b.tourDate?.startDate ? new Date(b.tourDate.startDate).toLocaleDateString('ru-RU') : 'Дата не указана'}
                      </div>
                      <div className="text-sm font-medium mt-2">{b.totalPrice} {b.tour?.currency || 'MDL'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Нет бронирований</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-2">Отзывы</h3>
                {member.reviews?.length > 0 ? (
                  member.reviews.map((r: any) => (
                    <div key={r.id} className="border-b border-slate-100 py-2">
                      <p className="text-sm">{r.text}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : <p className="text-slate-500 text-sm">Нет отзывов</p>}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">Вишлист</h3>
                {member.watchLists?.length > 0 ? (
                  member.watchLists.map((w: any) => (
                    <div key={w.id} className="text-sm">{w.tour?.title || w.category?.title}</div>
                  ))
                ) : <p className="text-slate-500 text-sm">Пусто</p>}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">Тесты</h3>
                {member.testResults?.length > 0 ? (
                  member.testResults.map((t: any) => (
                    <div key={t.id} className="text-sm">{t.testSlug}</div>
                  ))
                ) : <p className="text-slate-500 text-sm">Не проходил</p>}
              </div>
            </div>
          )}

          {activeTab === 'management' && (
            <div className="space-y-6">
              <Section title="Баланс">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <span className="text-3xl font-black text-amber-600">{member.balance} ₽</span>
                  <span className="text-sm text-slate-500">текущий баланс</span>
                </div>
                <form onSubmit={handleAdjustBalance} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Сумма (+ / -)</label>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="100 или -50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Причина</label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Например: возврат за тур #123"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adjustLoading}
                    className="w-full py-2 bg-teal-500 text-white rounded-lg font-bold text-sm hover:bg-teal-600 transition-colors disabled:opacity-50"
                  >
                    {adjustLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Применить'}
                  </button>
                </form>
              </Section>

              <Section title="Быстрые действия">
                <div className="space-y-2">
                  {member.telegram && (
                    <a
                      href={`https://t.me/${member.telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full p-3 bg-sky-50 text-sky-700 rounded-lg text-sm font-medium hover:bg-sky-100 transition-colors"
                    >
                      Написать в Telegram
                    </a>
                  )}
                  <button className="w-full p-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                    Сбросить пароль (отправить ссылку)
                  </button>
                </div>
              </Section>

              {/* История баланса */}
              {member.balanceLogs?.length > 0 && (
                <Section title="История баланса">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {member.balanceLogs.map((log: any) => (
                      <div key={log.id} className="border-b border-slate-100 py-2">
                        <div className="flex justify-between text-sm">
                          <span className={log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {log.amount > 0 ? '+' : ''}{log.amount} ₽
                          </span>
                          <span className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600">{log.reason}</p>
                        {log.adminNote && <p className="text-xs text-slate-400 italic">{log.adminNote}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Вспомогательные компоненты
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-0">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoItem({ icon, label, value, link }: { icon?: React.ReactNode; label: string; value: string; link?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-600 hover:underline">
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium text-slate-800">{value}</p>
      )}
    </div>
  );
}