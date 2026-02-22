"use client";

import React, { useState, useRef } from 'react';
import { 
  X, Save, Sparkles, Loader2, Wand2, 
  Instagram, Send, Upload, User, 
  Award, Clock, Camera 
} from 'lucide-react';
import Button from '@/shared/ui/Button';
import { performAiTask } from '@/features/admin/actions/ai';
import { uploadImage } from '@/lib/api';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- КОМПОНЕНТ РЕДАКТОРА С AI (Оставляем твой) ---
const RichTextarea = ({ label, value, onChange, placeholder, height = "h-32" }: any) => {
    const [aiLoading, setAiLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
  
    const handleAiImprove = async () => {
      if (!value || value.length < 3) return alert('Напишите хоть пару слов!');
      setAiLoading(true);
      try {
        const res = await performAiTask({ mode: 'improve_text', text: value, tone: 'selling' });
        if(res.success) onChange(res.data);
      } catch (e) { console.error(e); }
      finally { setAiLoading(false); }
    };
  
    return (
      <div className="space-y-2 group">
         <div className="flex justify-between items-end">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-focus-within:text-teal-500 transition-colors ml-1">{label}</label>
            <button type="button" onClick={handleAiImprove} disabled={aiLoading} className="text-[10px] flex items-center gap-1 text-teal-600 hover:text-teal-400 disabled:opacity-50 transition-colors bg-teal-950/30 px-2 py-1 rounded-md border border-teal-900/50">
                {aiLoading ? <Loader2 className="animate-spin" size={10}/> : <Wand2 size={10}/>}
                <span>AI Rewrite</span>
            </button>
         </div>
         <textarea 
            ref={textareaRef}
            className={`w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all resize-none ${height}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
         />
      </div>
    );
};

// --- ОСНОВНАЯ ФОРМА ---
interface Props {
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function GuideForm({ initialData, onClose, onSubmit }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    role: initialData?.role || 'Гид',
    image: initialData?.image || '',
    actionImage: initialData?.actionImage || '', // Новое поле
    bio: initialData?.bio || '',
    experience: initialData?.experience || '',   // Новое поле
    superpower: initialData?.superpower || '',   // Новое поле
    // Превращаем массив тегов в строку для редактирования
    achievements: initialData?.achievements ? initialData.achievements.join(', ') : '', 
    instagram: initialData?.instagram || '', 
    telegram: initialData?.telegram || '', 
    contact: initialData?.contact || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
        const payload = {
            ...formData,
            image: formData.image || null,
            actionImage: formData.actionImage || null,
            // Превращаем строку обратно в массив, убираем пробелы
            achievements: formData.achievements.split(',').map((s: string) => s.trim()).filter(Boolean),
            id: initialData?.id
        };
        await onSubmit(payload);
        onClose();
    } catch (error) {
        console.error(error);
        alert("Ошибка при сохранении");
    } finally {
        setIsUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'actionImage') => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoadingField(field);
    try {
        const url = await uploadImage(file);
        if (url) setFormData(prev => ({ ...prev, [field]: url }));
        else alert("Ошибка получения ссылки на файл");
    } catch (err) { 
        console.error(err);
        alert("Ошибка загрузки"); 
    } 
    finally { setLoadingField(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="bg-slate-950 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] border border-slate-800 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"/>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {initialData ? 'Редактировать досье' : 'Новый оперативник'}
              </h2>
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-2 rounded-xl transition text-slate-400"><X size={24}/></button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-8 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* --- ФОТОГРАФИИ (GRID) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* 1. Портрет (Card) */}
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <User size={12}/> Портрет (Карточка)
                </label>
                <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-800 relative group overflow-hidden bg-slate-900 hover:border-teal-500/50 transition-colors">
                    {formData.image ? (
                        <img src={formData.image} className="w-full h-full object-cover" alt="Portrait"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 flex-col gap-2">
                            <User size={40} strokeWidth={1}/>
                            <span className="text-xs">Загрузить фото</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
                       {loadingField === 'image' ? <Loader2 className="animate-spin text-teal-500"/> : <Upload className="text-white"/>}
                    </div>
                    <input type="file" onChange={(e) => handleFile(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
             </div>

             {/* 2. Экшен (Modal) */}
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <Camera size={12}/> Экшен (Модалка)
                </label>
                <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-800 relative group overflow-hidden bg-slate-900 hover:border-teal-500/50 transition-colors">
                    {formData.actionImage ? (
                        <img src={formData.actionImage} className="w-full h-full object-cover" alt="Action"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 flex-col gap-2">
                            <Camera size={40} strokeWidth={1}/>
                            <span className="text-xs">Загрузить фото в деле</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
                       {loadingField === 'actionImage' ? <Loader2 className="animate-spin text-teal-500"/> : <Upload className="text-white"/>}
                    </div>
                    <input type="file" onChange={(e) => handleFile(e, 'actionImage')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
             </div>
          </div>

          <div className="h-px bg-slate-800 w-full" />

          {/* --- ОСНОВНАЯ ИНФО --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Имя Фамилия</label>
                <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm font-bold text-white placeholder-slate-600 transition-colors"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Роман Санду"
                />
             </div>
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1">Роль (Бейдж)</label>
                <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white placeholder-slate-600 transition-colors"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Основатель"
                />
             </div>
          </div>

          {/* Superpower & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Sparkles size={10} className="text-amber-400"/> Статус (Superpower)</label>
                <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white placeholder-slate-600 transition-colors"
                    value={formData.superpower} onChange={e => setFormData({...formData, superpower: e.target.value})} placeholder="Организация экспедиций"
                />
             </div>
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Clock size={10} className="text-teal-400"/> Опыт</label>
                <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white placeholder-slate-600 transition-colors"
                    value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="15 лет"
                />
             </div>
          </div>

          <div className="space-y-1">
             <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Award size={10}/> Навыки (теги через запятую)</label>
             <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white placeholder-slate-600 transition-colors"
                 value={formData.achievements} onChange={e => setFormData({...formData, achievements: e.target.value})} placeholder="Альпинизм, Первая помощь, Психология"
             />
          </div>

          {/* БИОГРАФИЯ (с AI) */}
          <RichTextarea 
             label="БИОГРАФИЯ / ДОСЬЕ"
             placeholder="Расскажите историю гида..."
             value={formData.bio}
             onChange={(val: string) => setFormData({...formData, bio: val})}
          />

          {/* SOCIALS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Instagram size={10}/> Instagram (URL)</label>
                <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white placeholder-slate-600"
                    value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Send size={10}/> Telegram (URL)</label>
                <input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white placeholder-slate-600"
                    value={formData.telegram} onChange={e => setFormData({...formData, telegram: e.target.value})}
                />
             </div>
          </div>
          
        </form>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex justify-end gap-3 z-10">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Отмена</Button>
            <Button type="submit" onClick={handleSubmit} variant="primary" disabled={isUploading} className="bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.2)]">
              {isUploading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>} 
              Сохранить досье
            </Button>
        </div>

      </div>
    </div>
  );
}