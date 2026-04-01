"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, X as XIcon, Phone, Send, Instagram, 
  Users, ChevronDown, Map, AlertCircle, Globe, LifeBuoy, ChevronUp, Eye, Inbox, Archive
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
  
  payment_method: string; 
  discount: number;       
  tourId: string;         
  tourDateId?: string;    
  
  comment?: string | null;
  social?: string | null;
  tour?: { title: string; date: Date | string };
  
  guests?: GuestItem[] | any; 

  // Новые поля для чеков
  payment_proof_url?: string | null;
  receipt_url?: string | null;
  confirmed_by?: string | null;
  confirmed_at?: Date | string | null;
}

interface BookingsTabProps {
  bookings: BookingItem[];
  onStatusChange: (id: string, status: string) => void;
}

type TabMode = 'list' | 'groups';
type FilterTab = 'active' | 'archive';

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
    case 'telegram': return <span className="bg-sky-500/10 text-sky-600 border border-sky-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Send size={8}/> TG</span>;
    case 'instagram': return <span className="bg-pink-500/10 text-pink-600 border border-pink-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Instagram size={8}/> INST</span>;
    case 'offline': return <span className="bg-slate-500/10 text-slate-700 border border-slate-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Users size={8}/> OFFLINE</span>;
    default: return <span className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] uppercase font-bold"><Globe size={8}/> WEB</span>;
  }
};

const isPastTour = (dateStr?: Date | string) => {
  if (!dateStr) return false;
  const tourDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  return tourDate < today;
};

