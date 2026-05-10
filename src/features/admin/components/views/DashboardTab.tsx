import React, { useMemo } from 'react';
import { 
  AlertCircle, ChevronRight, Map, Activity, 
  Archive, FileText, Calendar, Users, 
  Wallet, Clock, CheckCircle, Search
} from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { Tour } from '@/features/tours/types';
import { DashboardDeparture, BookingItem } from '../AdminDashboard'; 

interface DashboardStats {
  newBookings: number;
  totalTours: number;
  activeTours: number;
  finishedTours: number;
  totalPosts: number;
  totalGuides: number;
  toursThisMonth: DashboardDeparture[]; //   Используем новый тип
  allBookings: BookingItem[]; //   Строгий тип для броней
}

interface DashboardTabProps {
  stats: DashboardStats;
  onNavigateToBookings: () => void;
  onEditTour: (tour: Tour) => void;
}

export default function DashboardTab({ stats, onNavigateToBookings, onEditTour }: DashboardTabProps) {
  
  // 🧠 ВЫЧИСЛЕНИЯ ДЛЯ ВОРОНКИ И ФИНАНСОВ
  const analytics = useMemo(() => {
    let moderation = 0;
    let pending = 0;
    let awaiting = 0;
    let totalRevenue = 0;

    stats.allBookings.forEach(b => {
      if (b.status === 'moderation') moderation++;
      if (b.status === 'pending') pending++;
      if (b.status === 'awaiting_payment') awaiting++;
      if (b.status === 'confirmed') totalRevenue += (Number(b.total_price) || 0);
    });

    return { moderation, pending, awaiting, totalRevenue };
  }, [stats.allBookings]);

  // 🧠 ВЫЧИСЛЕНИЯ ДЛЯ СВЕТОФОРА (Заполняемость)
 const getTourOccupancy = (tourDateId: string, totalSpots: number) => {
 const tourBookings = stats.allBookings.filter(b => b.tourDateId === tourDateId);
    let green = 0; // Едут (confirmed + pending)
    let yellow = 0; // Думают (awaiting_payment + moderation)
    
    tourBookings.forEach(b => {
      const tickets = (b.tickets_adult || 0) + (b.tickets_child || 0) + (b.tickets_member || 0) + ((b.tickets_family || 0) * 3);
      if (b.status === 'confirmed' || b.status === 'pending') green += tickets;
      if (b.status === 'awaiting_payment' || b.status === 'moderation') yellow += tickets;
    });

    return { green, yellow, free: Math.max(0, totalSpots - green - yellow) };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. ВОРОНКА ЗАЯВОК И АЛЕРТЫ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 cursor-pointer" onClick={onNavigateToBookings}>
        {/* Срочные чеки */}
        <div className={`rounded-2xl p-4 flex flex-col justify-between shadow-sm border transition-transform hover:scale-[1.02] ${analytics.moderation > 0 ? 'bg-orange-500 border-orange-600 text-white shadow-orange-500/20' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <Search size={20} className={analytics.moderation > 0 ? 'animate-pulse' : ''}/>
            <ChevronRight size={18} className="opacity-50" />
          </div>
          <div>
            <div className="text-2xl font-black">{analytics.moderation}</div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">Проверка чеков</div>
          </div>
        </div>

        {/* Наличные (Новые) */}
        <div className={`rounded-2xl p-4 flex flex-col justify-between shadow-sm border transition-transform hover:scale-[1.02] ${analytics.pending > 0 ? 'bg-sky-500 border-sky-600 text-white shadow-sky-500/20' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <Users size={20} />
            <ChevronRight size={18} className="opacity-50" />
          </div>
          <div>
            <div className="text-2xl font-black">{analytics.pending}</div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">Оплата наличными</div>
          </div>
        </div>

        {/* Ждут оплаты (Онлайн) */}
        <div className={`rounded-2xl p-4 flex flex-col justify-between shadow-sm border transition-transform hover:scale-[1.02] ${analytics.awaiting > 0 ? 'bg-amber-400 border-amber-500 text-amber-900 shadow-amber-400/20' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <Clock size={20} />
            <ChevronRight size={18} className="opacity-50" />
          </div>
          <div>
            <div className="text-2xl font-black">{analytics.awaiting}</div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">Ждут оплаты (Онлайн)</div>
          </div>
        </div>
      </div>

      {/* 2. ОПЕРАЦИОННАЯ СВОДКА И ФИНАНСЫ */}
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mt-6">
        Общая сводка
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Новая карточка Финансов */}
        <DashboardCard 
          label="Выручка (Оплачено)" 
          value={`${analytics.totalRevenue.toLocaleString('ru-RU')} RUB`} 
          icon={<Wallet size={18}/>} 
          color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <DashboardCard 
          label="В продаже" 
          value={stats.activeTours} 
          icon={<Activity size={18}/>} 
          color="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
        />
        <DashboardCard 
          label="Архив" 
          value={stats.finishedTours} 
          icon={<Archive size={18}/>} 
          color="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-800"
        />
        <DashboardCard 
          label="Контент" 
          value={`${stats.totalPosts} / ${stats.totalGuides}`} 
          sub="Посты / Гиды" 
          icon={<FileText size={18}/>} 
          color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

     {/* 3. БЛИЖАЙШИЕ СТАРТЫ (На 30 дней) */}
      <div className="pt-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
          <Calendar className="text-teal-500"/> Старты на ближайший месяц
        </h3>
        
        {stats.toursThisMonth.length > 0 ? (
          <div className="space-y-4">
            {stats.toursThisMonth.map(departure => {
              //   Передаем ID даты и ее места в светофор
              const { green, yellow, free } = getTourOccupancy(String(departure.id), departure.spots);
              const isBurning = new Date(departure.date).getTime() - new Date().getTime() < 48 * 60 * 60 * 1000; // Менее 48 часов

              return (
                <div 
                  key={departure.id} //   Ключ теперь уникален (ID даты)
                  onClick={() => onEditTour(departure.originalTour)} //   При клике отдаем оригинальный тур
                  className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${isBurning ? 'border-rose-300 dark:border-rose-900/50' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${isBurning ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700'}`}>
                      <span className="text-[12px] font-black uppercase tracking-widest mb-0.5">
                        {new Date(departure.date).toLocaleString('ru', {month:'short'})}
                      </span>
                      <span className="text-xl font-black leading-none text-slate-900 dark:text-white">
                        {new Date(departure.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        {departure.title}
                        {isBurning && <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] rounded uppercase tracking-widest">Скоро</span>}
                      </h4>
                      <p className="text-xs text-slate-800 flex items-center gap-1 mt-1">
                        <Users size={12}/> 
                        {departure.guide?.name || "Без гида"}
                      </p>
                    </div>
                  </div>

                  {/* СВЕТОФОР (Traffic Light) */}
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest shrink-0 overflow-x-auto pb-1 md:pb-0">
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      <CheckCircle size={14}/> {green} Едут
                    </div>
                    
                    {yellow > 0 && (
                      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <Clock size={14}/> {yellow} Думают
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      Из {departure.spots} мест
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-800 text-sm font-medium">
            На ближайшие 30 дней стартов не запланировано 🌴
          </div>
        )}
      </div>
    </div>
  );
}