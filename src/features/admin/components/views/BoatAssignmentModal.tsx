'use client';

import { useState, useEffect } from 'react';
import { 
  DndContext, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor, 
  DragOverlay, DragStartEvent, DragEndEvent, useDroppable 
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { getBoatAssignments, saveBoatAssignments } from '@/features/admin/actions/kayaking';
import { Boat, BoatPassenger, Assignment } from '@/features/kayaking/types';
import { X, AlertTriangle, Map, Baby, User } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import SortableBoat from './SortableBoat';
import DraggablePassenger from './DraggablePassenger';

function UnassignedDropArea({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'unassigned-area' });
  return (
    <div ref={setNodeRef} className={`mt-8 p-6 border-2 border-dashed rounded-[2.5rem] min-h-[150px] transition-all ${isOver ? 'border-teal-500 bg-teal-500/10 scale-[1.01]' : 'border-slate-800 bg-slate-900/20'}`}>
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center justify-center gap-2">
        <Map size={14} /> Берег (Нераспределенные пассажиры)
      </h4>
      {children}
    </div>
  );
}

export default function BoatAssignmentModal({ tourDateId, onClose, onSaved }: { tourDateId: string; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [unassigned, setUnassigned] = useState<BoatPassenger[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [activePassenger, setActivePassenger] = useState<BoatPassenger | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  async function load() {
    const res = await getBoatAssignments(tourDateId);
    if (res.success && res.data) {
      const { assignments, unassigned: serverUnassigned, boatsK2Count, boatsK3Count, warnings } = res.data;
      setWarnings(warnings || []);
      
      const newBoats: Boat[] = [];
      for(let i=1; i<=boatsK2Count; i++) newBoats.push({ id: `K2-${i}`, type: 'K2', index: i, assignedPassengers: [], paidCapacity: 2, bonusCapacity: 1, guideAssigned: false });
      for(let i=1; i<=boatsK3Count; i++) newBoats.push({ id: `K3-${i}`, type: 'K3', index: i, assignedPassengers: [], paidCapacity: 3, bonusCapacity: 1, guideAssigned: false });

      assignments.forEach((a: any) => {
        const boat = newBoats.find(b => b.id === `${a.boatType}-${a.boatIndex}`);
        if (boat) boat.assignedPassengers.push({ bookingId: a.bookingId, passengerId: a.passengerId, name: a.passengerName, isChild: false });
      });

      setUnassigned(serverUnassigned || []);
      setBoats(newBoats);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
        ...b, assignedPassengers: b.id === overId 
          ? [...b.assignedPassengers.filter(p => p.passengerId !== pId), passenger] 
          : b.assignedPassengers.filter(p => p.passengerId !== pId)
      })));

      setUnassigned(prev => {
        const filtered = prev.filter(p => p.passengerId !== pId);
        return overId === 'unassigned-area' ? [...filtered, passenger] : filtered;
      });
    }
  }

  async function handleSave() {
    let k2Counter = 1;
    let k3Counter = 1;

    const assignments: Assignment[] = boats.flatMap(b => {
      const newVisualIndex = b.type === 'K2' ? k2Counter++ : k3Counter++;
      return b.assignedPassengers.map(p => ({ 
        bookingId: p.bookingId, 
        passengerId: p.passengerId,
        passengerName: p.name,
        boatType: b.type, 
        boatIndex: newVisualIndex 
      }));
    });

    const res = await saveBoatAssignments(tourDateId, assignments);
    if (res.success) { showToast('Рассадка сохранена', 'success'); onSaved(); }
    else showToast('Ошибка сохранения', 'error');
  }

  if (loading) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[110]">
      <div className="text-teal-500 font-black uppercase text-sm tracking-widest animate-pulse">Загрузка флота...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[100] p-0 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 w-full h-full sm:h-[90dvh] sm:rounded-[3.5rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
        <div className="p-6 sm:p-10 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Рассадка байдарок</h3>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-2">Посадка пассажиров</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all active:scale-90 shadow-inner">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-10 pb-40 sm:pb-10">
          {warnings.length > 0 && (
            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] space-y-2">
              <h4 className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest italic"><AlertTriangle size={14}/> Система сообщает:</h4>
              {warnings.map((w, i) => <p key={i} className="text-amber-200/60 text-[11px] font-medium leading-relaxed">{w}</p>)}
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SortableContext items={boats.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {boats.map(boat => <SortableBoat key={boat.id} boat={boat} />)}
              </SortableContext>
            </div>

            <UnassignedDropArea>
              <div className="flex flex-wrap gap-3 justify-center">
                {unassigned.map(p => <DraggablePassenger key={p.passengerId} passenger={p} />)}
              </div>
            </UnassignedDropArea>

            <DragOverlay dropAnimation={null}>
              {activePassenger && (
                <div className="bg-teal-500 text-slate-950 px-4 py-3 rounded-2xl font-black text-[11px] shadow-2xl border-2 border-white/20 rotate-3 scale-110 flex items-center gap-2">
                  {activePassenger.isChild ? <Baby size={16} /> : <User size={16} />}
                  {activePassenger.name}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="p-6 sm:p-10 border-t border-white/5 bg-slate-900/80 backdrop-blur-3xl flex flex-col sm:flex-row justify-end gap-4 fixed bottom-0 left-0 right-0 sm:relative z-30">
          <button onClick={onClose} className="order-2 sm:order-1 px-10 py-5 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors active:scale-95">Отмена</button>
          <button onClick={handleSave} className="order-1 sm:order-2 px-10 py-5 bg-teal-500 text-slate-950 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-teal-500/30 hover:bg-teal-400 active:scale-95 transition-all">Сохранить рассадку</button>
        </div>
      </div>
    </div>
  );
}