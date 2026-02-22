import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // ✅ Добавлено
import { Plus, Search, MapPin, Send, Copy, Edit, Trash2, ExternalLink, EyeOff } from 'lucide-react'; // ✅ Добавлены иконки
import Button from '@/shared/ui/Button';
import { StatusSwitch } from '../ui/StatusSwitch';
import { FilterTab } from '../ui/FilterTab';
import { ActionButton } from '../ui/ActionButton';
import { Tour } from '@/features/tours/types';

// Минимальный интерфейс брони для подсчета мест
interface BookingSimple {
  event_id: string;
  status: string;
  tickets_adult: number;
  tickets_child: number;
}

interface ToursTabProps {
  tours: Tour[];
  bookings: BookingSimple[];
  onAdd: () => void;
  onEdit: (tour: Tour) => void;
  onDuplicate: (tour: Tour) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (tour: Tour) => void;
  onSendTg: (id: string, title: string) => void;
}

type FilterType = 'all' | 'upcoming' | 'past' | 'full';

export default function ToursTab({ 
  tours, 
  bookings, 
  onAdd, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggleStatus, 
  onSendTg 
}: ToursTabProps) {
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Локальная логика фильтрации
  const filteredTours = useMemo(() => {
    let data = tours;
    const now = new Date();

    if (searchTerm) {
        data = data.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filter === 'upcoming') {
        data = data.filter(t => new Date(t.date) >= now);
    } else if (filter === 'past') {
        data = data.filter(t => new Date(t.date) < now);
    } else if (filter === 'full') {
        data = data.filter(t => {
            const booked = bookings.filter(b => b.event_id === String(t.id) && b.status !== 'cancelled')
                                   .reduce((acc, b) => acc + (b.tickets_adult || 0) + (b.tickets_child || 0), 0);
            return booked >= (t.spots || 0);
        });
    }
    
    // Сортировка по дате
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tours, bookings, filter, searchTerm]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">🗺️ Туры</h1>
                <p className="text-sm text-slate-400">Всего: <span className="font-bold">{tours.length}</span></p>
            </div>
            <div className="hidden md:block">
                <Button variant="primary" onClick={onAdd}>
                    <Plus size={18} className="mr-2"/> Создать тур
                </Button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-2 shadow-sm">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shrink-0">
                {['all', 'upcoming', 'past', 'full'].map(f => (
                   <FilterTab 
                     key={f} 
                     label={f === 'all' ? 'Все' : f === 'upcoming' ? 'Актуальные' : f === 'past' ? 'Архив' : 'Заполненные'} 
                     active={filter === f} 
                     onClick={() => setFilter(f as FilterType)} 
                   />
                ))}
            </div>
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input 
                  placeholder="Поиск..." 
                  className="w-full h-full pl-9 pr-4 bg-transparent text-sm outline-none dark:text-white placeholder:text-slate-400" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
            </div>
        </div>

        {/* 2.1 DESKTOP TABLE */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <tr>
                        <th className="p-5">Тур</th>
                        <th className="p-5">Даты</th>
                        <th className="p-5 w-1/5">Наполняемость</th>
                        <th className="p-5">Цена</th>
                        <th className="p-5 text-center">Статус</th>
                        <th className="p-5 text-right">Действия</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTours.map(tour => {
                        const booked = bookings.filter(b => b.event_id === String(tour.id) && b.status !== 'cancelled')
                                               .reduce((acc, b) => acc + (b.tickets_adult || 0) + (b.tickets_child || 0), 0);
                        const percent = Math.min((booked / (Number(tour.spots) || 1)) * 100, 100);
                        
                        return (
                            <tr key={tour.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                                           {tour.image && <Image src={tour.image} alt={tour.title} fill className="object-cover"/>}
                                        </div>
                                        <div className="flex flex-col">
                                            {/* ✅ ССЫЛКА НА САЙТ */}
                                            <Link 
                                                href={`/tour/${tour.slug}`} 
                                                target="_blank"
                                                className="font-bold text-slate-800 dark:text-white line-clamp-1 hover:text-teal-600 hover:underline flex items-center gap-1 group/link"
                                            >
                                                {tour.title}
                                                <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity text-slate-400"/>
                                            </Link>
                                            
                                            {/* ✅ ИНДИКАТОР ЧЕРНОВИКА И ЛОКАЦИЯ */}
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                {!tour.isActive && (
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <EyeOff size={10} /> Черновик
                                                    </span>
                                                )}
                                                <div className="text-[10px] font-bold text-teal-600 uppercase flex items-center gap-1">
                                                    <MapPin size={10}/> {tour.location}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 font-medium">
                                    <div>{new Date(tour.date).toLocaleDateString()}</div>
                                    <div className="text-xs text-slate-400">{tour.duration} дн.</div>
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-between text-[10px] font-black mb-1.5">
                                        <span className={percent >= 100 ? 'text-rose-500' : 'text-slate-400'}>{booked} / {tour.spots}</span>
                                        <span className="text-slate-400">{Math.round(percent)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${percent}%` }} />
                                    </div>
                                </td>
                                <td className="p-5 font-bold">{tour.price} <span className="text-xs text-slate-400">{tour.currency}</span></td>
                                <td className="p-5 text-center">
                                    <StatusSwitch active={tour.isActive || false} onClick={() => onToggleStatus(tour)} labelOn="Опубликован" labelOff="Черновик" />
                                </td>
                                <td className="p-5 text-right flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ActionButton icon={<Send size={16}/>} onClick={() => onSendTg(String(tour.id), tour.title)} title="TG" color="text-sky-500"/>
                                    <ActionButton icon={<Copy size={16}/>} onClick={() => onDuplicate(tour)} title="Копия"/>
                                    {/* Кнопка редактирования открывает модалку */}
                                    <ActionButton icon={<Edit size={16}/>} onClick={() => onEdit(tour)} title="Ред"/>
                                    <ActionButton icon={<Trash2 size={16}/>} onClick={() => onDelete(String(tour.id))} title="Удалить" color="text-red-500"/>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* 2.2 MOBILE CARDS */}
        <div className="md:hidden space-y-4">
             {filteredTours.map(tour => (
                 <div key={tour.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                     <div className="flex gap-4 mb-3">
                         <div className="w-20 h-20 bg-slate-100 rounded-xl shrink-0 overflow-hidden relative">
                             {tour.image && <Image src={tour.image} alt="Tour" fill className="object-cover" />}
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-1">
                                 {/* ✅ Ссылка на сайт в мобильной версии */}
                                 <Link 
                                    href={`/tour/${tour.slug}`}
                                    target="_blank"
                                    className="font-bold text-slate-900 dark:text-white truncate pr-2 hover:text-teal-600 hover:underline flex items-center gap-1"
                                 >
                                     {tour.title}
                                     <ExternalLink size={10} className="text-slate-400 shrink-0"/>
                                 </Link>
                                 <StatusSwitch active={tour.isActive || false} onClick={() => onToggleStatus(tour)} />
                             </div>
                             <p className="text-xs text-slate-400 mb-2">{new Date(tour.date).toLocaleDateString()} • {tour.duration} дн.</p>
                             <div className="font-black text-teal-600">{tour.price} {tour.currency}</div>
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-2 mt-2">
                         <button onClick={() => onEdit(tour)} className="py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                             <Edit size={14}/> Ред.
                         </button>
                         <button onClick={() => onDuplicate(tour)} className="py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                             <Copy size={14}/> Копия
                         </button>
                         <button onClick={() => onDelete(String(tour.id))} className="py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                             <Trash2 size={14}/>
                         </button>
                     </div>
                 </div>
             ))}
        </div>
    </div>
  );
}