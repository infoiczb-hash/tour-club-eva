"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, Check, X as XIcon, Phone, Send, Instagram, 
  Users, ChevronDown, Map, AlertCircle, Globe, LifeBuoy, ChevronUp
} from 'lucide-react';
import { BookingStatus } from '@prisma/client';
import { clsx } from 'clsx';
import { useToast } from '@/shared/context/ToastContext';
import { sendManifestToTelegramAction } from '@/features/admin/actions/manifest';
import { broadcastToGroupAction } from '@/features/admin/actions/broadcast';
import { updateBookingCommentAction } from '@/features/admin/actions';

// --- ИНТЕРФЕЙСЫ ---

export interface GuestItem {
  name: string;
  ticketType: 'adult' | 'child' | 'family' | 'member';
  age?: string | number;
  equipment?: string; 
  phone?: string;     
}

export interface BookingItem {
  id: string;
  short_id?: number; 
  user_name: string;
  user_phone: string;
  status: BookingStatus;
  created_at: Date | string;
  
  tickets_adult: number;
  tickets_child: number;
  tickets_family: number;
  tickets_member: number;
  
  total_price: number;
  amount_paid: number;
  source: string;
  
  // ✅ ВОТ ОНИ, ВОЗВРАЩЕННЫЕ ПОЛЯ:
  payment_method: string; 
  discount: number;       
  tourId: string;         
  tourDateId?: string;    
  
  comment?: string | null;
  social?: string | null;
  tour?: { title: string; date: Date | string };
  
  guests?: GuestItem[] | any; 
}

interface BookingsTabProps {
  bookings: BookingItem[];
  onStatusChange: (id: string, status: string) => void;
}

type TabMode = 'list' | 'groups';

// --- ХЕЛПЕРЫ ---
const formatTickets = (b: BookingItem) => {
  const parts = [];
  if (b.tickets_adult > 0) parts.push(`${b.tickets_adult} взр`);
  if (b.tickets_child > 0) parts.push(`${b.tickets_child} дет`);
  if (b.tickets_family > 0) parts.push(`${b.tickets_family} сем`);
  if (b.tickets_member > 0) parts.push(`${b.tickets_member} клуб`);
  return parts.join(' + ') || '0';
};

const getTicketLabel = (type: string, age?: string | number) => {
  switch(type) {
    case 'adult': return 'Взрослый';
    case 'child': return age ? `Детский (${age} лет)` : 'Детский';
    case 'family': return 'Семейный';
    case 'member': return 'Член клуба';
    default: return 'Взрослый';
  }
};

const getSourceBadge = (source: string) => {
  switch(source?.toLowerCase()) {
    case 'telegram': return <span className="bg-sky-500/10 text-sky-500 border border-sky-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Send size={8}/> TG</span>;
    case 'instagram': return <span className="bg-pink-500/10 text-pink-500 border border-pink-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Instagram size={8}/> INST</span>;
    case 'offline': return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Users size={8}/> OFFLINE</span>;
    default: return <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Globe size={8}/> WEB</span>;
  }
};

