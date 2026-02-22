"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Loader2, Sparkles, Wand2, Link as LinkIcon, Mail, Phone, Instagram, Send } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { uploadImage } from '@/lib/api'; // Наша функция загрузки
import { performAiTask } from '@/features/admin/actions/ai'; // AI для текстов

interface Props {
  slug: string; // 'hero' или 'footer'
  initialContent: any;
  onClose: () => void;
  onSubmit: (slug: string, data: any) => Promise<void>;
}

export default function ContentForm({ slug, initialContent, onClose, onSubmit }: Props) {
  const [data, setData] = useState<any>({});
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

  const handleChange = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
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
  const handleAiImprove = async (field: string) => {
      if (!data[field]) return;
      setAiLoading(true);
      const res = await performAiTask({ mode: 'improve_text', text: data[field], tone: 'selling' });
      setAiLoading(false);
      if (res.success) handleChange(field, res.data as string);
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
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Настройка контента сайта</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400"><X size={20}/></button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* === HERO SECTION === */}
          {slug === 'hero' && (
            <div className="space-y-4">
              {/* Заголовок с AI */}
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Заголовок (H1)</label>
                    <button type="button" onClick={() => handleAiImprove('title')} disabled={aiLoading || !data.title} className="text-[10px] text-violet-600 hover:text-violet-700 flex items-center gap-1 font-bold disabled:opacity-50">
                        {aiLoading ? <Loader2 size={10} className="animate-spin"/> : <Wand2 size={10}/>} AI Rewrite
                    </button>
                </div>
                <input className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-sm font-bold dark:text-white"
                    value={data.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Главный слоган..."
                />
              </div>

              {/* Подзаголовок */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Подзаголовок</label>
                <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-sm dark:text-white h-20 resize-none"
                    value={data.subtitle || ''} onChange={e => handleChange('subtitle', e.target.value)} placeholder="Описание..."
                />
              </div>

              {/* ФОН (Картинка) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Фоновое изображение</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors relative group">
                    {data.bg_image ? (
                        <div className="relative h-32 rounded-lg overflow-hidden">
                            <img src={data.bg_image} className="w-full h-full object-cover" alt="Hero BG" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs font-bold">Нажми, чтобы заменить</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-slate-400">
                            <Upload className="mx-auto mb-2 opacity-50"/>
                            <span className="text-xs font-bold">Загрузить фото</span>
                        </div>
                    )}
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/*" />
                </div>
                {/* Fallback input */}
                <input className="w-full mt-2 p-2 text-xs bg-transparent border-b border-slate-200 dark:border-slate-800 outline-none text-slate-500"
                    placeholder="Или ссылка на картинку..." value={data.bg_image || ''} onChange={e => handleChange('bg_image', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* === FOOTER SECTION === */}
          {slug === 'footer' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Mail size={10}/> Email</label>
                    <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                        value={data.email || ''} onChange={e => handleChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Phone size={10}/> Телефон</label>
                    <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                        value={data.phone || ''} onChange={e => handleChange('phone', e.target.value)}
                    />
                  </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Instagram size={10}/> Instagram (ссылка)</label>
                <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    value={data.instagram || ''} onChange={e => handleChange('instagram', e.target.value)} placeholder="https://instagram.com/..."
                />
              </div>
               <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Send size={10}/> Telegram (ссылка)</label>
                <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    value={data.telegram || ''} onChange={e => handleChange('telegram', e.target.value)} placeholder="https://t.me/..."
                />
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving || uploading}>Отмена</Button>
            <Button type="submit" variant="primary" disabled={isSaving || uploading}>
                {isSaving || uploading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>} 
                Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}