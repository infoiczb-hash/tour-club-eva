'use client';

import { useDraggable } from '@dnd-kit/core';
import { BoatPassenger } from '@/features/kayaking/types';
import { User, Baby, Dog, Navigation, GripVertical } from 'lucide-react';

export default function DraggablePassenger({ passenger }: { passenger: BoatPassenger }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: `pass-${passenger.passengerId}` 
  });

  const style = transform ? { 
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, 
    zIndex: 100,
    scale: '1.05'
  } : undefined;

  const isGuide = passenger.passengerId.startsWith('guide-');

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white border-2 flex items-stretch transition-all shadow-sm w-full sm:w-auto overflow-hidden ${
        isDragging ? 'opacity-50 scale-95 shadow-2xl z-50 border-teal-500' : 'opacity-100 border-slate-200 hover:border-teal-300'
      } ${isGuide ? 'border-emerald-300 bg-emerald-50/30' : 'rounded-2xl'}`}
    >
      {/* 🔥 ЗОНА ЗАХВАТА (Только она реагирует на перетаскивание) */}
      <div 
        {...listeners} 
        {...attributes} 
        className={`flex items-center justify-center px-2 cursor-grab active:cursor-grabbing touch-none shrink-0 transition-colors border-r ${
          isGuide ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-teal-500'
        }`}
      >
        <GripVertical size={16} />
      </div>

      {/* 🛡️ БЕЗОПАСНАЯ ЗОНА ДЛЯ СКРОЛЛА (Здесь можно водить пальцем) */}
      <div className="flex items-center gap-3 p-2 flex-1 overflow-hidden">
        {/* АВАТАРКА */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${
          isGuide ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
          passenger.isChildUnder7 ? 'bg-teal-500/10 text-teal-600' : 
          passenger.isChild ? 'bg-sky-500/10 text-sky-600' : 
          'bg-slate-100 text-slate-700'
        }`}>
          {isGuide ? <Navigation size={14} /> : 
           passenger.isChildUnder7 || passenger.isChild ? <Baby size={14} /> : 
           <User size={14} />}
        </div>

        {/* ИМЯ И НОМЕР БРОНИ */}
        <div className="flex flex-col truncate pr-1">
          <span className={`text-[12px] font-black tracking-tight truncate ${isGuide ? 'text-emerald-700' : 'text-slate-700'}`}>
            {passenger.name}
          </span>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* БЕЙДЖ С НОМЕРОМ БРОНИ */}
            {!isGuide && passenger.shortId > 0 && (
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-1.5 rounded-md border border-blue-100">
                 #{passenger.shortId}
               </span>
            )}
            
            {/* МЕТКИ */}
            {passenger.isChildUnder7 && !isGuide && (
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-1.5 rounded-md">
                &lt;7 лет
              </span>
            )}
            
            {passenger.hasDog && (
               <span title="С собакой" className="flex shrink-0 bg-amber-50 p-0.5 rounded-md">
                 <Dog size={12} className="text-amber-500" />
               </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}