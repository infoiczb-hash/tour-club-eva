"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, CheckCircle, Clock, Archive, Trash2, 
  MessageSquare, User, Tent, Briefcase, FileText, Heart, Star, Eye
} from 'lucide-react';
import { Inquiry, InquiryStatus, InquiryType } from '@prisma/client';
import { updateInquiryStatusAction, deleteInquiryAction } from '@/features/admin/actions/inquiries';
import { useToast } from '@/shared/context/ToastContext';

// Иконки для типов
const TYPE_ICONS = {
  TOUR: <Tent size={14} className="text-teal-500"/>,
  HR: <User size={14} className="text-purple-500"/>,
  BLOG: <FileText size={14} className="text-amber-500"/>,
  B2B: <Briefcase size={14} className="text-blue-500"/>,
  REVIEW: <Star size={14} className="text-yellow-400"/>,
  HELP: <Heart size={14} className="text-rose-500"/>,
};

// Лейблы для статусов
const STATUS_LABELS = {
  NEW: { label: 'Новое', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  WORK: { label: 'В работе', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  DONE: { label: 'Архив', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
};

interface Props {
  inquiries: Inquiry[];
}

export default function InquiriesTab({ inquiries: initialData }: Props) {
  const [inquiries, setInquiries] = useState(initialData);
  const [filterType, setFilterType] = useState<InquiryType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | 'ALL'>('ALL');
  const { showToast } = useToast();

  // Фильтрация
  const filtered = useMemo(() => {
    return inquiries.filter(item => {
      const matchType = filterType === 'ALL' || item.type === filterType;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      return matchType && matchStatus;
    });
  }, [inquiries, filterType, filterStatus]);

  // Обработчики
  const handleStatus = async (id: string, newStatus: InquiryStatus) => {
    // Оптимистичное обновление UI
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    const res = await updateInquiryStatusAction(id, newStatus);
    if (!res.success) showToast('Ошибка обновления', 'error');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить навсегда?')) return;
    setInquiries(prev => prev.filter(i => i.id !== id));
    await deleteInquiryAction(id);
    showToast('Удалено', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
         <h1 className="text-2xl font-black uppercase tracking-tight dark:text-white flex items-center gap-3">
            <MessageSquare className="text-teal-500"/> Обращения
            <span className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-1 rounded-lg">
                {inquiries.filter(i => i.status === 'NEW').length} новых
            </span>
         </h1>

         {/* Фильтры */}
         <div className="flex gap-2 overflow-x-auto pb-1">
             {/* Фильтр Статуса */}
             <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                 {(['ALL', 'NEW', 'WORK', 'DONE'] as const).map(s => (
                    <button 
                       key={s} onClick={() => setFilterStatus(s)}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterStatus === s ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-600'}`}
                    >
                        {s === 'ALL' ? 'Все' : s === 'NEW' ? 'Новые' : s === 'WORK' ? 'В работе' : 'Архив'}
                    </button>
                 ))}
             </div>
         </div>
      </div>

      {/* Список карточек (Mobile-first адаптация вместо таблицы) */}
      <div className="grid gap-3">
         {filtered.length === 0 && (
             <div className="text-center py-20 text-slate-600">Нет обращений по выбранным фильтрам</div>
         )}
         
         {filtered.map(item => {
             const payload = item.payload as any || {};
             
             return (
               <div key={item.id} className={`group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all ${item.status === 'NEW' ? 'border-teal-500/40 shadow-sm' : 'border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'}`}>
                  
                  {/* Верхняя строка: Тип + Дата + Статус */}
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                             {TYPE_ICONS[item.type]}
                          </div>
                          <div>
                              <span className="text-[12px] font-bold text-slate-600 block uppercase tracking-wider">{item.type}</span>
                              <span className="text-xs text-slate-600 font-mono">
                                  {new Date(item.createdAt).toLocaleString('ru-RU')}
                              </span>
                          </div>
                      </div>
                      
                      {/* Свитчер статуса */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                          <button onClick={() => handleStatus(item.id, 'NEW')} title="Новое" className={`p-1.5 rounded ${item.status === 'NEW' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Clock size={14}/></button>
                          <button onClick={() => handleStatus(item.id, 'WORK')} title="В работе" className={`p-1.5 rounded ${item.status === 'WORK' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Eye size={14}/></button>
                          <button onClick={() => handleStatus(item.id, 'DONE')} title="Архив" className={`p-1.5 rounded ${item.status === 'DONE' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Archive size={14}/></button>
                      </div>
                  </div>

                  {/* Контент */}
                  <div className="grid md:grid-cols-4 gap-4 items-start">
                      {/* 1. Кто */}
                      <div className="md:col-span-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                          <div className="text-sm text-teal-600 font-medium mt-1">
                              {item.phone && <div className="flex items-center gap-1">{item.phone}</div>}
                              {item.social && <div className="flex items-center gap-1">@{item.social.replace('@','')}</div>}
                          </div>
                      </div>

                      {/* 2. Суть */}
                      <div className="md:col-span-2">
                          {/* Специфичные поля */}
                          {payload.tour && <div className="mb-2 text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded w-fit">Тур: {payload.tour}</div>}
                          {payload.role && <div className="mb-2 text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded w-fit">Роль: {payload.role}</div>}
                          {payload.company && <div className="mb-2 text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded w-fit">Компания: {payload.company}</div>}
                          {payload.rating && <div className="mb-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded w-fit">Оценка: {payload.rating} ★</div>}
                          
                          <p className="text-sm text-slate-600 dark:text-slate-600 whitespace-pre-wrap leading-relaxed">
                              {item.message}
                          </p>
                      </div>

                      {/* 3. Действия */}
                      <div className="md:col-span-1 flex md:justify-end items-start pt-1">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          >
                             <Trash2 size={14}/> Удалить
                          </button>
                      </div>
                  </div>
                  
                  {/* Подсветка "Новое" */}
                  {item.status === 'NEW' && (
                      <span className="absolute -left-px top-8 bottom-8 w-1 bg-teal-500 rounded-r-full"/>
                  )}
               </div>
             )
         })}
      </div>
    </div>
  );
}