import React from 'react';
import { 
  AlertCircle, ChevronRight, Map, Activity, 
  Archive, FileText, Calendar, Users 
} from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { Tour } from '@/features/tours/types';

interface DashboardStats {
  newBookings: number;
  totalTours: number;
  activeTours: number;
  finishedTours: number;
  totalPosts: number;
  totalGuides: number;
  toursThisWeek: Tour[];
}

interface DashboardTabProps {
  stats: DashboardStats;
  onNavigateToBookings: () => void;
  onEditTour: (tour: Tour) => void;
}

export default function DashboardTab({ stats, onNavigateToBookings, onEditTour }: DashboardTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1.1 ALERT: НОВЫЕ ЗАЯВКИ */}
      {stats.newBookings > 0 && (
        <div 
          onClick={onNavigateToBookings} 
          className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full animate-pulse">
              <AlertCircle size={24}/>
            </div>
            <div>
              <h3 className="font-bold text-lg">Есть новые заявки!</h3>
              <p className="text-xs text-white/90">Ожидают обработки: {stats.newBookings}</p>
            </div>
          </div>
          <ChevronRight/>
        </div>
      )}

      {/* 1.2 СЕТКА СКЛАДА (Статистика) */}
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mt-2">
        Операционная сводка
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashboardCard 
          label="Всего Туров" 
          value={stats.totalTours} 
          icon={<Map size={18}/>} 
          color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
          color="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        />
        <DashboardCard 
          label="Контент" 
          value={`${stats.totalPosts} / ${stats.totalGuides}`} 
          sub="Посты / Гиды" 
          icon={<FileText size={18}/>} 
          color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

      {/* 1.3 НА ЭТОЙ НЕДЕЛЕ (Список) */}
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
          <Calendar className="text-teal-500"/> Ближайшие старты
        </h3>
        
        {stats.toursThisWeek.length > 0 ? (
          <div className="space-y-3">
            {stats.toursThisWeek.map(tour => {
              const percent = Math.min(((tour.spots - tour.spotsLeft) / tour.spots) * 100, 100);
              return (
                <div 
                  key={tour.id} 
                  onClick={() => onEditTour(tour)} 
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer active:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {new Date(tour.date).toLocaleString('ru', {month:'long'})}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                      {new Date(tour.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">
                      {tour.title}
                    </h4>
                   <p className="text-xs text-slate-500 flex items-center gap-1">
  <Users size={12}/> 
  {/* Проверяем: это объект? не null? есть имя? */}
  {(typeof tour.guide === 'object' && tour.guide?.name) 
    ? tour.guide.name 
    : "Без гида"
  }
</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${percent > 80 ? 'text-rose-500' : 'text-teal-600'}`}>
                      {tour.spots - tour.spotsLeft}/{tour.spots}
                    </div>
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${percent > 80 ? 'bg-rose-500' : 'bg-teal-500'}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-5 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            На ближайшие 7 дней стартов нет 🌴
          </div>
        )}
      </div>
    </div>
  );
}