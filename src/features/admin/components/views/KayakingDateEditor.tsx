'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor, 
  DragOverlay, DragStartEvent, DragEndEvent, useDroppable 
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { 
  getBoatAssignments, 
  updateTourDateBoats, 
  saveBoatAssignments, 
  toggleBookingFlag,
  sendKayakingManifest 
} from '@/features/admin/actions/kayaking';
import { Boat, BoatPassenger, Assignment, BookingGroup } from '@/features/kayaking/types';
import { calculateRecommendedFleet } from '@/features/kayaking/kayakLogic';
import { useToast } from '@/shared/context/ToastContext';
import { AlertTriangle, Baby, Dog, Users, Anchor, Map } from 'lucide-react';
import SortableBoat from './SortableBoat';
import DraggablePassenger from './DraggablePassenger';

// ==========================================
// ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ: ЗОНА "БЕРЕГ"
// ==========================================
function UnassignedDropArea({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'unassigned-area' });
  return (
    <div 
      ref={setNodeRef} 
      className={`mt-8 p-6 border-2 border-dashed rounded-[2.5rem] min-h-[180px] transition-all shadow-inner w-full ${
        isOver ? 'border-teal-500 bg-teal-50 scale-[1.01]' : 'border-amber-200 bg-amber-50/50'
      }`}
    >
      <h4 className="text-xs  font-black uppercase tracking-widest text-amber-700 mb-6 flex items-center justify-center gap-2">
        <Map size={14} /> Берег (Нераспределенные пассажиры)
      </h4>
      <div className="flex flex-wrap gap-3 justify-center">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// ОСНОВНОЙ КОМПОНЕНТ РЕДАКТОРА
// ==========================================
export default function KayakingDateEditor({ tourDateId, onRefresh }: { tourDateId: string, onRefresh: () => void }) {
  const { showToast } = useToast();
  
  // Стейты
  const [boats, setBoats] = useState<Boat[]>([]);
  const [unassigned, setUnassigned] = useState<BoatPassenger[]>([]);
  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [boatsK2, setBoatsK2] = useState(0);
  const [boatsK3, setBoatsK3] = useState(0);
  const [guidesCount, setGuidesCount] = useState(1);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePassenger, setActivePassenger] = useState<BoatPassenger | null>(null);

  // Настройка сенсоров для мыши и тач-экранов
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Автоматический подсчет статистики по таблице (Footer)
  const stats = useMemo(() => {
    return groups.reduce((acc, g) => ({
      adults: acc.adults + g.adultsCount,
      children: acc.children + g.childCount,
      members: acc.members + g.memberCount,
      families: acc.families + g.familyCount,
      totalPax: acc.totalPax + g.paidSeats
    }), { adults: 0, children: 0, members: 0, families: 0, totalPax: 0 });
  }, [groups]);

  // Загрузка данных с бэкенда
  async function loadData() {
    setLoading(true);
    const res = await getBoatAssignments(tourDateId);
    
    if (res.success && res.data) {
      const { assignments, unassigned: serverUnassigned, groups: serverGroups, boatsK2Count, boatsK3Count, guidesCount: serverGuides, warnings: serverWarnings } = res.data;
      
      setGroups(serverGroups || []);
      setWarnings(serverWarnings || []);
      
      // АВТОРАСЧЕТ: Если в базе 0 лодок, предлагаем свои идеальные цифры
      const currentTotalPax = serverGroups.reduce((sum: number, g: BookingGroup) => sum + g.paidSeats, 0);
      if (!boatsK2Count && !boatsK3Count) {
        const recommended = calculateRecommendedFleet(currentTotalPax);
        setBoatsK2(recommended.k2);
        setBoatsK3(recommended.k3);
      } else {
        setBoatsK2(boatsK2Count);
        setBoatsK3(boatsK3Count);
      }
      setGuidesCount(serverGuides || 1);

      // Инициализация лодок для DnD
      const newBoats: Boat[] = [];
      for(let i=1; i<=(boatsK2Count || calculateRecommendedFleet(currentTotalPax).k2); i++) {
        newBoats.push({ id: `K2-${i}`, type: 'K2', index: i, assignedPassengers: [], paidCapacity: 2, bonusCapacity: 1, guideAssigned: false });
      }
      for(let i=1; i<=(boatsK3Count || calculateRecommendedFleet(currentTotalPax).k3); i++) {
        newBoats.push({ id: `K3-${i}`, type: 'K3', index: i, assignedPassengers: [], paidCapacity: 3, bonusCapacity: 1, guideAssigned: false });
      }

      // Распределение пассажиров по лодкам
      assignments.forEach((a: any) => {
        const boat = newBoats.find(b => b.id === `${a.boatType}-${a.boatIndex}`);
        if (boat) {
          const group = serverGroups.find((g: BookingGroup) => g.bookingId === a.bookingId);
          boat.assignedPassengers.push({ 
            bookingId: a.bookingId, 
            passengerId: a.passengerId,
            shortId: group?.shortId || 0,
            name: a.passengerName, 
            isChild: false, 
            isChildUnder7: group?.hasChildUnder7 || false,
            hasDog: group?.hasDog || false
          });
        }
      });

      let finalUnassigned = [...(serverUnassigned || [])];

      // ВОССТАНАВЛИВАЕМ ГИДОВ ПРИ КАЖДОЙ ЗАГРУЗКЕ
      for (let i = 1; i <= (serverGuides || 1); i++) {
          const gId = `guide-${i}`;
          const guideExists = newBoats.some(b => b.assignedPassengers.some(p => p.passengerId === gId)) ||
                              finalUnassigned.some(p => p.passengerId === gId);

          if (!guideExists) {
              const guidePassenger: BoatPassenger = {
                  bookingId: `sys-guide-${i}`,
                  passengerId: gId,
                  shortId: 0,
                  name: `🚣 Гид ${i}`,
                  isChild: false,
                  isChildUnder7: false,
                  hasDog: false
              };
              const targetBoat = newBoats.find(b => b.assignedPassengers.length > 0 && b.assignedPassengers.length < b.paidCapacity) ||
                                 newBoats.find(b => b.assignedPassengers.length < b.paidCapacity);
              if (targetBoat) {
                  targetBoat.assignedPassengers.push(guidePassenger);
              } else {
                  finalUnassigned.push(guidePassenger);
              }
          }
      }

      setUnassigned(finalUnassigned);
      setBoats(newBoats);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [tourDateId]);

  // ==========================================
  // ОБРАБОТЧИКИ СОБЫТИЙ (DND И КНОПКИ)
  // ==========================================

  function handleDragStart(e: DragStartEvent) {
    const id = e.active.id as string;
    if (id.startsWith('pass-')) {
      const pId = id.replace('pass-', '');
      const passenger = [...boats.flatMap(b => b.assignedPassengers), ...unassigned].find(p => p.passengerId === pId);
      if (passenger) setActivePassenger(passenger);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActivePassenger(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('K') && overId.startsWith('K')) {
      setBoats((prev) => {
        const oldIndex = prev.findIndex(b => b.id === activeId);
        const newIndex = prev.findIndex(b => b.id === overId);
        return arrayMove(prev, oldIndex, newIndex);
      });
      return;
    }

    if (activeId.startsWith('pass-')) {
      const pId = activeId.replace('pass-', '');
      const passenger = [...boats.flatMap(b => b.assignedPassengers), ...unassigned].find(p => p.passengerId === pId);
      if (!passenger) return;

      setBoats(prev => prev.map(b => ({
        ...b, 
        assignedPassengers: b.id === overId 
          ? [...b.assignedPassengers.filter(p => p.passengerId !== pId), passenger] 
          : b.assignedPassengers.filter(p => p.passengerId !== pId)
      })));

      setUnassigned(prev => {
        const filtered = prev.filter(p => p.passengerId !== pId);
        return overId === 'unassigned-area' ? [...filtered, passenger] : filtered;
      });
    }
  }

  async function handleSaveAssignments() {
    let k2Counter = 1;
    let k3Counter = 1;

    const assignments: Assignment[] = boats.flatMap(b => {
      const newVisualIndex = b.type === 'K2' ? k2Counter++ : k3Counter++;
    return b.assignedPassengers
        .filter(p => !p.passengerId.startsWith('guide-'))
        .map(p => ({ 
          bookingId: p.bookingId, 
          passengerId: p.passengerId,
          passengerName: p.name,
          boatType: b.type, 
          boatIndex: newVisualIndex
      }));
    });

    const res = await saveBoatAssignments(tourDateId, assignments);
    if (res.success) { 
      showToast('Рассадка сохранена!', 'success'); 
      onRefresh(); 
    } else {
      showToast('Ошибка сохранения', 'error');
    }
  }

  async function handleDeleteBoat(boatId: string, type: 'K2' | 'K3') {
    const newK2 = type === 'K2' ? Math.max(0, boatsK2 - 1) : boatsK2;
    const newK3 = type === 'K3' ? Math.max(0, boatsK3 - 1) : boatsK3;
    
    setBoatsK2(newK2);
    setBoatsK3(newK3);
    setBoats(prev => prev.filter(b => b.id !== boatId));
    await updateTourDateBoats(tourDateId, newK2, newK3, guidesCount);
  }

  async function handleUpdateSettings() {
    const res = await updateTourDateBoats(tourDateId, boatsK2, boatsK3, guidesCount);
    if (res.success) {
      showToast('Флот зафиксирован. Идет пересчет...', 'success');
      await loadData();
      onRefresh();
    } else {
      showToast('Ошибка фиксации флота', 'error');
    }
  }

  async function handleSendManifest() {
    showToast('Отправка манифеста...', 'info');
    const res = await sendKayakingManifest(tourDateId, boats);
    if (res.success) {
      showToast('Манифест отправлен в Telegram!', 'success');
    } else {
      showToast(res.error || 'Ошибка отправки манифеста', 'error');
    }
  }
  // 🔥 Функция для переключения галочек (Дети / Собаки)
  async function handleToggleAttribute(bookingId: string, field: 'hasDog' | 'hasChildUnder7', newValue: boolean) {
    // 1. Мгновенно обновляем таблицу
    setGroups(prev => prev.map(g => g.bookingId === bookingId ? { ...g, [field]: newValue } : g));

    // 2. Мгновенно обновляем карточки в лодках (чтобы появились бейджики)
    setBoats(prev => prev.map(b => ({
      ...b,
      assignedPassengers: b.assignedPassengers.map(p => p.bookingId === bookingId ? { ...p, [field]: newValue } : p)
    })));

    // 3. Обновляем карточки на берегу
    setUnassigned(prev => prev.map(p => p.bookingId === bookingId ? { ...p, [field]: newValue } : p));

    // 4. Тихо сохраняем в базу
    const res = await toggleBookingFlag(bookingId, field, newValue);
    if (!res.success) {
      showToast('Ошибка сохранения', 'error');
      loadData(); // Откатываем назад, если база упала
    }
  }
  if (loading) return (
    <div className="p-12 text-center text-slate-700 animate-pulse font-bold tracking-widest mt-8 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
      СИНХРОНИЗАЦИЯ ФЛОТА...
    </div>
  );

return (
    <div className="mt-8 space-y-12 pb-8 w-full min-w-0 flex flex-col">
      
      {/* ========================================== */}
      {/* 1. БЛОК НАСТРОЕК (ФЛОТ И ТАБЛИЦА) */}
      {/* ========================================== */}
      <section className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Настройка флота</h3>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <div className="bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100 flex-1 sm:flex-none text-center">
                <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-1">Рекомендация:</span>
                <div className="text-sm font-black text-slate-900">K3: {calculateRecommendedFleet(stats.totalPax).k3} | K2: {calculateRecommendedFleet(stats.totalPax).k2}</div>
             </div>
             <button onClick={handleSendManifest} className="bg-emerald-500 text-slate-950  px-6 py-3 rounded-2xl font-black uppercase text-xs  tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex-1 sm:flex-none">
                🚀 Манифест
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
          <div className="space-y-2">
            <label className="text-xs  font-black uppercase text-slate-700 ml-2">Лодок K2 (Двойки)</label>
            <input type="number" min="0" value={boatsK2} onChange={e => setBoatsK2(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-lg text-slate-900 focus:border-teal-500 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs  font-black uppercase text-slate-700 ml-2">Лодок K3 (Тройки)</label>
            <input type="number" min="0" value={boatsK3} onChange={e => setBoatsK3(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-lg text-slate-900 focus:border-teal-500 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs  font-black uppercase text-slate-700 ml-2">Экипаж гидов</label>
            <select value={guidesCount} onChange={e => setGuidesCount(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-900 outline-none focus:border-teal-500 transition-all">
              <option value={1}>1 Гид</option>
              <option value={2}>2 Гида</option>
              <option value={3}>3 Гида</option>
            </select>
          </div>
        </div>
        
        {/* ТАБЛИЦА БРОНЕЙ */}
        <div className="w-full max-w-full overflow-hidden border border-slate-200 rounded-3xl bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm min-w-[600px] sm:min-w-[700px]">
              <thead className="bg-slate-50 text-xs  font-black uppercase tracking-widest text-slate-500 border-b-2 border-slate-300">
                <tr>
                  <th className="p-4 text-left whitespace-nowrap">Участник / Комментарий</th>
                  <th className="p-4 text-center">Взр</th>
                  <th className="p-4 text-center">Дет</th>
                  <th className="p-4 text-center">Клуб</th>
                  <th className="p-4 text-center">Сем</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {groups.map(g => (
                  <tr key={g.bookingId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 min-w-[250px]">
                  <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span>{g.name}</span>
                        
                        {/* 🔥 Кликабельная кнопка Ребенка */}
                        <button
                          onClick={() => handleToggleAttribute(g.bookingId, 'hasChildUnder7', !g.hasChildUnder7)}
                          title="Ребенок до 7 лет (нажмите для переключения)"
                          className={`flex shrink-0 p-1.5 rounded-lg transition-all ${
                            g.hasChildUnder7 
                              ? 'bg-teal-100 text-teal-600 shadow-sm' 
                              : 'bg-slate-100 text-slate-300 hover:text-teal-500 hover:bg-teal-50'
                          }`}
                        >
                          <Baby size={16} />
                        </button>

                        {/* 🔥 Кликабельная кнопка Собаки */}
                        <button
                          onClick={() => handleToggleAttribute(g.bookingId, 'hasDog', !g.hasDog)}
                          title="Собака (нажмите для переключения)"
                          className={`flex shrink-0 p-1.5 rounded-lg transition-all ${
                            g.hasDog 
                              ? 'bg-amber-100 text-amber-600 shadow-sm' 
                              : 'bg-slate-100 text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                        >
                          <Dog size={16} />
                        </button>
                      </div>
                      {g.comment && <div className="text-[11px] text-slate-500 italic mt-1 leading-tight">{g.comment}</div>}
                    </td>
                    <td className="p-4 text-center font-medium text-slate-600">{g.adultsCount}</td>
                    <td className="p-4 text-center font-medium text-slate-600">{g.childCount}</td>
                    <td className="p-4 text-center font-medium text-slate-600">{g.memberCount}</td>
                    <td className="p-4 text-center font-medium text-slate-600">{g.familyCount}</td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Нет подтвержденных бронирований</td></tr>
                )}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black uppercase text-xs  tracking-widest">
                <tr>
                  <td className="p-4 text-right whitespace-nowrap">Всего пассажиров: <span className="text-teal-400 text-base ml-2">{stats.totalPax}</span></td>
                  <td className="p-4 text-center text-sm">{stats.adults}</td>
                  <td className="p-4 text-center text-sm">{stats.children}</td>
                  <td className="p-4 text-center text-sm">{stats.members}</td>
                  <td className="p-4 text-center text-sm">{stats.families}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <button onClick={handleUpdateSettings} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all active:scale-[0.99]">
          Зафиксировать флот и обновить рассадку
        </button>
      </section>

      {/* ========================================== */}
      {/* 2. БЛОК РАССАДКИ (ВИЗУАЛЬНЫЙ DnD) */}
      {/* ========================================== */}
      <section className="space-y-6 w-full max-w-full">
        <div className="flex items-center gap-3 ml-2 sm:ml-4">
            <Anchor className="text-teal-500" size={24} />
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Интерактивная рассадка</h3>
        </div>

        {warnings.length > 0 && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4 shadow-sm w-full">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div className="space-y-2 w-full">
                    <h4 className="text-xs  font-black uppercase tracking-widest text-amber-800">Система сообщает:</h4>
                    {warnings.map((w, i) => <p key={i} className="text-xs text-amber-900 font-medium leading-relaxed">{w}</p>)}
                </div>
            </div>
        )}

       <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 w-full">
             <SortableContext items={boats.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    {boats.map(boat => (
                      <SortableBoat 
                        key={boat.id} 
                        boat={boat} 
                        onDelete={() => handleDeleteBoat(boat.id, boat.type)} 
                      />
                    ))}
                </SortableContext>
            </div>

            <UnassignedDropArea>
                {unassigned.map(p => <DraggablePassenger key={p.passengerId} passenger={p} />)}
            </UnassignedDropArea>

            <DragOverlay dropAnimation={null}>
                {activePassenger && (
                    <div className=" bg-teal-500 text-slate-950  px-5 py-4 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-3 rotate-3 scale-105 border-2 border-white/20">
                        {activePassenger.isChildUnder7 ? <Baby size={18}/> : <Users size={18}/>}
                        {activePassenger.name}
                    </div>
                )}
            </DragOverlay>
        </DndContext>
{/* Кнопка сохранения теперь в потоке документа, в самом низу */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex justify-center w-full">
            <button onClick={handleSaveAssignments} className="w-full sm:w-auto  bg-teal-500 text-slate-950  px-8 sm:px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg shadow-teal-500/30 border border-teal-400 hover:bg-teal-400 active:scale-95 transition-all">
                Сохранить рассадку
            </button>
        </div>
      </section>
    </div>
  );
}