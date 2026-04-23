'use client';

import { useDraggable } from '@dnd-kit/core';
import { BoatPassenger } from '@/features/kayaking/types';
import { User, Baby } from 'lucide-react';

export default function DraggablePassenger({ passenger }: { passenger: BoatPassenger }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: `pass-${passenger.passengerId}` 
  });

  const style = transform ? { 
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, 
    zIndex: 100,
    scale: '1.05'
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`bg-slate-900 border border-white/5 p-3 rounded-2xl flex justify-between items-center cursor-grab active:cursor-grabbing hover:bg-slate-800 transition-all shadow-lg touch-none ring-1 ring-white/5 ${isDragging ? 'opacity-0' : 'opacity-100 hover:ring-teal-500/30'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${passenger.isChild ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-950 text-slate-500'}`}>
          {passenger.isChild ? <Baby size={16} /> : <User size={16} />}
        </div>
        <div className="text-[11px] font-bold text-white tracking-tight pr-2">
          {passenger.name}
        </div>
      </div>
    </div>
  );
}