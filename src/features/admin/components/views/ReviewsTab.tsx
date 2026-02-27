import React from 'react';
import { Plus, MessageCircle, Send, Phone, Instagram, Edit, Trash2, Tags, CheckCircle2, Circle } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { Review } from '@prisma/client';

interface ReviewsTabProps {
  reviews: Review[];
  onAdd: () => void;
  onEdit: (review: Review) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (review: Review) => void;
}

// Конфиг для бейджей категорий
const CATEGORY_MAP: Record<string, { label: string, colorClass: string }> = {
  general: { label: 'Местное', colorClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  kayak: { label: 'Сплавы', colorClass: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  sup: { label: 'SUP-туры', colorClass: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20' },
  mountains: { label: 'Туры в горы', colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  kids: { label: 'Детские', colorClass: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' },
};

export default function ReviewsTab({ reviews, onAdd, onEdit, onDelete, onToggleStatus }: ReviewsTabProps) {
  
  // Хелпер для иконки источника
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'tg': return <Send size={14} className="text-sky-500"/>;
      case 'viber': return <Phone size={14} className="text-purple-500"/>;
      case 'instagram': return <Instagram size={14} className="text-pink-500"/>;
      default: return <MessageCircle size={14} className="text-teal-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase dark:text-white">Отзывы</h2>
        <Button variant="primary" onClick={onAdd} className="bg-teal-600 hover:bg-teal-700">
          <Plus size={18} className="mr-2"/> Добавить
        </Button>
      </div>

      {/* --- ДЕСКТОПНАЯ ТАБЛИЦА --- */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-5">Клиент</th>
              <th className="p-5">Источник</th>
              <th className="p-5">Направление</th>
              <th className="p-5 w-2/5">Текст</th>
              <th className="p-5 text-center">Статус</th>
              <th className="p-5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reviews.map(review => {
              // Если категория не задана или старая, подставляем дефолтную
              const catConfig = CATEGORY_MAP[review.category] || CATEGORY_MAP.general;

              return (
                // Класс group тут критически важен для появления кнопок действий при наведении
                <tr key={review.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-200">
                  <td className="p-5 font-bold text-slate-800 dark:text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 shrink-0 uppercase">
                            {review.name[0]}
                        </div>
                        <span className="truncate max-w-[120px]">{review.name}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 w-fit bg-slate-50 dark:bg-slate-800/50">
                      {getSourceIcon(review.source)} 
                      <span className="text-[10px] font-bold uppercase text-slate-500">{review.source}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${catConfig.colorClass}`}>
                       <Tags size={12} strokeWidth={2.5} />
                       {catConfig.label}
                    </div>
                  </td>
                  <td className="p-5 text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">
                    <div className="line-clamp-2" title={review.text}>{review.text}</div>
                  </td>
                  <td className="p-5 text-center">
                    {/* Кастомный переключатель статуса */}
                    <button 
                      onClick={() => onToggleStatus(review)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        review.isActive 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20' 
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {review.isActive ? <CheckCircle2 size={12}/> : <Circle size={12}/>}
                      {review.isActive ? 'Виден' : 'Скрыт'}
                    </button>
                  </td>
                  <td className="p-5 text-right">
                    {/* Кнопки появляются при наведении на строку */}
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => onEdit(review)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-500 transition-colors">
                        <Edit size={16}/>
                      </button>
                      <button onClick={() => onDelete(review.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* --- МОБИЛЬНЫЕ КАРТОЧКИ --- */}
      <div className="md:hidden space-y-4">
        {reviews.map(review => {
           const catConfig = CATEGORY_MAP[review.category] || CATEGORY_MAP.general;
           return (
            <div key={review.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 uppercase shrink-0">
                          {review.name[0]}
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{review.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1 text-[9px] text-slate-400 uppercase font-bold">
                                  {getSourceIcon(review.source)} {review.source}
                              </span>
                              {/* Бейдж категории на мобилке без иконки для экономии места */}
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${catConfig.colorClass}`}>
                                  {catConfig.label}
                              </span>
                          </div>
                      </div>
                  </div>
                  <button onClick={() => onToggleStatus(review)} className={`p-1 transition-colors ${review.isActive ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    {review.isActive ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                  </button>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl italic leading-relaxed">
                    "{review.text}"
                </p>
                
                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button onClick={() => onEdit(review)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform">
                        <Edit size={14}/> Править
                    </button>
                    <button onClick={() => onDelete(review.id)} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform">
                        <Trash2 size={14}/> Удалить
                    </button>
                </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}