// --- КОМПОНЕНТ ---
export default function BookingsTab({ bookings, onStatusChange }: BookingsTabProps) {
  const [activeMode, setActiveMode] = useState<TabMode>('groups'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null); 
  const { showToast } = useToast();

  // Состояния для Рупора (Рассылки)
  const [broadcastModal, setBroadcastModal] = useState<{isOpen: boolean, group: any | null}>({isOpen: false, group: null});
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // 1. Фильтрация для Ленты
  const filteredBookings = useMemo(() => {
    let data = bookings;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(b => 
        b.user_name.toLowerCase().includes(lower) || 
        b.user_phone.includes(lower) ||
        (b.tour?.title || '').toLowerCase().includes(lower) ||
        (b.comment || '').toLowerCase().includes(lower)
      );
    }
    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bookings, searchTerm]);

  // 2. Группировка и ПЛОСКИЙ МАНИФЕСТ для Гидов
  const groupedManifests = useMemo(() => {
    const groups: Record<string, { 
      tourName: string; 
      date: string; 
      participants: any[]; 
      totalTickets: number;
      originalBookings: BookingItem[];
    }> = {};

    bookings.forEach(b => {
      if (['cancelled', 'rejected', 'awaiting_payment', 'moderation'].includes(b.status)) return; 
       
        
      const dateStr = b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Дата уточняется';
       const tourName = b.tour?.title || 'Неизвестный тур';
       const key = `${b.tourId}_${b.tourDateId || 'open'}`; // ✅ НАДЕЖНЫЙ КЛЮЧ

       if (!groups[key]) {
         groups[key] = { tourName, date: dateStr, participants: [], totalTickets: 0, originalBookings: [] };
       }

       groups[key].originalBookings.push(b);
       const shortId = b.short_id || b.id.substring(0, 4);

       const totalInBooking = (b.tickets_adult || 0) + (b.tickets_child || 0) + (b.tickets_member || 0) + ((b.tickets_family || 0) * 3);
       groups[key].totalTickets += totalInBooking;

       groups[key].participants.push({
         isMain: true,
         bookingId: b.id,
         shortId: shortId,
         name: b.user_name,
         ticketType: 'adult', 
         phone: b.user_phone,
         social: b.social,
         comment: b.comment,
         status: b.status,
         amountPaid: b.amount_paid
       });

       const guests: GuestItem[] = Array.isArray(b.guests) ? b.guests : [];
       guests.forEach((g) => {
         groups[key].participants.push({
           isMain: false,
           bookingId: b.id,
           shortId: shortId,
           name: g.name,
           ticketType: g.ticketType,
           age: g.age,
           equipment: g.equipment,
           phone: g.phone || (g.ticketType === 'child' ? '—' : undefined), 
           status: b.status,
         });
       });
    });

    return Object.values(groups).sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('.');
        const [dayB, monthB, yearB] = b.date.split('.');
        return new Date(`${yearA}-${monthA}-${dayA}`).getTime() - new Date(`${yearB}-${monthB}-${dayB}`).getTime();
    });
  }, [bookings]);

  const toggleGroup = (key: string) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  // ✅ ИСПРАВЛЕНИЕ: Функция рассылки вынесена отдельно
  const handleBroadcastSubmit = async () => {
    if (!broadcastText.trim()) return showToast('Введите текст сообщения', 'error');
    if (!broadcastModal.group) return;

    setIsBroadcasting(true);
    showToast('Начинаем рассылку...', 'info');

    const bookingIds = Array.from(new Set(broadcastModal.group.participants.map((p: any) => p.bookingId))) as string[];

    const res = await broadcastToGroupAction(bookingIds, broadcastText);

    if (res.success) {
      showToast(`Успешно отправлено ${res.count} участникам!`, 'success');
      setBroadcastModal({ isOpen: false, group: null });
      setBroadcastText('');
    } else {
      showToast(`Ошибка: ${res.error}`, 'error');
    }
    setIsBroadcasting(false);
  };  

  // Функция отправки манифеста
  const handleSendToBot = async (group: any) => {
    showToast('Отправка манифеста...', 'info'); 
    
    const res = await sendManifestToTelegramAction({
      tourName: group.tourName,
      date: group.date,
      totalTickets: group.totalTickets,
      participants: group.participants
    });

    if (res.success) {
      showToast('Манифест успешно отправлен в Telegram!', 'success');
    } else {
      showToast(`Ошибка: ${res.error}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER: Навигация */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Users size={28} className="text-teal-500" />
          Управление заявками
        </h1>
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
            <button 
                onClick={() => setActiveMode('list')}
                className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all", activeMode === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-700')}
            >Лента</button>
            <button 
                onClick={() => setActiveMode('groups')}
                className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all", activeMode === 'groups' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-700')}
            >Списки групп</button>
        </div>
      </div>

      {/* ========================================== */}
      {/* РЕЖИМ 1: ЛЕНТА (С АККОРДЕОНОМ УЧАСТНИКОВ) */}
      {/* ========================================== */}
      {activeMode === 'list' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            {/* Поиск */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center relative">
                    <Search className="absolute left-3 text-slate-400" size={18}/>
                    <input 
                        placeholder="Поиск по имени, телефону или комментарию..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-medium outline-none text-slate-900 placeholder:text-slate-400" 
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left table-fixed">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="p-5 w-[20%]">Тур и Дата</th>
                            <th className="p-5 w-[15%]">Клиент</th>
                            <th className="p-5 w-[15%]">Экономика</th>
                            <th className="p-5 w-[25%]">Комментарий</th>
                            <th className="p-5 w-[15%] text-center">Статус</th>
                            <th className="p-5 w-[10%] text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredBookings.map(b => {
                            const guests: GuestItem[] = Array.isArray(b.guests) ? b.guests : [];
                            const hasGuests = guests.length > 0;
                            const isExpanded = expandedRow === b.id;

                            return (
                              <React.Fragment key={b.id}>
                                <tr className="group hover:bg-slate-50 transition-colors">
                                    <td className="p-5 align-top">
                                        <div className="font-bold text-slate-900 line-clamp-2 mb-1">{b.tour?.title || 'Без названия'}</div>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-400">
                                            {b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Неизвестно'}
                                        </div>
                                    </td>
                                    <td className="p-5 align-top">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-bold text-slate-900">
                                                {b.user_name} <span className="text-slate-300 text-xs font-mono ml-1">#{b.short_id || '---'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-slate-400 font-mono"><Phone size={10} className="inline"/> {b.user_phone}</span>
                                        </div>
                                    </td>
                                  <td className="p-5 align-top">
    <div className="font-black text-slate-900 mb-1 text-xs">{formatTickets(b)}</div>
    
    {/* ✅ ВОЗВРАЩЕНО: Финансовый блок */}
    <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm font-black text-teal-600">{b.total_price} MDL</span>
        {b.discount > 0 && <span className="text-[10px] text-rose-500 font-bold">-{b.discount} б.</span>}
    </div>
    <div className="text-[9px] font-bold uppercase text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded w-fit mb-2">
        {b.payment_method === 'qr' ? 'Клевер QR' : b.payment_method === 'biletpmr' ? 'BiletPMR' : 'Наличные'}
    </div>
    {b.amount_paid > 0 && <div className="text-[10px] font-bold text-emerald-600 mb-2">Аванс: {b.amount_paid}</div>}
                                        {hasGuests && (
                                          <button 
                                            onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                                            className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors"
                                          >
                                            👥 Участники ({guests.length}) {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                          </button>
                                        )}
                                    </td>
                                    <td className="p-5 align-top">
      <textarea 
          defaultValue={b.comment || ''}
          placeholder="Добавить заметку..."
          onBlur={(e) => {
              if (e.target.value !== b.comment) {
                  updateBookingCommentAction(b.id, e.target.value);
                  showToast('Комментарий сохранен', 'success');
              }
          }}
          className="w-full min-h-[60px] text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white resize-y placeholder:text-slate-300 transition-colors"
      />
  </td>
                                    <td className="p-5 text-center align-top">
                                    <select 
    value={b.status} 
    onChange={(e) => onStatusChange(b.id, e.target.value)} 
    className={clsx(
        "text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg px-2 md:px-3 py-1.5 outline-none cursor-pointer border appearance-none w-full transition-colors",
        b.status === 'confirmed' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30" :
        b.status === 'moderation' ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-500/30" :
        b.status === 'awaiting_payment' ? "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" :
        b.status === 'rejected' || b.status === 'cancelled' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/30" :
        "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30"
    )}
>
    <option value="pending">Наличные (Новая)</option>
    <option value="awaiting_payment">Ждет оплаты</option>
    <option value="moderation">Проверка чека</option>
    <option value="confirmed">Оплачено</option>
    <option value="rejected">Отклонено</option>
    <option value="cancelled">Отмена</option>
</select>
                                    </td>
                                    <td className="p-5 text-right align-top">
                                      <div className="flex justify-end gap-1">
                                          <button onClick={() => onStatusChange(b.id, 'confirmed')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Check size={18}/></button>
                                      </div>
                                    </td>
                                </tr>
                                
                                {isExpanded && hasGuests && (
                                  <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <td colSpan={6} className="p-4 px-8">
                                      <div className="flex flex-wrap gap-2">
                                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs flex flex-col gap-0.5 shadow-sm">
                                          <span className="font-bold text-slate-700">{b.user_name} <span className="text-slate-400 font-normal">(Заказчик)</span></span>
                                          <span className="text-slate-400 text-[10px] uppercase">Взрослый</span>
                                        </div>
                                        {guests.map((g, i) => (
                                          <div key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs flex flex-col gap-0.5 shadow-sm">
                                            <span className="font-bold text-slate-700">{g.name}</span>
                                            <div className="flex gap-2 items-center text-[10px] uppercase font-bold text-slate-400">
                                              <span>{getTicketLabel(g.ticketType, g.age)}</span>
                                              {g.equipment && <span className="text-teal-600 bg-teal-50 px-1 rounded border border-teal-100">Жилет: {g.equipment}</span>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 mt-4">
                {filteredBookings.map(b => {
                    const guests: GuestItem[] = Array.isArray(b.guests) ? b.guests : [];
                    const hasGuests = guests.length > 0;

                    return (
                    <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col gap-4 p-5">
                        
                        <div className={clsx(
                            "absolute left-0 top-0 bottom-0 w-1.5",
                            b.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-400'
                        )} />
                        
                        <div className="flex justify-between items-start pl-2">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                  {b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Без даты'}
                                </div>
                                <h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-2">{b.tour?.title}</h3>
                            </div>
                           <select 
    value={b.status} 
    onChange={(e) => onStatusChange(b.id, e.target.value)} 
    className={clsx(
        "text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg px-2 md:px-3 py-1.5 outline-none cursor-pointer border appearance-none w-full transition-colors",
        b.status === 'confirmed' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30" :
        b.status === 'moderation' ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-500/30" :
        b.status === 'awaiting_payment' ? "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" :
        b.status === 'rejected' || b.status === 'cancelled' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/30" :
        "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30"
    )}
>
    <option value="pending">Наличные (Новая)</option>
    <option value="awaiting_payment">Ждет оплаты</option>
    <option value="moderation">Проверка чека</option>
    <option value="confirmed">Оплачено</option>
    <option value="rejected">Отклонено</option>
    <option value="cancelled">Отмена</option>
</select>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 ml-2 border border-slate-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-black text-lg text-slate-900 flex items-center gap-2">
                                        {b.user_name} <span className="text-slate-300 text-xs font-mono font-normal">#{b.short_id || '---'}</span>
                                    </div>
                                    <div className="text-xs font-bold text-teal-600 mt-1">
                                      {formatTickets(b)} • {b.total_price} MDL
                                      {b.amount_paid > 0 && <span className="ml-2 text-emerald-500 border-l border-teal-500/30 pl-2">Аванс: {b.amount_paid}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <a href={`tel:${b.user_phone.replace(/\s/g, '')}`} className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 active:scale-95 transition-transform"><Phone size={14}/></a>
                                    {b.social && <a href={b.social.includes('http') ? b.social : `https://t.me/${b.social.replace('@','')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 active:scale-95 transition-transform"><Send size={14} className="-ml-0.5"/></a>}
                                </div>
                            </div>

                            {hasGuests && (
                                <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Участники ({guests.length + 1}):</span>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="text-xs flex items-center justify-between">
                                            <span className="font-bold text-slate-700">{b.user_name} (Заказчик)</span>
                                            <span className="text-[10px] text-slate-400 uppercase">Взрослый</span>
                                        </div>
                                        {guests.map((g, i) => (
                                            <div key={i} className="text-xs flex items-center justify-between">
                                                <span className="font-medium text-slate-700">{g.name}</span>
                                                <div className="flex items-center gap-1.5">
                                                    {g.equipment && <span className="text-[9px] text-teal-600 bg-teal-50 px-1 rounded border border-teal-100 uppercase">Жилет: {g.equipment}</span>}
                                                    <span className="text-[10px] text-slate-400 uppercase">{getTicketLabel(g.ticketType, g.age)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {b.comment && (
                          <div className="ml-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 flex gap-3 items-start focus-within:border-teal-500 focus-within:bg-white transition-all">
    <AlertCircle size={16} className="text-slate-400 mt-1 shrink-0" />
    <textarea 
        defaultValue={b.comment || ''}
        placeholder="Заметка админа (собаки, байдарки, спец. условия)..."
        onBlur={(e) => {
            if (e.target.value !== b.comment) {
                updateBookingCommentAction(b.id, e.target.value);
                showToast('Заметка сохранена', 'success');
            }
        }}
        className="w-full bg-transparent text-xs font-medium text-slate-700 leading-relaxed outline-none resize-none placeholder:text-slate-300 min-h-[45px]"
    />
</div>
                        )}
                        
                        <div className="ml-2 flex items-center gap-2 mt-[-5px]">
                            {getSourceBadge(b.source)}
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* ========================================== */}
      {/* РЕЖИМ 2: ПЛОСКИЙ МАНИФЕСТ ДЛЯ ГИДА */}
      {/* ========================================== */}
      {activeMode === 'groups' && (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {groupedManifests.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium bg-white rounded-3xl border border-dashed border-slate-200">Активных выездов пока нет</div>
            ) : (
                groupedManifests.map((group, gIdx) => {
                    const key = `${group.tourName}_${group.date}`;
                    const isOpen = expandedGroups[key] || false;

                    return (
                        <div key={gIdx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            
                            {/* Шапка группы */}
                            <div onClick={() => toggleGroup(key)} className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                                        <Map size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight leading-tight">{group.tourName}</h3>
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            <span className="text-teal-600">{group.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{group.totalTickets} мест</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center border transition-transform", isOpen && "rotate-180 bg-slate-100")}>
                                    <ChevronDown size={18} className="text-slate-400" />
                                </div>
                            </div>

                            {/* Раскрывающийся Плоский Манифест */}
                            {isOpen && (
                                <div className="border-t border-slate-100 bg-slate-50/30 overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                      <thead className="bg-slate-100/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                                        <tr>
                                          <th className="px-6 py-4">№</th>
                                          <th className="px-6 py-4">Бронь</th>
                                          <th className="px-6 py-4">ФИО Участника</th>
                                          <th className="px-6 py-4">Билет / Возраст</th>
                                          <th className="px-6 py-4">Снаряжение</th>
                                          <th className="px-6 py-4">Связь</th>
                                          <th className="px-6 py-4">Статус</th>
                                          <th className="px-6 py-4 w-[250px]">Комментарий</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {group.participants.map((p, index) => (
                                          <tr key={`${p.bookingId}-${index}`} className={clsx(
                                            "hover:bg-white transition-colors",
                                            p.isMain && "border-t-2 border-t-slate-200/80 bg-slate-50/50" 
                                          )}>
                                            <td className="px-6 py-4 text-xs font-mono text-slate-400">{index + 1}</td>
                                            
                                            <td className="px-6 py-4">
                                              <span className={clsx("text-xs font-bold px-2 py-1 rounded", p.isMain ? "bg-indigo-100 text-indigo-700" : "text-slate-400 font-mono")}>
                                                #{p.shortId}
                                              </span>
                                            </td>

                                            <td className="px-6 py-4 font-bold text-slate-800">
                                              {p.name}
                                            </td>

                                            <td className="px-6 py-4 text-xs uppercase font-bold text-slate-400 tracking-wider">
                                              {getTicketLabel(p.ticketType, p.age)}
                                            </td>

                                            <td className="px-6 py-4">
                                              {p.equipment ? (
                                                <span className="flex items-center w-fit gap-1 text-[10px] uppercase font-black tracking-widest bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-200">
                                                  <LifeBuoy size={12}/> Жилет: {p.equipment}
                                                </span>
                                              ) : <span className="text-slate-300">—</span>}
                                            </td>

                                            <td className="px-6 py-4">
                                              {p.phone && p.phone !== '—' ? (
                                                <div className="flex items-center gap-2">
                                                  <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="font-mono text-xs text-slate-600 hover:text-teal-600">{p.phone}</a>
                                                  {p.isMain && p.social && <Send size={12} className="text-sky-500"/>}
                                                </div>
                                              ) : <span className="text-slate-300">—</span>}
                                            </td>

                                            <td className="px-6 py-4">
                                              {p.status === 'confirmed' ? (
                                                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Оплачено</span>
                                              ) : (
                                                <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Ожидает</span>
                                              )}
                                            </td>

                                            <td className="px-6 py-4 text-xs text-slate-400 whitespace-normal">
                                              {p.isMain && p.comment ? <span className="italic">«{p.comment}»</span> : null}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    
                                    {/* ПАНЕЛЬ ДЕЙСТВИЙ (РУПОР И БОТ) */}
                                    <div className="p-4 md:p-6 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-end gap-3">
                                        {/* ✅ ИСПРАВЛЕНИЕ: Добавлен onClick */}
                                        <button 
                                            onClick={() => setBroadcastModal({ isOpen: true, group })}
                                            className="px-5 py-2.5 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            📢 Рассылка участникам
                                        </button>
                                        <button 
                                            onClick={() => handleSendToBot(group)}
                                            className="px-5 py-2.5 bg-teal-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Send size={16} /> Отправить список боту
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      )}

      {/* МОДАЛКА РАССЫЛКИ */}
      {broadcastModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-900">Рассылка участникам</h3>
                <p className="text-xs font-bold text-teal-600 uppercase mt-1">
                  {broadcastModal.group?.tourName} ({broadcastModal.group?.date})
                </p>
              </div>
              {/* ✅ ИСПРАВЛЕНИЕ: Вернул правильную кнопку закрытия с крестиком */}
              <button 
                onClick={() => setBroadcastModal({isOpen: false, group: null})} 
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl text-xs font-medium border border-amber-200/50 flex gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {/* ✅ ИСПРАВЛЕНИЕ: Обновил текст на актуальный */}
                <p>Сообщение получат <b>все активные участники (Оплачено и Ожидает)</b>, у которых привязан Telegram к личному кабинету.</p>
              </div>
              <div>
                <textarea 
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Например: Ребята, завтра обещают дождь, обязательно возьмите дождевики и гермомешки..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none text-sm text-slate-700 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setBroadcastModal({isOpen: false, group: null})}
                className="px-6 py-3 font-bold text-slate-300 text-xs uppercase tracking-widest hover:text-slate-700 transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleBroadcastSubmit}
                disabled={isBroadcasting}
                className="px-6 py-3 bg-teal-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isBroadcasting ? 'Отправка...' : 'Отправить в Telegram'} <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}