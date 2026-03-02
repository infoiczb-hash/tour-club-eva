"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, Check, X as XIcon, Phone, Send, Instagram, 
  Users, ClipboardCopy, ChevronDown, Map, AlertCircle
} from 'lucide-react';
import { BookingStatus } from '@prisma/client';
import { clsx } from 'clsx';
import { useToast } from '@/shared/context/ToastContext';

// --- ИНТЕРФЕЙСЫ ---
interface BookingItem {
  id: string;
  user_name: string;
  user_phone: string;
  status: BookingStatus;
  created_at: Date | string;
  tickets_adult: number;
  tickets_child: number;
  tickets_member?: number;
  total_price: number;
  comment?: string;
  social?: string;
  event_id: string;
  tour?: { title: string; date: Date | string };
}

interface BookingsTabProps {
  bookings: BookingItem[];
  onStatusChange: (id: string, status: string) => void;
}

type TabMode = 'list' | 'groups';

// --- ХЕЛПЕР: ФОРМАТИРОВАНИЕ БИЛЕТОВ ---
const formatTickets = (b: BookingItem) => {
  const parts = [];
  if (b.tickets_adult > 0) parts.push(`${b.tickets_adult} взр`);
  if (b.tickets_child > 0) parts.push(`${b.tickets_child} дет`);
  
  // Добавляем проверку на семейные билеты (из нашей схемы Prisma)
  // @ts-ignore - если поле добавлено недавно и TS еще не видит его в интерфейсе
  const familyCount = b.tickets_family || 0;
  if (familyCount > 0) parts.push(`${familyCount} сем`);
  
  return parts.join(' + ') || '0';
};

