import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link'; 
import { Plus, Search, MapPin, Send, Copy, Edit, Trash2, ExternalLink, EyeOff, LayoutGrid, Map as MapIcon } from 'lucide-react'; 
import Button from '@/shared/ui/Button';
import { StatusSwitch } from '../ui/StatusSwitch';
import { FilterTab } from '../ui/FilterTab';
import { ActionButton } from '../ui/ActionButton';
import { Tour } from '@/features/tours/types';

interface BookingSimple {
  event_id: string;
  status: string;
  tickets_adult: number;
  tickets_child: number;
}

// Расширенный интерфейс с пагинацией
interface ToursTabProps {
  tours: Tour[];
  total: number;
  page: number;
  limit?: number;
  loading?: boolean;
  searchTerm: string;
  filter: 'all' | 'upcoming' | 'past' | 'full';
  bookings: BookingSimple[];
  categories?: any[];
  
  onAdd: () => void;
  onEdit: (tour: Tour) => void;
  onDuplicate: (tour: Tour) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (tour: Tour) => void;
  onSendTg: (id: string, title: string) => void;
  onSearchChange: (val: string) => void;
  onFilterChange: (filter: 'all' | 'upcoming' | 'past' | 'full') => void;
  onPageChange: (page: number) => void;

  // Хендлеры для категорий
  onAddCategory?: () => void;
  onEditCategory?: (category: any) => void;
  onDeleteCategory?: (id: string, type: 'tour' | 'blog') => void;
  onToggleCategoryStatus?: (id: string, status: boolean, type: 'tour' | 'blog') => void;
}

type ViewType = 'tours' | 'categories';

