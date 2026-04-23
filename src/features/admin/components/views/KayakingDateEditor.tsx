'use client';

import { useState, useEffect } from 'react';
import { getBoatAssignments, updateTourDateBoats, sendKayakingManifest } from '@/features/admin/actions/kayaking';
import BoatAssignmentModal from './BoatAssignmentModal';
import { useToast } from '@/shared/context/ToastContext';

interface Props {
  tourDateId: string;
  onRefresh: () => void;
}

export default function KayakingDateEditor({ tourDateId, onRefresh }: Props) {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [boatsK2, setBoatsK2] = useState(0);
  const [boatsK3, setBoatsK3] = useState(0);
  const [guidesCount, setGuidesCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const res = await getBoatAssignments(tourDateId);
    if (res.success && res.data) {
      setBoatsK2(Number(res.data.boatsK2Count) || 0);
      setBoatsK3(Number(res.data.boatsK3Count) || 0);
      setGuidesCount(res.data.guidesCount || 1);
      setBookings(res.data.groups || []);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [tourDateId]);

  async function saveSettings() {
    const res = await updateTourDateBoats(tourDateId, boatsK2, boatsK3, guidesCount);
    if (res.success) {
      showToast('Настройки сохранены', 'success');
      onRefresh(); loadData();
    } else {
      showToast(res.error || 'Ошибка сохранения', 'error');
    }
  }

  async function sendManifest() {
    showToast('Отправка манифеста...', 'info');
    const res = await sendKayakingManifest(tourDateId);
    if (res.success) showToast('Манифест в Telegram!', 'success');
    else showToast(res.error || 'Ошибка отправки', 'error');
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Загрузка данных...</div>;

  return (
    <div className="mt-8 p-4 sm:p-8 border rounded-[2.5rem] bg-white dark:bg-slate-950 shadow-2xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-black uppercase italic tracking-tighter">Настройка параметров</h3>
        <button onClick={sendManifest} className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20">
          🚀 Отправить манифест
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Лодок K2</label>
          <input type="number" value={boatsK2} onChange={e => setBoatsK2(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 font-black text-lg focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Лодок K3</label>
          <input type="number" value={boatsK3} onChange={e => setBoatsK3(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 font-black text-lg focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Гиды</label>
          <select value={guidesCount} onChange={e => setGuidesCount(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-4 font-black">
            <option value={1}>1 Гид на маршруте</option>
            <option value={2}>2 Гида на маршруте</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="p-4 text-left">Участник</th>
              <th className="p-4 text-center">Взр</th>
              <th className="p-4 text-center">Дет</th>
              <th className="p-4 text-center">Клуб</th>
              <th className="p-4 text-center">Сем</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.bookingId} className="border-t border-white/5">
                <td className="p-4 font-bold">{b.memberName || b.name}</td>
                <td className="p-4 text-center">{b.adultsCount}</td>
                <td className="p-4 text-center">{b.childCount}</td>
                <td className="p-4 text-center">{b.memberCount}</td>
                <td className="p-4 text-center">{b.familyCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button onClick={saveSettings} className="flex-1 px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">
          Сохранить флот
        </button>
        <button onClick={() => setShowModal(true)} className="flex-1 px-8 py-5 bg-teal-500 text-slate-950 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20">
          Перейти к рассадке
        </button>
      </div>

      {showModal && <BoatAssignmentModal tourDateId={tourDateId} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); loadData(); }} />}
    </div>
  );
}