export default function BookingsTab({ bookings, onStatusChange }: BookingsTabProps) {
  const [activeMode, setActiveMode] = useState<TabMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  // --- ЛОГИКА ВЫЧИСЛЕНИЙ ---
  
  // 1. Фильтрация для Ленты (Менеджер)
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

  // 2. Группировка для Гидов (Списки групп)
  const groupedBookings = useMemo(() => {
    const groups: Record<string, { tourName: string; date: string; bookings: BookingItem[]; totalTickets: number }> = {};

    bookings.forEach(b => {
       // В списки гидам попадают только подтвержденные и новые (отмененные не нужны)
       if (b.status === 'cancelled') return; 
       
       const dateStr = b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Дата уточняется';
       const tourName = b.tour?.title || 'Неизвестный тур';
       const key = `${tourName}_${dateStr}`;

       if (!groups[key]) {
         groups[key] = { tourName, date: dateStr, bookings: [], totalTickets: 0 };
       }

       groups[key].bookings.push(b);
       groups[key].totalTickets += (b.tickets_adult || 0) + (b.tickets_child || 0) + (b.tickets_member || 0);
    });

    // Сортируем группы по дате выезда
    return Object.values(groups).sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('.');
        const [dayB, monthB, yearB] = b.date.split('.');
        const dateA = new Date(`${yearA}-${monthA}-${dayA}`).getTime();
        const dateB = new Date(`${yearB}-${monthB}-${dayB}`).getTime();
        return dateA - dateB;
    });
  }, [bookings]);

  // --- ХЕНДЛЕРЫ ---
  const toggleGroup = (key: string) => {
      setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyGroup = (group: any) => {
      let text = `📋 *Список группы*\n🏔 ${group.tourName}\n📅 ${group.date}\n\n`;
      
      group.bookings.forEach((b: BookingItem, i: number) => {
         const ticketsStr = formatTickets(b);
         const statusMark = b.status === 'pending' ? ' ⏳(Не оплачено)' : '';
         // Чистый список без комментариев
         text += `${i+1}. ${b.user_name} — ${ticketsStr}\n📞 ${b.user_phone}${statusMark}\n\n`;
      });
      
      text += `👥 *Всего билетов: ${group.totalTickets}*`;

      navigator.clipboard.writeText(text).then(() => {
          showToast('Список скопирован в буфер обмена', 'success');
      });
  };

  const renderSocialIcon = (social?: string) => {
      if (!social) return null;
      const lower = social.toLowerCase();
      if (lower.includes('inst')) return <Instagram size={12} className="text-pink-500" />;
      return <Send size={12} className="text-sky-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER: Заголовок и Навигация */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Users size={28} className="text-teal-500" />
            Управление заявками
          </h1>
        </div>

        {/* Переключатель режимов */}
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
            <button 
                onClick={() => setActiveMode('list')}
                className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
                    activeMode === 'list' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
            >
                Лента
            </button>
            <button 
                onClick={() => setActiveMode('groups')}
                className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
                    activeMode === 'groups' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
            >
                Списки групп
            </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* РЕЖИМ 1: ЛЕНТА ВСЕХ ЗАЯВОК (Для менеджера) */}
      {/* ========================================== */}
      {activeMode === 'list' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            {/* Поиск */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center relative">
                    <Search className="absolute left-3 text-slate-400" size={18}/>
                    <input 
                        placeholder="Поиск по имени, телефону или комментарию..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-medium outline-none text-slate-900 dark:text-white placeholder:text-slate-400" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* Desktop Table (Скрыта на мобилках) */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left table-fixed">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="p-5 w-[20%]">Тур и Дата</th>
                            <th className="p-5 w-[15%]">Клиент</th>
                            <th className="p-5 w-[15%]">Экономика</th>
                            {/* Выделенная колонка под текст */}
                            <th className="p-5 w-[25%]">Комментарий</th>
                            <th className="p-5 w-[15%] text-center">Статус</th>
                            <th className="p-5 w-[10%] text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredBookings.map(b => (
                            <tr key={b.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-5 align-top">
                                    <div className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 leading-snug">{b.tour?.title || 'Без названия'}</div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-500">
                                        {b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Неизвестно'}
                                    </div>
                                </td>
                                <td className="p-5 align-top">
                                    <div className="font-bold text-slate-900 dark:text-white mb-1">
                                        {b.user_name}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <a href={`tel:${b.user_phone.replace(/\s/g, '')}`} className="text-xs text-slate-500 hover:text-teal-500 transition-colors flex items-center gap-1 font-mono">
                                            <Phone size={10}/> {b.user_phone}
                                        </a>
                                        {b.social && (
                                            <span className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 w-fit">
                                                {renderSocialIcon(b.social)} {b.social.replace('https://t.me/', '@')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-5 align-top">
                                    <div className="font-black text-slate-900 dark:text-white mb-1 text-xs">
                                        {formatTickets(b)}
                                    </div>
                                    <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-500/10 w-fit px-2 py-0.5 rounded">
                                        {b.total_price.toLocaleString()} MDL
                                    </div>
                                </td>
                                <td className="p-5 align-top">
                                    {b.comment ? (
                                        <div 
                                            className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-3 cursor-help border-l-2 border-amber-500/50 pl-2"
                                            title={b.comment} // Нативный тултип при наведении
                                        >
                                            {b.comment}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 opacity-50">—</span>
                                    )}
                                </td>
                                <td className="p-5 text-center align-top">
                                    <select 
                                        value={b.status} 
                                        onChange={(e) => onStatusChange(b.id, e.target.value)} 
                                        className={clsx(
                                            "text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-1.5 outline-none cursor-pointer border appearance-none text-center w-full",
                                            b.status === 'confirmed' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30" :
                                            b.status === 'cancelled' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/30" :
                                            "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30"
                                        )}
                                    >
                                        <option value="pending">Ожидает</option>
                                        <option value="confirmed">Оплачено</option>
                                        <option value="cancelled">Отмена</option>
                                    </select>
                                </td>
                                <td className="p-5 text-right align-top">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onStatusChange(b.id, 'confirmed')} title="Подтвердить" className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"><Check size={18}/></button>
                                        <button onClick={() => onStatusChange(b.id, 'cancelled')} title="Отменить" className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><XIcon size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredBookings.length === 0 && (
                    <div className="p-10 text-center text-slate-500 font-medium">Заявок не найдено</div>
                )}
            </div>

            {/* Mobile Cards (Скрыты на десктопе) */}
            <div className="md:hidden space-y-4">
                {filteredBookings.map(b => (
                    <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-4">
                        
                        <div className={clsx(
                            "absolute left-0 top-0 bottom-0 w-1.5",
                            b.status === 'confirmed' ? 'bg-emerald-500' : b.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-400'
                        )} />
                        
                        <div className="flex justify-between items-start pl-2">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{b.tour?.date ? new Date(b.tour.date).toLocaleDateString('ru-RU') : 'Без даты'}</div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight line-clamp-2">{b.tour?.title}</h3>
                            </div>
                            <select 
                                value={b.status} 
                                onChange={(e) => onStatusChange(b.id, e.target.value)} 
                                className="bg-transparent text-[10px] font-black uppercase text-slate-400 outline-none text-right"
                            >
                                <option value="pending">Новая</option>
                                <option value="confirmed">Оплачено</option>
                                <option value="cancelled">Отмена</option>
                            </select>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 ml-2 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <div className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    {b.user_name}
                                </div>
                                <div className="text-xs font-bold text-teal-600 mt-1">{formatTickets(b)} • {b.total_price} MDL</div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <a href={`tel:${b.user_phone.replace(/\s/g, '')}`} className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 active:scale-95 transition-transform"><Phone size={16}/></a>
                                {b.social && <a href={b.social.includes('http') ? b.social : `https://t.me/${b.social.replace('@','')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 active:scale-95 transition-transform"><Send size={16} className="-ml-0.5"/></a>}
                            </div>
                        </div>

                        {/* Комментарий в мобильной карточке */}
                        {b.comment && (
                            <div className="ml-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 items-start">
                                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-200/80 leading-relaxed">{b.comment}</p>
                            </div>
                        )}

                    </div>
                ))}
            </div>
        </div>
      )}

      {/* ========================================== */}
      {/* РЕЖИМ 2: СПИСКИ ГРУПП (Для гидов в полях)  */}
      {/* ========================================== */}
      {activeMode === 'groups' && (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {groupedBookings.length === 0 ? (
                <div className="p-10 text-center text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    Активных выездов пока нет
                </div>
            ) : (
                groupedBookings.map((group, gIdx) => {
                    const key = `${group.tourName}_${group.date}`;
                    const isOpen = expandedGroups[key] || false;

                    return (
                        <div key={gIdx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
                            
                            {/* Шапка группы */}
                            <div 
                                onClick={() => toggleGroup(key)}
                                className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20 shrink-0 group-hover:scale-105 transition-transform">
                                        <Map size={24} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg md:text-xl text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-1">{group.tourName}</h3>
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            <span className="text-teal-600">{group.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                            <span>{group.totalTickets} билетов</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 border border-slate-200 dark:border-slate-700", isOpen && "rotate-180 bg-slate-100 dark:bg-slate-800")}>
                                    <ChevronDown size={18} className="text-slate-400" />
                                </div>
                            </div>

                            {/* Раскрывающийся чистый список */}
                            {isOpen && (
                                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                                    <div className="p-4 md:p-6 space-y-2">
                                        {group.bookings.map((b, i) => (
                                            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-3">
                                                
                                                {/* Имя и билеты */}
                                                <div className="flex items-start gap-3">
                                                    <label className="flex items-center gap-3 cursor-pointer group/chk">
                                                        <div className="relative flex items-center justify-center w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 bg-transparent group-hover/chk:border-teal-500 transition-colors shrink-0 mt-0.5">
                                                            <input type="checkbox" className="peer sr-only" />
                                                            <Check size={14} strokeWidth={4} className="text-white opacity-0 peer-checked:opacity-100 absolute z-10" />
                                                            <div className="absolute inset-0 bg-teal-500 rounded-[2px] opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-900 dark:text-white leading-none mb-1">{b.user_name}</div>
                                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{formatTickets(b)}</div>
                                                        </div>
                                                    </label>
                                                </div>

                                                {/* Телефон и Статус (БЕЗ КОММЕНТАРИЕВ) */}
                                                <div className="flex items-center gap-3 sm:ml-auto ml-9">
                                                    <a href={`tel:${b.user_phone.replace(/\s/g, '')}`} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold font-mono text-slate-600 dark:text-slate-300 hover:text-teal-500 transition-colors">
                                                        {b.user_phone}
                                                    </a>
                                                    {b.status === 'pending' && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500 rounded">Не оплачено</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Кнопка "Скопировать список" */}
                                    <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                                        <button 
                                            onClick={() => handleCopyGroup(group)}
                                            className="w-full md:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <ClipboardCopy size={16} /> Скопировать для Telegram
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

    </div>
  );
}