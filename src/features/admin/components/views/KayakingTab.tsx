'use client';

import { useState, useEffect } from 'react';
import { getKayakingTourDates } from '@/features/admin/actions/kayaking'; 
import KayakingDateEditor from './KayakingDateEditor';

export default function KayakingTab() {
  const [tourDates, setTourDates] = useState<any[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDates() {
    const res = await getKayakingTourDates();
    if (res.success && res.data) {
      setTourDates(res.data.tourDates);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDates();
  }, []);

  if (loading) return <div className="p-8 text-center">Загрузка дат...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Управление рассадкой (байдарки)</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tourDates.map((td) => (
          <div
            key={td.id}
            onClick={() => setSelectedDateId(td.id)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedDateId === td.id
                ? 'bg-teal-500/10 border-teal-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="font-bold">{td.tour.title}</div>
            <div className="text-sm text-slate-500">
              {new Date(td.startDate).toLocaleDateString('ru-RU')}
            </div>
            <div className="text-xs mt-2">Броней: {td._count?.bookings || 0}</div>
          </div>
        ))}
      </div>
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