'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Boat } from '@/features/kayaking/types';
import DraggablePassenger from './DraggablePassenger';
// 🔥 Добавили Trash2
import { GripVertical, Anchor, Users, Trash2 } from 'lucide-react';

// 🔥 Добавили пропс onDelete
export default function SortableBoat({ boat, onDelete }: { boat: Boat, onDelete?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 0
  };

  const currentSeats = boat.assignedPassengers.length;
  const isOver = currentSeats > boat.paidCapacity;
  const isFull = currentSeats === boat.paidCapacity;
  const isEmpty = currentSeats === 0; // 🔥 Флаг пустой лодки

  const hasDog = boat.assignedPassengers.some(p => p.hasDog);
  const hasChildUnder7 = boat.assignedPassengers.some(p => p.isChildUnder7);

  const isK3 = boat.type === 'K3';
  const bgColor = isK3 ? 'bg-teal-50/40' : 'bg-blue-50/40';
  const headerBg = isK3 ? 'bg-teal-100/50' : 'bg-blue-100/50';
  const borderColor = isK3 ? 'border-teal-200' : 'border-blue-200';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`border-2 rounded-[2rem] p-4 sm:p-5 min-h-[220px] flex flex-col transition-all duration-300 shadow-md ${bgColor} ${
        isDragging ? 'scale-95 border-teal-500 shadow-xl bg-white' : borderColor
      }`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className={`flex justify-between items-center mb-6 p-3 rounded-2xl cursor-grab active:cursor-grabbing touch-none transition-colors border ${headerBg} ${isK3 ? 'border-teal-200/50' : 'border-blue-200/50'}`}
      >
        <div className="flex items-center gap-3">
          <GripVertical size={18} className={isK3 ? 'text-teal-600' : 'text-blue-600'} />
          <div className="flex flex-col">
            <span className={`text-[11px] font-black uppercase italic tracking-tighter flex items-center gap-1 ${isK3 ? 'text-teal-900' : 'text-blue-900'}`}>
              <Anchor size={12} className={isK3 ? 'text-teal-600' : 'text-blue-600'} /> {boat.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 🔥 КНОПКА УДАЛЕНИЯ (Показывается только для пустых лодок) */}
          {isEmpty && onDelete && (
            <button 
              onPointerDown={(e) => e.stopPropagation()} // Чтобы dnd-kit не начал тащить лодку
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all cursor-pointer"
              title="Удалить пустую байдарку"
            >
              <Trash2 size={16} />
            </button>
          )}

          <div className={`text-[11px] font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm border ${
            isOver ? 'bg-rose-500 text-white border-rose-600 shadow-rose-200' : 
            isFull ? 'bg-emerald-600 text-white border-emerald-700' :
            'bg-white text-slate-700 border-slate-200'
          }`}>
            <Users size={12} />
            {currentSeats}/{boat.paidCapacity}
          </div>
        </div>
      </div>

<div className="space-y-2.5 flex-1">
        {boat.assignedPassengers.map(p => (
          <DraggablePassenger key={p.passengerId} passenger={p} />
        ))}
        
        {isEmpty && (
          <div className={`h-full min-h-[100px] flex flex-col items-center justify-center border-2 border-dashed rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest gap-2 bg-white/50 ${isK3 ? 'border-teal-200 text-teal-400' : 'border-blue-200 text-blue-400'}`}>
            Свободна
          </div>
        )}
      </div>

      {/* 🔥 БЛОК ОСОБЕННОСТЕЙ (Появляется только если есть повод) */}
      {(hasDog || hasChildUnder7) && !isEmpty && (
        <div className={`mt-4 pt-3 border-t flex flex-col gap-1.5 ${isK3 ? 'border-teal-200/50' : 'border-blue-200/50'}`}>
          {hasChildUnder7 && (
            <div className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
              <span>👶</span> В лодке ребенок до 7 лет
            </div>
          )}
          {hasDog && (
            <div className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
              <span>🐶</span> В лодке собака
            </div>
          )}
        </div>
      )}
    </div>
  );
}