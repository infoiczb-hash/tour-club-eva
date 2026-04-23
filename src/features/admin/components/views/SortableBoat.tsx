'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Boat } from '@/features/kayaking/types';
import DraggablePassenger from './DraggablePassenger';
import { GripVertical, Anchor } from 'lucide-react';

export default function SortableBoat({ boat }: { boat: Boat }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 0
  };

  const currentSeats = boat.assignedPassengers.length;
  const isOver = currentSeats > boat.paidCapacity;

  return (
    <div ref={setNodeRef} style={style} className={`bg-white/5 border border-white/5 rounded-[2.5rem] p-5 min-h-[220px] flex flex-col transition-all duration-300 ${isDragging ? 'scale-95 border-teal-500/50' : ''}`}>
      <div {...attributes} {...listeners} className="flex justify-between items-center mb-6 bg-slate-800/50 p-4 rounded-3xl cursor-grab active:cursor-grabbing touch-none hover:bg-slate-700/50 transition-colors">
        <div className="flex items-center gap-3">
          <GripVertical size={18} className="text-slate-600" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase italic tracking-tighter flex items-center gap-1">
              <Anchor size={12} className="text-teal-500" /> {boat.id}
            </span>
          </div>
        </div>
        <div className={`text-[11px] font-black px-4 py-2 rounded-2xl transition-all ${isOver ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-teal-500/10 text-teal-500'}`}>
          {currentSeats}/{boat.paidCapacity}
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {boat.assignedPassengers.map(p => <DraggablePassenger key={p.passengerId} passenger={p} />)}
        {boat.assignedPassengers.length === 0 && (
          <div className="h-full min-h-[100px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] text-[9px] text-slate-700 uppercase font-black tracking-widest gap-2">
            Пусто
          </div>
        )}
      </div>
    </div>
  );
}