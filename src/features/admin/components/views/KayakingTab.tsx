'use client';

import { useState, useEffect } from 'react';
import { getKayakingTourDates } from '@/features/admin/actions/kayaking'; 
import KayakingDateEditor from './KayakingDateEditor';
import { Map, Calendar } from 'lucide-react';

export default function KayakingTab() {
  const [tourDates, setTourDates] = useState<any[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDates() {
    setLoading(true);
    const res = await getKayakingTourDates();
    if (res.success && res.data) {
      setTourDates(res.data.tourDates);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDates();
  }, []);

  if (loading) return (
    <div className="p-12 text-center text-slate-700 animate-pulse font-bold tracking-widest mt-8 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
      ПОИСК ДОСТУПНЫХ СПЛАВОВ...
    </div>
  );

 return (
    <div className="space-y-8 w-full min-w-0">
      <div className="flex items-center gap-3">
        <Map className="text-teal-500" size={28} />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
          Управление флотом
        </h2>
      </div>

      {/* Обработка пустого состояния (решает проблему белого экрана) */}
      {tourDates.length === 0 && !loading && (
        <div className="p-12 text-center border-2 border-dashed rounded-[2.5rem] border-slate-200 bg-slate-50">
          <p className="text-slate-700 font-bold">Нет предстоящих туров на байдарках.</p>
          <p className="text-xs text-slate-700 mt-2">
            Убедитесь, что туры активны, даты в будущем, а категория тура имеет системное имя (slug): <b className="text-slate-600">kayaking</b>
          </p>
        </div>
      )}

      {/* Список дат туров */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tourDates.map((td) => (
          <div
            key={td.id}
            onClick={() => setSelectedDateId(td.id)}
            className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all active:scale-[0.98] ${
              selectedDateId === td.id
                ? 'bg-teal-50 border-teal-500 shadow-md shadow-teal-500/10'
                : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-sm'
            }`}
          >
            <div className="font-bold text-slate-900 text-sm mb-1 leading-tight">{td.tour.title}</div>
            
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium mt-2">
              <Calendar size={14} className="text-teal-500" />
              {new Date(td.startDate).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}
            </div>
            
            <div className="mt-4 inline-flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl text-xs  font-black uppercase tracking-widest text-slate-700">
              Броней: <span className="text-teal-600 ml-1">{td._count?.bookings || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Сам редактор флота, который мы только что написали */}
      {selectedDateId && (
        <KayakingDateEditor
          key={selectedDateId}
          tourDateId={selectedDateId}
          onRefresh={loadDates}
        />
      )}
    </div>
  );
}