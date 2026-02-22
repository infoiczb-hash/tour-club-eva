import React from 'react';
import { Plus, MessageCircle, Send, Phone, Instagram, Edit, Trash2 } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { StatusSwitch } from '../ui/StatusSwitch';
import { ActionButton } from '../ui/ActionButton';
// 👇 1. Импортируем настоящий тип из базы
import { Review } from '@prisma/client';

interface ReviewsTabProps {
  reviews: Review[]; // 👇 2. Используем его здесь
  onAdd: () => void;
  onEdit: (review: Review) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (review: Review) => void;
}

export default function ReviewsTab({ reviews, onAdd, onEdit, onDelete, onToggleStatus }: ReviewsTabProps) {
  
  // Хелпер для иконки источника
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'tg': return <Send size={14} className="text-sky-500"/>;
      case 'viber': return <Phone size={14} className="text-purple-500"/>;
      case 'instagram': return <Instagram size={14} className="text-pink-500"/>;
      default: return <MessageCircle size={14}/>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase dark:text-white">Отзывы</h2>
        <Button variant="primary" onClick={onAdd}>
          <Plus size={18} className="mr-2"/> Добавить
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-5">Клиент</th>
              <th className="p-5">Источник</th>
              <th className="p-5 w-1/2">Текст</th>
              <th className="p-5 text-center">На сайте</th>
              <th className="p-5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reviews.map(review => (
              <tr key={review.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="p-5 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                    {review.name[0]}
                  </div>
                  {review.name}
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1 w-fit bg-slate-50">
                    {getSourceIcon(review.source)} 
                    <span className="text-xs font-bold uppercase">{review.source}</span>
                  </div>
                </td>
                <td className="p-5 text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">
                  {review.text}
                </td>
                <td className="p-5 text-center">
                  <StatusSwitch active={review.isActive} onClick={() => onToggleStatus(review)} labelOn="Виден" labelOff="Скрыт" />
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionButton icon={<Edit size={16}/>} onClick={() => onEdit(review)} title="Ред"/>
                    <ActionButton icon={<Trash2 size={16}/>} onClick={() => onDelete(review.id)} title="Удалить" color="text-red-500"/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">{review.name[0]}</div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{review.name}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">{review.source}</div>
                </div>
              </div>
              <StatusSwitch active={review.isActive} onClick={() => onToggleStatus(review)} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 p-3 rounded-xl italic">"{review.text}"</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => onEdit(review)} className="p-2 bg-slate-100 rounded-lg text-slate-400"><Edit size={16}/></button>
              <button onClick={() => onDelete(review.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}