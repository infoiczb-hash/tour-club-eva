"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Loader2, Sparkles, Wand2, Link as LinkIcon, Mail, Phone, Instagram, Send } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { uploadImage } from '@/lib/api'; 
import { performAiTask } from '@/features/admin/actions/ai';

// === СТРОГАЯ ТИПИЗАЦИЯ ===
export interface ContentData {
  title?: string;
  subtitle?: string;
  bg_image?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  telegram?: string;
  // Индексная сигнатура на случай расширения других текстовых блоков
  [key: string]: string | undefined; 
}

interface Props {
  slug: string; // 'hero' или 'footer'
  initialContent: ContentData | null;
  onClose: () => void;
  onSubmit: (slug: string, data: ContentData) => Promise<void>;
}

export default function ContentForm({ slug, initialContent, onClose, onSubmit }: Props) {
  const [data, setData] = useState<ContentData>({});
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setData(initialContent || {});
  }, [initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSubmit(slug, data);
    setIsSaving(false);
    onClose();
  };

  const handleChange = (field: keyof ContentData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // 🖼️ ЗАГРУЗКА ФОНА
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
        const url = await uploadImage(file);
        if (url) handleChange('bg_image', url);
        else alert("Ошибка загрузки");
    } catch (e) { alert("Ошибка"); } 
    finally { setUploading(false); }
  };

  // 🪄 AI УЛУЧШЕНИЕ ЗАГОЛОВКА
  const handleAiImprove = async (field: keyof ContentData) => {
      const textToImprove = data[field];
      if (!textToImprove) return;
      
      setAiLoading(true);
      const res = await performAiTask({ mode: 'improve_text', text: textToImprove, tone: 'selling' });
      setAiLoading(false);
      
      if (res.success && typeof res.data === 'string') {
        handleChange(field, res.data);
      }
  };

  const getTitle = () => {
    if (slug === 'hero') return '🏠 Главный экран';
    if (slug === 'footer') return '📞 Контакты и подвал';
    return 'Редактирование';
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur rounded-t-2xl">
          <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {slug === 'hero' ? <Sparkles className="text-yellow-500" size={20}/> : <LinkIcon className="text-blue-500" size={20}/>}
                  {getTitle()}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Настройка контента сайта</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400"><X size={20}/></button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* === HERO SECTION === */}
          {slug === 'hero' && (
            <div className="space-y-4">
              {/* Заголовок с AI */}
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Заголовок (H1)</label>
                    <button type="button" onClick={() => handleAiImprove('title')} disabled={aiLoading || !data.title} className="text-[10px] text-violet-600 hover:text-violet-700 flex items-center gap-1 font-bold disabled:opacity-50 transition-colors">
                        {aiLoading ? <Loader2 size={10} className="animate-spin"/> : <Wand2 size={10}/>} AI Rewrite
                    </button>
                </div>
                <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-sm font-bold dark:text-white transition-all"
                    value={data.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Главный слоган..."
                />
              </div>

              {/* Подзаголовок */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Подзаголовок</label>
                <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-sm dark:text-white h-20 resize-none transition-all"
                    value={data.subtitle || ''} onChange={e => handleChange('subtitle', e.target.value)} placeholder="Описание..."
                />
              </div>

              {/* ФОН (Картинка) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Фоновое изображение</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors relative group overflow-hidden">
                    {data.bg_image ? (
                        <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={data.bg_image} className="w-full h-full object-cover" alt="Hero BG" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <p className="text-white text-xs font-bold">Нажми, чтобы заменить</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-slate-400 flex flex-col items-center">
                            {uploading ? <Loader2 className="animate-spin mb-2" size={24} /> : <Upload className="mb-2 opacity-50" size={24} />}
                            <span className="text-xs font-bold uppercase tracking-widest">{uploading ? 'Загрузка...' : 'Загрузить фото'}</span>
                        </div>
                    )}
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/*" disabled={uploading} />
                </div>
                {/* Fallback input */}
                <input className="w-full mt-2 p-2 text-xs bg-transparent border-b border-slate-200 dark:border-slate-800 outline-none text-slate-400 focus:border-violet-500 transition-colors"
                    placeholder="Или вставьте прямую ссылку на картинку..." value={data.bg_image || ''} onChange={e => handleChange('bg_image', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* === FOOTER SECTION === */}
          {slug === 'footer' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1 tracking-wider"><Mail size={12}/> Email</label>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                        value={data.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="info@evatur.club"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1 tracking-wider"><Phone size={12}/> Телефон</label>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                        value={data.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder="+373 777 00000"
                    />
                  </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1 tracking-wider"><Instagram size={12}/> Instagram (ссылка)</label>
                <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                    value={data.instagram || ''} onChange={e => handleChange('instagram', e.target.value)} placeholder="https://instagram.com/..."
                />
              </div>
               <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1 tracking-wider"><Send size={12}/> Telegram (ссылка)</label>
                <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                    value={data.telegram || ''} onChange={e => handleChange('telegram', e.target.value)} placeholder="https://t.me/..."
                />
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving || uploading}>Отмена</Button>
            <Button type="submit" variant="primary" disabled={isSaving || uploading} className="bg-violet-600 hover:bg-violet-700 text-white min-w-[140px]">
                {isSaving || uploading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>} 
                Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}