// --- КОМПОНЕНТ ---
export default function BookingsTab({ bookings, onStatusChange }: BookingsTabProps) {
  const [activeMode, setActiveMode] = useState<TabMode>('list'); // ✅ ПО УМОЛЧАНИЮ "ЛЕНТА"
  const [filterTab, setFilterTab] = useState<FilterTab>('active'); // ✅ АРХИВ / АКТИВНЫЕ
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null); 
  const { showToast } = useToast();

  // Состояния для Модалок
  const [broadcastModal, setBroadcastModal] = useState<{isOpen: boolean, group: any | null}>({isOpen: false, group: null});
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const [receiptModal, setReceiptModal] = useState<{isOpen: boolean, booking: BookingItem | null}>({isOpen: false, booking: null});

  // 1. Фильтрация для Ленты (Умная фильтрация по архиву)
  const filteredBookings = useMemo(() => {
    let data = bookings;

    // Поиск
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(b => 
        b.user_name.toLowerCase().includes(lower) || 
        b.user_phone.includes(lower) ||
        (b.tour?.title || '').toLowerCase().includes(lower) ||
        (b.comment || '').toLowerCase().includes(lower)
      );
    }

    // Фильтр Активные/Архив
    data = data.filter(b => {
        const isPast = isPastTour(b.tour?.date);
        const isArchivedStatus = ['cancelled', 'rejected'].includes(b.status);
        const isArchive = isPast || isArchivedStatus;
        return filterTab === 'archive' ? isArchive : !isArchive;
    });

    return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bookings, searchTerm, filterTab]);

  // 2. Группировка и ПЛОСКИЙ МАНИФЕСТ для Гидов (С фиксом дублей)
  const groupedManifests = useMemo(() => {
    const groups: Record<string, { 
      tourName: string; 
      date: string; 
      participants: any[]; 
      totalTickets: number;
    }> = {};

    bookings.forEach(b => {
      if (['cancelled', 'rejected', 'awaiting_payment', 'moderation'].includes(b.status)) return; 
       
      const dateObj = b.tour?.date ? new Date(b.tour.date) : null;
      const dateStr = dateObj ? dateObj.toLocaleDateString('ru-RU') : 'Дата уточняется';
      const tourName = b.tour?.title || 'Неизвестный тур';
      
      // ✅ ИСПРАВЛЕНИЕ: Жесткий ключ группировки (Игнорируем разные tourDateId для одной даты)
      const isoDate = dateObj ? dateObj.toISOString().split('T')[0] : 'nodate';
      const key = `${b.tourId}_${isoDate}`; 

      if (!groups[key]) {
        groups[key] = { tourName, date: dateStr, participants: [], totalTickets: 0 };
      }

      const shortId = b.short_id || b.id.substring(0, 4);
      const totalInBooking = (b.tickets_adult || 0) + (b.tickets_child || 0) + (b.tickets_member || 0) + ((b.tickets_family || 0) * 3);
      groups[key].totalTickets += totalInBooking;

      // Добавляем Заказчика
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
      });

      // ✅ ИСПРАВЛЕНИЕ: Фильтруем гостей, чтобы убрать заказчика из списка (по совпадению имени)
      const rawGuests: GuestItem[] = Array.isArray(b.guests) ? b.guests : [];
      const uniqueGuests = rawGuests.filter(g => g.name.trim().toLowerCase() !== b.user_name.trim().toLowerCase());
      
      uniqueGuests.forEach((g) => {
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

  // Экшены
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

  const handleSendToBot = async (group: any) => {
    showToast('Отправка манифеста...', 'info'); 
    const res = await sendManifestToTelegramAction({
      tourName: group.tourName,
      date: group.date,
      totalTickets: group.totalTickets,
      participants: group.participants
    });
    if (res.success) showToast('Манифест успешно отправлен в Telegram!', 'success');
    else showToast(`Ошибка: ${res.error}`, 'error');
  };

  const handleStatusChangeWithModalClose = (id: string, status: string) => {
    onStatusChange(id, status);
    if (receiptModal.isOpen) setReceiptModal({isOpen: false, booking: null});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER: Навигация */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
          <Users size={28} className="text-teal-500" />
          Управление заявками
        </h1>
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit">
            <button 
                onClick={() => setActiveMode('list')}
                className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all", activeMode === 'list' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
            >Лента</button>
            <button 
                onClick={() => setActiveMode('groups')}
                className={clsx("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all", activeMode === 'groups' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
            >Списки групп</button>
        </div>
      </div>

      {/* ========================================== */}
      {/* РЕЖИМ 1: ЛЕНТА */}
      {/* ========================================== */}
      {activeMode === 'list' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            
            {/* Панель фильтров: Поиск + Активные/Архив */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm items-center">
                <div className="flex items-center relative w-full md:w-auto md:flex-1">
                    <Search className="absolute left-3 text-slate-400" size={18}/>
                    <input 
                        placeholder="Поиск по ФИО, телефону или заметкам..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium outline-none text-slate-900 border border-slate-100 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400" 
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
                
                {/* ✅ ИСПРАВЛЕНИЕ: Переключатель Архива */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto shrink-0">
                  <button 
                    onClick={() => setFilterTab('active')}
                    className={clsx("flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all", filterTab === 'active' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                  >
                    <Inbox size={14}/> Активные
                  </button>
                  <button 
                    onClick={() => setFilterTab('archive')}
                    className={clsx("flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all", filterTab === 'archive' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                  >
                    <Archive size={14}/> Архив
                  </button>
                </div>
            </div>

            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left table-fixed">
                    {/* ✅ ИСПРАВЛЕНИЕ: Убрали колонку "Действия" */}
                    <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="p-5 w-[20%]">Тур и Дата</th>
                            <th className="p-5 w-[20%]">Клиент</th>
                            <th className="p-5 w-[15%]">Экономика</th>
                            <th className="p-5 w-[25%]">Комментарий</th>
                            <th className="p-5 w-[20%] text-center">Статус</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredBookings.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Ничего не найдено</td></tr>
                        )}
                        {filteredBookings.map(b => {
                            const rawGuests: GuestItem[] = Array.isArray(b.guests) ? b.guests : [];
                            const guests = rawGuests.filter(g => g.name.trim().toLowerCase() !== b.user_name.trim().toLowerCase());
                            const hasGuests = guests.length > 0;
                            const isExpanded = expandedRow === b.id;

                            return (
                              <React.Fragment key={b.id}>
                                <tr className="group hover:bg-slate-50/80 transition-colors">
                                    <td className="p-5 align-top">
                                        <div className="font-black text-slate-900 line-clamp-2 mb-1.5">{b.tour?.title || 'Без названия'}</div>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700">
                                            {b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Неизвестно'}
                                        </div>
                                    </td>
                                    
                                    <td className="p-5 align-top">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-black text-slate-900 text-sm">
                                                {b.user_name} <span className="text-slate-400 text-xs font-mono ml-1">#{b.short_id || '---'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 mt-1.5">
                                            <span className="text-xs text-slate-700 font-medium"><Phone size={10} className="inline text-slate-400 mr-1"/> {b.user_phone}</span>
                                            {/* ✅ ИСПРАВЛЕНИЕ: Точная дата заявки */}
                                            <span className="text-[10px] text-slate-400 font-medium mt-1">Создано: {new Date(b.created_at).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>
                                  
                                    <td className="p-5 align-top">
                                        <div className="font-black text-slate-900 mb-1.5 text-xs">{formatTickets(b)}</div>
                                        
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-black text-slate-900">{b.total_price} MDL</span>
                                            {b.discount > 0 && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">-{b.discount} б.</span>}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded w-fit">
                                              {b.payment_method === 'qr' ? 'Клевер QR' : b.payment_method === 'biletpmr' ? 'BiletPMR' : 'Наличные'}
                                          </div>
                                          {b.amount_paid > 0 && <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Аванс: {b.amount_paid}</div>}
                                        </div>

                                        {hasGuests && (
                                          <button 
                                            onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                                            className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/50 px-2.5 py-1.5 rounded-lg transition-colors"
                                          >
                                            👥 Гости ({guests.length}) {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                          </button>
                                        )}
                                    </td>
                                    
                                    <td className="p-5 align-top">
                                        {/* ✅ ИСПРАВЛЕНИЕ: Четкое поле комментария */}
                                        <textarea 
                                            defaultValue={b.comment || ''}
                                            placeholder="Заметки админа (собаки, лодки)..."
                                            onBlur={(e) => {
                                                if (e.target.value !== b.comment) {
                                                    updateBookingCommentAction(b.id, e.target.value);
                                                    showToast('Комментарий сохранен', 'success');
                                                }
                                            }}
                                            className="w-full min-h-[70px] text-xs p-3 bg-white border border-slate-300 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm resize-y placeholder:text-slate-400 text-slate-800 transition-all font-medium"
                                        />
                                    </td>
                                    
                                    <td className="p-5 text-center align-top flex flex-col gap-2">
                                        <select 
                                            value={b.status} 
                                            onChange={(e) => onStatusChange(b.id, e.target.value)} 
                                            className={clsx(
                                                "text-xs font-black uppercase tracking-wider rounded-xl px-3 py-2 outline-none cursor-pointer border appearance-none w-full transition-colors shadow-sm",
                                                b.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                                                b.status === 'moderation' ? "bg-sky-50 text-sky-700 border-sky-300" :
                                                b.status === 'awaiting_payment' ? "bg-white text-slate-700 border-slate-300" :
                                                b.status === 'rejected' || b.status === 'cancelled' ? "bg-rose-50 text-rose-700 border-rose-300" :
                                                "bg-amber-50 text-amber-700 border-amber-300"
                                            )}
                                        >
                                            <option value="pending">Наличные (Новая)</option>
                                            <option value="awaiting_payment">Ждет оплаты</option>
                                            <option value="moderation">Проверка чека</option>
                                            <option value="confirmed">Оплачено</option>
                                            <option value="rejected">Отклонено</option>
                                            <option value="cancelled">Отмена</option>
                                        </select>

                                        {/* ✅ ИСПРАВЛЕНИЕ: Кнопка проверки чека */}
                                        {b.payment_proof_url && (
                                           <button 
                                              onClick={() => setReceiptModal({ isOpen: true, booking: b })}
                                              className="w-full flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                           >
                                              <Eye size={14}/> Скриншот
                                           </button>
                                        )}
                                    </td>
                                </tr>
                                
                                {isExpanded && hasGuests && (
                                  <tr className="bg-slate-100/50 border-b border-slate-200/60">
                                    <td colSpan={5} className="p-4 px-8">
                                      <div className="flex flex-wrap gap-2">
                                        <div className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs flex flex-col gap-0.5 shadow-sm">
                                          <span className="font-black text-slate-900">{b.user_name} <span className="text-slate-400 font-medium">(Заказчик)</span></span>
                                          <span className="text-slate-500 text-[10px] font-bold uppercase">Взрослый</span>
                                        </div>
                                        {guests.map((g, i) => (
                                          <div key={i} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs flex flex-col gap-0.5 shadow-sm">
                                            <span className="font-bold text-slate-800">{g.name}</span>
                                            <div className="flex gap-2 items-center text-[10px] uppercase font-bold text-slate-500">
                                              <span>{getTicketLabel(g.ticketType, g.age)}</span>
                                              {g.equipment && <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Жилет: {g.equipment}</span>}
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
                    const rawGuests: GuestItem[] = Array.isArray(b.guests) ? b.guests : [];
                    const guests = rawGuests.filter(g => g.name.trim().toLowerCase() !== b.user_name.trim().toLowerCase());
                    const hasGuests = guests.length > 0;

                    return (
                    <div key={b.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col gap-4 p-5">
                        
                        <div className={clsx(
                            "absolute left-0 top-0 bottom-0 w-1.5",
                            b.status === 'confirmed' ? 'bg-emerald-500' : 
                            b.status === 'cancelled' || b.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-400'
                        )} />
                        
                        <div className="flex justify-between items-start pl-2 gap-2">
                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                  {b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Без даты'}
                                </div>
                                <h3 className="font-black text-sm text-slate-900 leading-tight line-clamp-2">{b.tour?.title}</h3>
                            </div>
                           <select 
                              value={b.status} 
                              onChange={(e) => onStatusChange(b.id, e.target.value)} 
                              className={clsx(
                                  "text-[10px] shrink-0 font-black uppercase tracking-wider rounded-xl px-2 py-1.5 outline-none cursor-pointer border appearance-none transition-colors",
                                  b.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                                  b.status === 'moderation' ? "bg-sky-50 text-sky-700 border-sky-300" :
                                  b.status === 'awaiting_payment' ? "bg-white text-slate-700 border-slate-300" :
                                  b.status === 'rejected' || b.status === 'cancelled' ? "bg-rose-50 text-rose-700 border-rose-300" :
                                  "bg-amber-50 text-amber-700 border-amber-300"
                              )}
                          >
                              <option value="pending">Новая</option>
                              <option value="awaiting_payment">Ожидает</option>
                              <option value="moderation">Проверка</option>
                              <option value="confirmed">Оплачено</option>
                              <option value="cancelled">Отмена</option>
                          </select>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 ml-2 border border-slate-200 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-black text-lg text-slate-900 flex items-center gap-2">
                                        {b.user_name} <span className="text-slate-400 text-xs font-mono font-medium">#{b.short_id || '---'}</span>
                                    </div>
                                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                                      Создано: {new Date(b.created_at).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    
                                    {/* ✅ ТЕПЕРЬ ТУТ ПОЛНАЯ ЭКОНОМИКА (Билеты, Сумма, Аванс) */}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                                      <div className="text-xs font-black text-teal-700">
                                        {formatTickets(b)} • {b.total_price} MDL
                                        {b.amount_paid > 0 && <span className="ml-2 text-emerald-600 border-l border-teal-500/30 pl-2">Аванс: {b.amount_paid}</span>}
                                      </div>
                                      
                                      {/* ✅ НОВЫЕ БЕЙДЖИ ОПЛАТЫ И СКИДКИ */}
                                      <div className="flex gap-1.5 items-center">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300/50">
                                          {b.payment_method === 'qr' ? 'Клевер QR' : b.payment_method === 'biletpmr' ? 'BiletPMR' : 'Наличные'}
                                        </span>
                                        {b.discount > 0 && (
                                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                                            -{b.discount} б.
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    </div>
                                <div className="flex gap-2 shrink-0">
                                    <a href={`tel:${b.user_phone.replace(/\s/g, '')}`} className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 active:scale-95 transition-transform"><Phone size={16}/></a>
                                    {b.social && <a href={b.social.includes('http') ? b.social : `https://t.me/${b.social.replace('@','')}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 active:scale-95 transition-transform"><Send size={16} className="-ml-0.5"/></a>}
                                </div>
                            </div>

                            {/* ✅ ИСПРАВЛЕНИЕ: Кнопка Чек на мобилке */}
                            {b.payment_proof_url && (
                                <button 
                                  onClick={() => setReceiptModal({ isOpen: true, booking: b })}
                                  className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                                >
                                  <Eye size={16}/> Посмотреть скриншот оплаты
                                </button>
                            )}

                            {hasGuests && (
                                <div className="pt-3 border-t border-slate-200 flex flex-col gap-2 mt-1">
                                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Участники ({guests.length + 1}):</span>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="text-xs flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                            <span className="font-bold text-slate-900">{b.user_name} <span className="text-[10px] text-slate-400 font-normal">(Заказчик)</span></span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Взрослый</span>
                                        </div>
                                        {guests.map((g, i) => (
                                            <div key={i} className="text-xs flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                                <span className="font-bold text-slate-800">{g.name}</span>
                                                <div className="flex items-center gap-1.5">
                                                    {g.equipment && <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 uppercase">Жилет: {g.equipment}</span>}
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{getTicketLabel(g.ticketType, g.age)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="ml-2 bg-white border border-slate-300 rounded-2xl p-1 flex gap-2 items-start focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 shadow-sm transition-all">
                            <AlertCircle size={16} className="text-slate-400 mt-2.5 ml-2 shrink-0" />
                            <textarea 
                                defaultValue={b.comment || ''}
                                placeholder="Заметки (собаки, лодки)..."
                                onBlur={(e) => {
                                    if (e.target.value !== b.comment) {
                                        updateBookingCommentAction(b.id, e.target.value);
                                        showToast('Заметка сохранена', 'success');
                                    }
                                }}
                                className="w-full bg-transparent text-xs font-medium text-slate-900 leading-relaxed outline-none resize-none placeholder:text-slate-400 min-h-[50px] p-2"
                            />
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
                <div className="p-10 text-center text-slate-500 font-medium bg-white rounded-3xl border border-dashed border-slate-300">Активных выездов пока нет</div>
            ) : (
                groupedManifests.map((group, gIdx) => {
                    const key = `${group.tourName}_${group.date}`;
                    const isOpen = expandedGroups[key] || false;

                    return (
                        <div key={gIdx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <div onClick={() => toggleGroup(key)} className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20">
                                        <Map size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight leading-tight">{group.tourName}</h3>
                                        <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest mt-1">
                                            <span className="text-teal-700">{group.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{group.totalTickets} мест</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 transition-transform", isOpen && "rotate-180 bg-slate-100")}>
                                    <ChevronDown size={18} className="text-slate-500" />
                                </div>
                            </div>

                            {isOpen && (
                                <div className="border-t border-slate-200 bg-slate-50/50 overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                      <thead className="bg-slate-200/50 text-slate-600 text-[10px] font-black uppercase tracking-widest border-b border-slate-300">
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
                                      <tbody className="divide-y divide-slate-200/60">
                                        {group.participants.map((p, index) => (
                                          <tr key={`${p.bookingId}-${index}`} className={clsx(
                                            "hover:bg-white transition-colors",
                                            p.isMain && "border-t-[3px] border-t-slate-200 bg-slate-100/50" 
                                          )}>
                                            <td className="px-6 py-4 text-xs font-black text-slate-500">{index + 1}</td>
                                            <td className="px-6 py-4">
                                              <span className={clsx("text-xs font-black px-2 py-1 rounded", p.isMain ? "bg-indigo-100 text-indigo-800" : "text-slate-400 font-mono")}>
                                                #{p.shortId}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-900">{p.name}</td>
                                            <td className="px-6 py-4 text-xs uppercase font-bold text-slate-600 tracking-wider">
                                              {getTicketLabel(p.ticketType, p.age)}
                                            </td>
                                            <td className="px-6 py-4">
                                              {p.equipment ? (
                                                <span className="flex items-center w-fit gap-1 text-[10px] uppercase font-black tracking-widest bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300">
                                                  <LifeBuoy size={12}/> Жилет: {p.equipment}
                                                </span>
                                              ) : <span className="text-slate-400">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                              {p.phone && p.phone !== '—' ? (
                                                <div className="flex items-center gap-2">
                                                  <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="font-mono text-xs font-bold text-slate-700 hover:text-teal-700">{p.phone}</a>
                                                  {p.isMain && p.social && <Send size={12} className="text-sky-600"/>}
                                                </div>
                                              ) : <span className="text-slate-400">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                              {p.status === 'confirmed' ? (
                                                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded">Оплачено</span>
                                              ) : (
                                                <span className="text-[10px] uppercase font-black tracking-widest text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded">Ожидает</span>
                                              )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-normal">
                                              {p.isMain && p.comment ? <span className="italic">«{p.comment}»</span> : null}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    
                                    <div className="p-4 md:p-6 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-end gap-3">
                                        <button 
                                            onClick={() => setBroadcastModal({ isOpen: true, group })}
                                            className="px-6 py-3 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            📢 Рассылка участникам
                                        </button>
                                        <button 
                                            onClick={() => handleSendToBot(group)}
                                            className="px-6 py-3 bg-teal-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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

      {/* ========================================== */}
      {/* МОДАЛКА: ПРОВЕРКА ЧЕКА */}
      {/* ========================================== */}
      {receiptModal.isOpen && receiptModal.booking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-lg text-slate-900">Проверка оплаты</h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Бронь #{receiptModal.booking.short_id || receiptModal.booking.id.substring(0,4)} • {receiptModal.booking.user_name}
                </p>
              </div>
              <button 
                onClick={() => setReceiptModal({isOpen: false, booking: null})} 
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
              >
                <XIcon size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto bg-slate-100 flex items-center justify-center relative min-h-[300px]">
              {receiptModal.booking.payment_proof_url ? (
                  <img 
                    src={receiptModal.booking.payment_proof_url} 
                    alt="Скриншот оплаты" 
                    className="max-h-[50vh] object-contain rounded-xl shadow-sm border border-slate-200 bg-white"
                  />
              ) : (
                  <div className="text-slate-400 font-medium flex flex-col items-center gap-2">
                    <AlertCircle size={32} />
                    <span>Файл чека не найден</span>
                  </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex flex-col gap-3">
              <div className="flex justify-between items-center px-2 mb-2">
                 <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">К оплате:</span>
                 <span className="text-2xl font-black text-slate-900">{receiptModal.booking.total_price} MDL</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleStatusChangeWithModalClose(receiptModal.booking!.id, 'rejected')}
                  className="flex-1 py-3.5 bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  ❌ Отклонить
                </button>
                <button 
                  onClick={() => handleStatusChangeWithModalClose(receiptModal.booking!.id, 'confirmed')}
                  className="flex-[2] py-3.5 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-md transition-colors"
                >
                  ✅ Подтвердить чек
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА: РАССЫЛКА */}
      {broadcastModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-lg text-slate-900">Рассылка участникам</h3>
                <p className="text-xs font-bold text-teal-700 uppercase mt-1">
                  {broadcastModal.group?.tourName} ({broadcastModal.group?.date})
                </p>
              </div>
              <button 
                onClick={() => setBroadcastModal({isOpen: false, group: null})} 
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl text-xs font-medium border border-amber-200 flex gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <p>Сообщение получат <b>все активные участники (Оплачено и Ожидает)</b>, у которых привязан Telegram к кабинету.</p>
              </div>
              <div>
                <textarea 
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Например: Ребята, завтра обещают дождь, возьмите дождевики..."
                  className="w-full h-32 p-4 bg-white border border-slate-300 rounded-2xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-inner resize-none text-sm text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setBroadcastModal({isOpen: false, group: null})}
                className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl text-xs uppercase tracking-widest transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleBroadcastSubmit}
                disabled={isBroadcasting}
                className="px-6 py-3 bg-teal-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
              >
                {isBroadcasting ? 'Отправка...' : 'Отправить'} <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}