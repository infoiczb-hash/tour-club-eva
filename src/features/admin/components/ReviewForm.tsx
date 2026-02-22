"use client";

import React, { useState } from 'react';
import { X, Save, Loader2, MessageCircle, Send, Instagram, Phone } from 'lucide-react';
import Button from '@/shared/ui/Button';

// Импортируем экшен из features/reviews, так как логика (БД) там
import { upsertReview } from '@/features/reviews/actions';

interface ReviewFormProps {
  initialData?: any; // Если null — создаем новый, иначе редактируем
  onClose: () => void;
  onSuccess: () => void; // Чтобы обновить список после сохранения
}

export default function ReviewForm({ initialData, onClose, onSuccess }: ReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    text: initialData?.text || '',
    source: initialData?.source || 'tg', // tg, viber, instagram
    isActive: initialData ? initialData.isActive : true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.text) return alert("Заполните имя и текст!");

    setLoading(true);
    const res = await upsertReview(formData);
    setLoading(false);

    if (res.success) {
      onSuccess(); // Закрываем форму и обновляем список
    } else {
      alert("Ошибка: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <h3 className="font-bold text-lg dark:text-white">
            {initialData ? '✏️ Редактировать отзыв' : '💬 Новый отзыв'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
            <X size={20} className="text-slate-500"/>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Имя */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Имя клиента</label>
            <input 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Например: Ольга К."
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* Источник */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Источник</label>
            <div className="grid grid-cols-3 gap-2">
               {[
                 { id: 'tg', label: 'Telegram', icon: <Send size={14}/>, color: 'text-sky-500 bg-sky-50 border-sky-200' },
                 { id: 'viber', label: 'Viber', icon: <Phone size={14}/>, color: 'text-purple-500 bg-purple-50 border-purple-200' },
                 { id: 'instagram', label: 'Insta', icon: <Instagram size={14}/>, color: 'text-pink-500 bg-pink-50 border-pink-200' },
               ].map(opt => (
                 <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({...formData, source: opt.id})}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all ${
                      formData.source === opt.id 
                        ? `${opt.color} ring-1 ring-current` 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50'
                    }`}
                 >
                    {opt.icon} {opt.label}
                 </button>
               ))}
            </div>
          </div>

          {/* Текст */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Текст отзыва</label>
            <textarea 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none h-32 leading-relaxed"
              placeholder="Что клиент написал..."
              value={formData.text}
              onChange={e => setFormData({...formData, text: e.target.value})}
            />
          </div>

          {/* Активность */}
          <div 
             onClick={() => setFormData(p => ({...p, isActive: !p.isActive}))}
             className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
               formData.isActive 
                 ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800' 
                 : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
             }`}
          >
             <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.isActive ? 'bg-teal-500 text-white' : 'bg-slate-300'}`}>
                {formData.isActive && <MessageCircle size={12}/>}
             </div>
             <div>
                <span className="text-sm font-bold dark:text-white">Показывать на сайте</span>
                <p className="text-[10px] text-slate-400">Если выключить, отзыв скроется из карусели</p>
             </div>
          </div>

          <div className="pt-2 flex gap-3">
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