// Компонент пагинации
const Pagination = ({ page, total, limit, onPageChange }: { page: number; total: number; limit: number; onPageChange: (p: number) => void }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    let start = Math.max(1, page - delta);
    let end = Math.min(totalPages, page + delta);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
      end = Math.min(totalPages, start + 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
      >
        ←
      </button>
      {getVisiblePages().map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded border ${p === page ? 'bg-teal-500 text-white border-teal-500' : 'border-slate-300'}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
      >
        →
      </button>
    </div>
  );
};

export default function ToursTab({ 
  tours,
  total,
  page,
  limit = 20,
  loading = false,
  searchTerm,
  filter,
  bookings,
  categories = [],
  onAdd,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  onSendTg,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryStatus
}: ToursTabProps) {
  
  const [activeView, setActiveView] = React.useState<ViewType>('tours');

  // Данные уже отфильтрованы на сервере, просто сортируем
  const filteredTours = useMemo(() => {
    return [...tours].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tours]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* HEADER: Заголовок и Кнопка */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <MapIcon size={28} className="text-teal-500" />
                    База туров
                </h1>
                <p className="text-sm text-slate-300 font-medium mt-1">
                    Управление расписанием и категориями
                </p>
            </div>
            <div className="hidden md:block">
                {activeView === 'tours' ? (
                  <Button variant="primary" onClick={onAdd} className="shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                      <Plus size={18} className="mr-2"/> Создать тур
                  </Button>
                ) : (
                  <Button variant="primary" onClick={onAddCategory} className="shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                      <Plus size={18} className="mr-2"/> Добавить категорию
                  </Button>
                )}
            </div>
        </div>

        {/* SUB-NAVIGATION: Туры / Категории */}
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
            <button 
                onClick={() => setActiveView('tours')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                    activeView === 'tours' 
                    ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' 
                    : 'text-slate-300 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
                <MapIcon size={16} /> Расписание ({tours.length})
            </button>
            <button 
                onClick={() => setActiveView('categories')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                    activeView === 'categories' 
                    ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' 
                    : 'text-slate-300 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
                <LayoutGrid size={16} /> Категории ({categories.length})
            </button>
        </div>

        {/* ========================================== */}
        {/* VIEW: РАСПИСАНИЕ ТУРОВ */}
        {/* ========================================== */}
        {activeView === 'tours' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-2 shadow-sm">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shrink-0">
                    {['all', 'upcoming', 'past', 'full'].map(f => (
                       <FilterTab 
                         key={f} 
                         label={f === 'all' ? 'Все' : f === 'upcoming' ? 'Актуальные' : f === 'past' ? 'Архив' : 'Заполненные'} 
                         active={filter === f} 
                         onClick={() => onFilterChange(f as any)} 
                       />
                    ))}
                </div>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                    <input 
                      placeholder="Поиск тура по названию..." 
                      className="w-full h-full pl-9 pr-4 bg-transparent text-sm font-medium outline-none text-slate-900 dark:text-white placeholder:text-slate-300" 
                      value={searchTerm} 
                      onChange={e => onSearchChange(e.target.value)} 
                    />
                </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-300 font-black uppercase text-[12px] tracking-widest border-b border-slate-200 dark:border-slate-800">
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
                                <tr key={tour.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 dark:border-slate-700 overflow-hidden relative shrink-0">
                                               {tour.image && <Image src={tour.image} alt={tour.title} fill className="object-cover"/>}
                                            </div>
                                            <div className="flex flex-col">
                                                <Link 
                                                    href={`/tour/${tour.slug}`} 
                                                    target="_blank"
                                                    className="font-bold text-slate-800 dark:text-white line-clamp-1 hover:text-teal-600 hover:underline flex items-center gap-1 group/link"
                                                >
                                                    {tour.title}
                                                    <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity text-slate-300"/>
                                                </Link>
                                                
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {!tour.isActive && (
                                                        <span className="text-[12px] font-bold text-slate-300 flex items-center gap-1">
                                                            <EyeOff size={10} /> Черновик
                                                        </span>
                                                    )}
                                                    <div className="text-[12px] font-bold text-teal-600 uppercase flex items-center gap-1">
                                                        <MapPin size={10}/> {tour.location}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 font-medium">
                                        <div className="text-slate-900 dark:text-slate-200">{new Date(tour.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-slate-300 font-bold">{tour.duration} дн.</div>
                                     </td>
                                    <td className="p-5">
                                        <div className="flex justify-between text-[12px] font-black mb-1.5">
                                            <span className={percent >= 100 ? 'text-rose-500' : 'text-slate-300 dark:text-slate-300'}>{booked} / {tour.spots}</span>
                                            <span className="text-slate-300 dark:text-slate-300">{Math.round(percent)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${percent}%` }} />
                                        </div>
                                     </td>
                                    <td className="p-5 font-black text-slate-900 dark:text-white">{tour.price} <span className="text-xs text-slate-300 font-bold">{tour.currency}</span></td>
                                    <td className="p-5 text-center">
                                        <StatusSwitch active={tour.isActive || false} onClick={() => onToggleStatus(tour)} labelOn="Опубликован" labelOff="Черновик" />
                                    </td>
                                    <td className="p-5 text-right flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ActionButton icon={<Send size={16}/>} onClick={() => onSendTg(String(tour.id), tour.title)} title="Отправить в Telegram" color="text-sky-500"/>
                                        <ActionButton icon={<Copy size={16}/>} onClick={() => onDuplicate(tour)} title="Дублировать"/>
                                        <ActionButton icon={<Edit size={16}/>} onClick={() => onEdit(tour)} title="Редактировать"/>
                                        <ActionButton icon={<Trash2 size={16}/>} onClick={() => onDelete(String(tour.id))} title="Удалить" color="text-red-500"/>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredTours.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-slate-300 font-medium">Туров не найдено</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden space-y-4">
                 {filteredTours.map(tour => (
                     <div key={tour.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                         <div className="flex gap-4 mb-3">
                             <div className="w-20 h-20 bg-slate-100 rounded-xl shrink-0 overflow-hidden relative">
                                 {tour.image && <Image src={tour.image} alt="Tour" fill className="object-cover" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-1">
                                     <Link 
                                        href={`/tour/${tour.slug}`}
                                        target="_blank"
                                        className="font-bold text-slate-900 dark:text-white truncate pr-2 hover:text-teal-600 hover:underline flex items-center gap-1"
                                     >
                                         {tour.title}
                                         <ExternalLink size={10} className="text-slate-300 shrink-0"/>
                                     </Link>
                                     <StatusSwitch active={tour.isActive || false} onClick={() => onToggleStatus(tour)} />
                                 </div>
                                 <p className="text-xs text-slate-300 font-medium mb-2">{new Date(tour.date).toLocaleDateString()} • {tour.duration} дн.</p>
                                 <div className="font-black text-teal-600">{tour.price} <span className="text-xs font-bold opacity-70">{tour.currency}</span></div>
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-2 mt-2">
                             <button onClick={() => onEdit(tour)} className="py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                 <Edit size={14}/> Ред.
                             </button>
                             <button onClick={() => onDuplicate(tour)} className="py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                 <Copy size={14}/> Копия
                             </button>
                             <button onClick={() => onDelete(String(tour.id))} className="py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                 <Trash2 size={14}/>
                             </button>
                         </div>
                     </div>
                 ))}
                 {/* Кнопка добавления для мобилки */}
                 <button onClick={onAdd} className="w-full py-4 bg-teal-500/10 border border-teal-500/20 text-teal-500 font-bold rounded-2xl flex items-center justify-center gap-2">
                     <Plus size={18} /> Создать тур
                 </button>
            </div>

            {/* Индикатор загрузки и пагинация */}
            {loading && (
              <div className="p-10 text-center text-slate-500">Загрузка туров...</div>
            )}
            {!loading && (
              <Pagination page={page} total={total} limit={limit} onPageChange={onPageChange} />
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW: КАТЕГОРИИ ТУРОВ (без изменений) */}
        {/* ========================================== */}
        {activeView === 'categories' && (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-300 font-black uppercase text-[12px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="p-5 w-16">Иконка</th>
                            <th className="p-5">Название</th>
                            <th className="p-5">Slug (URL)</th>
                            <th className="p-5 text-center">Сортировка</th>
                            <th className="p-5 text-center">Статус</th>
                            <th className="p-5 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {categories.map((cat) => (
                            <tr key={cat.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-5">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-300">
                                        <LayoutGrid size={20} />
                                    </div>
                                </td>
                                <td className="p-5 font-bold text-slate-900 dark:text-white">
                                    {cat.title}
                                </td>
                                <td className="p-5">
                                    <span className="font-mono text-xs text-slate-300 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                        {cat.slug}
                                    </span>
                                </td>
                                <td className="p-5 text-center font-bold text-slate-300">
                                    {cat.sortOrder}
                                </td>
                                <td className="p-5 text-center">
                                    {onToggleCategoryStatus && (
                                        <StatusSwitch 
                                            active={cat.isActive} 
                                            onClick={() => onToggleCategoryStatus(cat.id, cat.isActive, 'tour')} 
                                            labelOn="Вкл" 
                                            labelOff="Скрыта" 
                                        />
                                    )}
                                </td>
                                <td className="p-5 text-right flex justify-end gap-1">
                                    {onEditCategory && (
                                        <ActionButton icon={<Edit size={16}/>} onClick={() => onEditCategory(cat)} title="Редактировать"/>
                                    )}
                                    {onDeleteCategory && (
                                        <ActionButton icon={<Trash2 size={16}/>} onClick={() => onDeleteCategory(cat.id, 'tour')} title="Удалить" color="text-red-500"/>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-slate-300 font-medium">Категории не найдены</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden">
                 <button onClick={onAddCategory} className="w-full py-4 bg-teal-500/10 border border-teal-500/20 text-teal-500 font-bold rounded-2xl flex items-center justify-center gap-2">
                     <Plus size={18} /> Добавить категорию
                 </button>
            </div>
          </div>
        )}
    </div>
  );
}