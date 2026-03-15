"use client";

import React, { useState } from 'react';
import { X, Save, Loader2, MessageCircle, Send, Instagram, Phone, Tags } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { Review } from '@prisma/client';

// Импортируем экшен
import { upsertReview } from '@/features/reviews/actions';

interface ReviewFormProps {
  initialData?: Partial<Review> | null; 
  onClose: () => void;
  onSuccess: () => void; 
}

// Константа категорий для удобства
const CATEGORIES = [
  { id: 'general', label: 'Местное / Общее' },
  { id: 'kayak', label: 'Сплавы (Байдарки)' },
  { id: 'sup', label: 'SUP-туры' },
  { id: 'mountains', label: 'Туры в горы' },
  { id: 'kids', label: 'Детская программа' },
];

export default function ReviewForm({ initialData, onClose, onSuccess }: ReviewFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    text: initialData?.text || '',
    source: initialData?.source || 'tg',
    category: initialData?.category || 'general',
    isActive: initialData?.isActive ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.text) return alert("Заполните имя и текст!");

    setLoading(true);
    const res = await upsertReview(formData);
    setLoading(false);

    if (res.success) {
      onSuccess(); 
    } else {
      alert("Ошибка: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 sticky top-0 z-10">
          <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
            {initialData ? '✏️ Редактировать отзыв' : '💬 Новый отзыв'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
            <X size={20} className="text-slate-500"/>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Имя */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Имя клиента</label>
            <input 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Например: Ольга К."
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* Источник (Telegram, Viber, Insta) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Источник</label>
            <div className="grid grid-cols-3 gap-2">
               {[
                 { id: 'tg', label: 'Telegram', icon: <Send size={14}/>, color: 'text-sky-500 bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30' },
                 { id: 'viber', label: 'Viber', icon: <Phone size={14}/>, color: 'text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30' },
                 { id: 'instagram', label: 'Insta', icon: <Instagram size={14}/>, color: 'text-pink-500 bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-500/30' },
               ].map(opt => (
                 <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({...formData, source: opt.id})}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition-all ${
                      formData.source === opt.id 
                        ? `${opt.color} ring-1 ring-current` 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                 >
                    {opt.icon} {opt.label}
                 </button>
               ))}
            </div>
          </div>

          {/* Категория тура */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <Tags size={12} /> Направление
            </label>
            <div className="flex flex-wrap gap-2">
               {CATEGORIES.map(cat => (
                 <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat.id})}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      formData.category === cat.id 
                        ? 'bg-teal-500 text-white border-teal-600 shadow-md' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-teal-300'
                    }`}
                 >
                    {cat.label}
                 </button>
               ))}
            </div>
          </div>

          {/* Текст */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Текст отзыва</label>
            <textarea 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none h-28 leading-relaxed"
              placeholder="Что клиент написал..."
              value={formData.text}
              onChange={e => setFormData({...formData, text: e.target.value})}
            />
          </div>

          {/* Активность */}
          <div 
             onClick={() => setFormData(p => ({...p, isActive: !p.isActive}))}
             className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all mt-2 ${
               formData.isActive 
                 ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800' 
                 : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
             }`}
          >
             <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${formData.isActive ? 'bg-teal-500 text-white' : 'bg-slate-300 dark:bg-slate-700'}`}>
                {formData.isActive && <MessageCircle size={12}/>}
             </div>
             <div>
                <span className="text-sm font-bold dark:text-white leading-tight block">Показывать на сайте</span>
                <span className="text-[10px] text-slate-400 leading-tight">Если выключить, отзыв скроется из карусели</span>
             </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
             <Button type="button" variant="secondary" onClick={onClose} className="w-full">Отмена</Button>
             <Button type="submit" variant="primary" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
               {loading ? <Loader2 className="animate-spin" /> : <Save size={16} className="mr-2"/>}
               Сохранить
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}