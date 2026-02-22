import React, { useState, useMemo } from 'react';
import { Search, Check, X as XIcon, Phone } from 'lucide-react';
import { BookingStatus } from '@prisma/client';

// Тип брони (дублируем из Dashboard, можно вынести в types.ts позже)
interface BookingItem {
  id: string;
  user_name: string;
  user_phone: string;
  status: BookingStatus;
  created_at: Date | string;
  tickets_adult: number;
  tickets_child: number;
  event_id: string;
  tour?: { title: string; date: Date | string };
}

interface BookingsTabProps {
  bookings: BookingItem[];
  onStatusChange: (id: string, status: string) => void;
}

export default function BookingsTab({ bookings, onStatusChange }: BookingsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Локальная фильтрация
  const filteredBookings = useMemo(() => {
    let data = bookings;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(b => 
        b.user_name.toLowerCase().includes(lower) || 
        b.user_phone.includes(lower) ||
        (b.tour?.title || '').toLowerCase().includes(lower)
      );
    }
    // Сортировка: новые сверху
    return data.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bookings, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase tracking-tight dark:text-white">Брони</h1>
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-2">
          <Search className="text-slate-400 ml-2" size={18}/>
          <input 
            placeholder="Имя, телефон..." 
            className="bg-transparent text-sm outline-none dark:text-white w-24 md:w-48" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <tr>
              <th className="p-4">Клиент</th>
              <th className="p-4">Тур</th>
              <th className="p-4">Билеты</th>
              <th className="p-4">Статус</th>
              <th className="p-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBookings.map(b => (
              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="font-bold dark:text-white">{b.user_name}</div>
                  <a href={`tel:${b.user_phone}`} className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1">
                    {b.user_phone}
                  </a>
                </td>
                <td className="p-4">
                  <div className="text-xs font-bold">{b.tour?.title || 'Нет тура'}</div>
                  <div className="text-[10px] text-slate-400">
                    {b.tour ? new Date(b.tour.date).toLocaleDateString() : '-'}
                  </div>
                </td>
                <td className="p-4 font-bold">{(b.tickets_adult||0) + (b.tickets_child||0)}</td>
                <td className="p-4">
                  <select 
                    value={b.status} 
                    onChange={(e) => onStatusChange(b.id, e.target.value)} 
                    className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="pending">Новая</option>
                    <option value="confirmed">Оплачено</option>
                    <option value="cancelled">Отмена</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => onStatusChange(b.id, 'confirmed')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Check size={16}/></button>
                  <button onClick={() => onStatusChange(b.id, 'cancelled')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><XIcon size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredBookings.map(b => (
          <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${b.status === 'confirmed' ? 'bg-emerald-500' : b.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'}`}/>
            
            <div className="pl-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">{b.user_name}</h3>
                  <a href={`tel:${b.user_phone}`} className="text-xs font-bold text-teal-600 flex items-center gap-1">
                    <Phone size={10}/> {b.user_phone}
                  </a>
                </div>
                <div className="text-right">
                  <span className="block font-black text-xl">{(b.tickets_adult||0) + (b.tickets_child||0)}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Билетов</span>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mb-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{b.tour?.title}</p>
                <p className="text-[10px] text-slate-400">{b.tour ? new Date(b.tour.date).toLocaleDateString() : 'Дата неизвестна'}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => onStatusChange(b.id, 'confirmed')} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase">Подтвердить</button>
                <button onClick={() => onStatusChange(b.id, 'cancelled')} className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold uppercase">Отмена</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}