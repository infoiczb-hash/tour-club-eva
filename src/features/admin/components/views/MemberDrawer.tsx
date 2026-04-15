// src/features/admin/components/views/MemberDrawer.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Send, Award, History, Heart, Bell, BookOpen, CreditCard, Loader2, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { getMemberDetailAction, adjustBalanceAction } from '@/features/admin/actions/members'; // Исправили имя импорта
import { LEVELS_CONFIG } from '@/lib/constants/levels';
import { cn } from '@/lib/utils';
import { useToast } from '@/shared/context/ToastContext';

interface MemberDrawerProps {
  memberId: string;
  onClose: () => void;
  onRefresh: () => void; // 👈 1. ДОБАВИЛИ ПРОПС ДЛЯ ОБНОВЛЕНИЯ ТАБЛИЦЫ
}

type TabType = 'profile' | 'bookings' | 'activity' | 'management';

export default function MemberDrawer({ memberId, onClose, onRefresh }: MemberDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [stats, setStats] = useState<any>(null); // Для хранения статистики из экшена
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!memberId) return;
    const load = async () => {
      setLoading(true);
      // 👈 2. ВЫЗЫВАЕМ ПРАВИЛЬНОЕ ИМЯ ЭКШЕНА
      const res: any = await getMemberDetailAction(memberId);
      if (res.success) {
        // 👈 3. ЧИТАЕМ ИЗ res.member (как в твоем новом экшене)
        setMember(res.member);
        setStats(res.stats);
      } else {
        showToast(res.error || "Ошибка загрузки", "error");
        onClose();
      }
      setLoading(false);
    };
    load();
  }, [memberId]);

  const handleAdjustBalance = async () => {
    if (!adjustAmount || !adjustReason) return;
    setAdjustLoading(true);
    const res: any = await adjustBalanceAction(memberId, Number(adjustAmount), adjustReason);
    if (res.success) {
      showToast("Баланс обновлен", "success");
      setAdjustAmount('');
      setAdjustReason('');
      
      // Обновляем данные в самом Drawer
      const refresh = await getMemberDetailAction(memberId);
      if (refresh.success) setMember(refresh.member);
      
      // 👈 4. ОБНОВЛЯЕМ ГЛАВНУЮ ТАБЛИЦУ
      onRefresh(); 
    } else {
      showToast(res.error || "Ошибка", "error");
    }
    setAdjustLoading(false);
  };

  if (!memberId) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Side Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-950 z-[100] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm">
              {member?.avatarUrl ? (
                <Image src={member.avatarUrl} alt="" fill className="object-cover" />
              ) : (
                <User className="w-full h-full p-3 text-slate-700" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {member?.name || 'Загрузка...'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600">
                  {member?.level || 'Первопроходец'}
                </span>
                <span className="text-xs text-slate-700 font-mono">ID: {memberId.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-700">
            <X size={24} />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {[
            { id: 'profile', icon: User, label: 'Профиль' },
            { id: 'bookings', icon: BookOpen, label: 'Брони' },
            { id: 'activity', icon: History, label: 'Активность' },
            { id: 'management', icon: CreditCard, label: 'Управление' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all border-b-2",
                activeTab === tab.id 
                  ? "border-teal-500 text-teal-600" 
                  : "border-transparent text-slate-700 hover:text-slate-700"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="animate-spin text-teal-500" />
              <p className="text-sm text-slate-700">Синхронизируем данные...</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* --- PROFILE TAB --- */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <Section title="Контакты">
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <InfoItem icon={<Phone size={14}/>} label="Телефон" value={member?.phone || '—'} />
                      <InfoItem icon={<Mail size={14}/>} label="Email" value={member?.email || '—'} />
                      <InfoItem icon={<Send size={14}/>} label="Telegram" value={member?.telegram || '—'} link={member?.telegram ? `https://t.me/${member.telegram.replace('@', '')}` : undefined} />
                    </div>
                  </Section>

                  <Section title="Размеры снаряжения">
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <GearCard label="Обувь" value={member?.shoeSize} />
                      <GearCard label="Одежда" value={member?.clothingSize} />
                      <GearCard label="Жилет" value={member?.lifeJacketsize} />
                    </div>
                  </Section>

                  <Section title="Предпочтения">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-700 uppercase font-bold mb-1">Питание / Ограничения</p>
                      <p className="text-sm text-slate-700 dark:text-slate-700 leading-relaxed italic">
                        {member?.dietaryRestrictions || 'Информации нет'}
                      </p>
                    </div>
                  </Section>
                </div>
              )}

              {/* --- BOOKINGS TAB --- */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <StatCard label="Всего потрачено" value={`${stats?.totalSpent || 0} ₽`} />
                    <StatCard label="Всего броней" value={stats?.totalBookings || 0} />
                  </div>
                  {member?.bookings?.map((b: any) => (
                    <div key={b.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                            <BookOpen size={20} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{b.tour?.title}</p>
                            <p className="text-[10px] text-slate-700 uppercase mt-1">
                              {new Date(b.createdAt).toLocaleDateString()} · {b.status}
                            </p>
                         </div>
                      </div>
                      <p className="text-sm font-black">{b.totalPrice} ₽</p>
                    </div>
                  ))}
                </div>
              )}

              {/* --- MANAGEMENT TAB --- */}
              {activeTab === 'management' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-lg">
                    <p className="text-xs font-bold uppercase opacity-80 mb-1">Доступно бонусов</p>
                    <p className="text-4xl font-black">{member?.balance || 0}</p>
                  </div>

                  <div className="space-y-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h4 className="text-sm font-bold">Управление балансом</h4>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                         placeholder="Сумма (+50 или -50)"
                         value={adjustAmount}
                         onChange={(e) => setAdjustAmount(e.target.value)}
                       />
                       <input 
                         type="text" 
                         className="flex-[2] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                         placeholder="Причина"
                         value={adjustReason}
                         onChange={(e) => setAdjustReason(e.target.value)}
                       />
                    </div>
                    <button 
                      onClick={handleAdjustBalance}
                      disabled={adjustLoading}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                      {adjustLoading ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>}
                      Подтвердить операцию
                    </button>
                  </div>

                  {/* История логов из нашего универсального AdminLog */}
                  <Section title="История начислений">
                    <div className="space-y-3 mt-3">
                      {member?.balanceLogs?.map((log: any) => (
                        <div key={log.id} className="text-xs p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800">
                          <div className="flex justify-between items-start mb-1">
                            <span className={cn(
                              "font-bold",
                              log.changes.amount > 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {log.changes.amount > 0 ? '+' : ''}{log.changes.amount} баллов
                            </span>
                            <span className="text-slate-700 text-[10px]">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-700 italic">"{log.changes.reason}"</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Вспомогательные мини-компоненты
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function InfoItem({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: string }) {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
      <p className="text-[10px] text-slate-700 font-bold uppercase mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      {link ? (
        <a href={link} target="_blank" className="text-sm font-medium text-teal-600 hover:underline">{value}</a>
      ) : (
        <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
      )}
    </div>
  );
}

function GearCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-center border border-slate-100 dark:border-slate-800">
      <p className="text-[10px] text-slate-700 font-bold uppercase mb-1">{label}</p>
      <p className="text-lg font-black text-slate-700 dark:text-slate-700">{value || '—'}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
      <p className="text-[10px] text-slate-700 font-bold uppercase mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}