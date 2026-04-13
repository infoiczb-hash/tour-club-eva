"use client";

import React, { useState } from 'react';
import { 
  X, Save, Sparkles, Loader2, Wand2, 
  Instagram, Send, Upload, User, 
  Camera, Plus, Trash2, Zap, Flame, Utensils, Activity, Heart, Compass
} from 'lucide-react';
import Button from '@/shared/ui/Button';
import { performAiTask } from '@/features/admin/actions/ai';
import { uploadImage } from '@/lib/api';

// Словарь иконок для статов
const ICONS: Record<string, React.ElementType> = {
  Zap, Flame, Utensils, Activity, Heart, Compass, Sparkles
};

// === СТРОГАЯ ТИПИЗАЦИЯ ===
interface RichTextareaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  height?: string;
}

interface StatItem {
  label: string;
  value: number;
  icon: string;
}

interface GuideFormData {
  id?: string;
  name: string;
  slug: string;
  role: string;
  image: string | null;
  actionImage: string | null;
  bio: string | null;
  fullBio: string | null;
  experience: string | null;
  superpower: string | null;
  achievements: string[] | string;
  tags: string[] | string;
  quotes: string[] | string;
  instagram: string | null;
  telegram: string | null;
  contact: string | null;
  order: number;
  isActive: boolean;
  stats: string | StatItem[];
}

interface GuideFormProps {
  initialData?: Partial<GuideFormData> | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

// === КОМПОНЕНТЫ ===

const RichTextarea = ({ label, value, onChange, placeholder, height = "h-32" }: RichTextareaProps) => {
    const [aiLoading, setAiLoading] = useState(false);
  
    const handleAiImprove = async () => {
      if (!value || value.length < 3) return alert('Напишите хоть пару слов!');
      setAiLoading(true);
      try {
        const res = await performAiTask({ mode: 'improve_text', text: value, tone: 'selling' });
        if(res.success && typeof res.data === 'string') onChange(res.data);
      } catch (e) { 
        console.error(e); 
      } finally { 
        setAiLoading(false); 
      }
    };
  
    return (
      <div className="space-y-2 group">
         <div className="flex justify-between items-end">
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-800 ml-1">{label}</label>
            <button type="button" onClick={handleAiImprove} disabled={aiLoading} className="text-[12px] flex items-center gap-1 text-teal-600 hover:text-teal-400 disabled:opacity-50 transition-colors bg-teal-950/30 px-2 py-1 rounded-md border border-teal-900/50">
                {aiLoading ? <Loader2 className="animate-spin" size={10}/> : <Wand2 size={10}/>}
                <span>AI Rewrite</span>
            </button>
         </div>
         <textarea 
            className={`w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-800 placeholder:text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all resize-none ${height}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
         />
      </div>
    );
};

export default function GuideForm({ initialData, onClose, onSubmit }: GuideFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  
  // Умный парсинг JSON со статами, если они пришли строкой
  const parseStats = (stats: unknown): StatItem[] => {
      if (!stats) return [];
      if (typeof stats === 'string') {
        try {
          return JSON.parse(stats);
        } catch {
          return [];
        }
      }
      if (Array.isArray(stats)) return stats as StatItem[];
      return [];
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    role: initialData?.role || 'Гид',
    image: initialData?.image || '',
    actionImage: initialData?.actionImage || '', 
    bio: initialData?.bio || '',
    fullBio: initialData?.fullBio || '',
    experience: initialData?.experience || '',   
    superpower: initialData?.superpower || '',   
    achievements: Array.isArray(initialData?.achievements) ? initialData.achievements.join(', ') : (initialData?.achievements || ''), 
    tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags || ''), 
    quotes: Array.isArray(initialData?.quotes) ? initialData.quotes.join('\n') : (initialData?.quotes || ''), 
    instagram: initialData?.instagram || '', 
    telegram: initialData?.telegram || '', 
    contact: initialData?.contact || '',
    order: initialData?.order || 0,
    isActive: initialData?.isActive ?? true,
    stats: parseStats(initialData?.stats)
  });

  const handleStatChange = (index: number, field: keyof StatItem, value: string | number) => {
      const newStats = [...formData.stats];
      newStats[index] = { ...newStats[index], [field]: value };
      setFormData({ ...formData, stats: newStats });
  };

  const addStat = () => {
      setFormData({ ...formData, stats: [...formData.stats, { label: 'Новый навык', value: 50, icon: 'Zap' }] });
  };

  const removeStat = (index: number) => {
      const newStats = [...formData.stats];
      newStats.splice(index, 1);
      setFormData({ ...formData, stats: newStats });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
        const payload: Record<string, unknown> = {
            ...formData,
            image: formData.image || null,
            actionImage: formData.actionImage || null,
            achievements: formData.achievements.split(',').map((s: string) => s.trim()).filter(Boolean),
            tags: formData.tags.split(',').map((s: string) => s.trim()).filter(Boolean),
            quotes: formData.quotes.split('\n').map((s: string) => s.trim()).filter(Boolean),
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
    } finally { setLoadingField(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="bg-slate-950 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] border border-slate-800 relative overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"/>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {initialData ? 'Редактировать досье' : 'Новый оперативник'}
              </h2>
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-2 rounded-xl transition text-slate-800"><X size={24}/></button>
        </div>

        <form id="guide-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-8 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* ФОТОГРАФИИ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <User size={12}/> Портрет (Сетка 3:4)
                </label>
                <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-800 relative group overflow-hidden bg-slate-900 hover:border-teal-500/50 transition-colors">
                    {formData.image ? <img src={formData.image} className="w-full h-full object-cover" alt="Portrait"/> : <div className="w-full h-full flex items-center justify-center text-slate-700 flex-col gap-2"><User size={40} strokeWidth={1}/><span className="text-xs">Загрузить аватарку</span></div>}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
                       {loadingField === 'image' ? <Loader2 className="animate-spin text-teal-500"/> : <Upload className="text-white"/>}
                    </div>
                    <input type="file" onChange={(e) => handleFile(e, 'image')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-800 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <Camera size={12}/> Экшен (Широкое фото для SEO)
                </label>
                <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-800 relative group overflow-hidden bg-slate-900 hover:border-teal-500/50 transition-colors">
                    {formData.actionImage ? <img src={formData.actionImage} className="w-full h-full object-cover" alt="Action"/> : <div className="w-full h-full flex items-center justify-center text-slate-700 flex-col gap-2"><Camera size={40} strokeWidth={1}/><span className="text-xs">Загрузить фото в деле</span></div>}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
                       {loadingField === 'actionImage' ? <Loader2 className="animate-spin text-teal-500"/> : <Upload className="text-white"/>}
                    </div>
                    <input type="file" onChange={(e) => handleFile(e, 'actionImage')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
             </div>
          </div>

          <div className="h-px bg-slate-800 w-full" />

          {/* ОСНОВНАЯ ИНФО */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-1">
                <label className="block text-[12px] font-bold text-slate-800 uppercase ml-1">Имя Фамилия</label>
                <input required className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm font-bold text-white transition-colors"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Роман Санду"
                />
             </div>
             <div className="space-y-1">
                <label className="block text-[12px] font-bold text-slate-800 uppercase ml-1 text-teal-500">SEO Slug (Ссылка)</label>
                <input required className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-teal-400 transition-colors"
                    value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="roman-sandu"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <div className="space-y-1">
                <label className="block text-[12px] font-bold text-slate-800 uppercase ml-1">Роль (Бейдж)</label>
                <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Основатель"/>
             </div>
             <div className="space-y-1">
                <label className="block text-[12px] font-bold text-slate-800 uppercase ml-1 flex items-center gap-1"><Sparkles size={10} className="text-amber-400"/> Суперсила</label>
                <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white" value={formData.superpower} onChange={e => setFormData({...formData, superpower: e.target.value})} placeholder="Специалист по кухне"/>
             </div>
             <div className="space-y-1">
                <label className="block text-[12px] font-bold text-slate-800 uppercase ml-1">Порядок сортировки</label>
                <input type="number" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-teal-500 text-sm text-white" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}/>
             </div>
          </div>

          {/* 🔥 RPG STATS BUILDER 🔥 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
             <div className="flex justify-between items-center">
                 <label className="text-[12px] font-bold text-white uppercase flex items-center gap-2"><Zap className="text-amber-400" size={16}/> Характеристики (RPG Stats)</label>
                 <Button type="button" onClick={addStat} variant="secondary" className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700">
                    <Plus size={14} className="mr-1"/> Добавить навык
                 </Button>
             </div>
             
             {formData.stats.length === 0 && <p className="text-xs text-slate-800">Нет характеристик. Добавьте "Выносливость", "Кулинария" и т.д.</p>}

             <div className="space-y-3">
                 {formData.stats.map((stat: StatItem, i: number) => (
                    <div key={i} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                       <input 
                         className="flex-1 min-w-[120px] p-2 bg-slate-900 border border-slate-700 rounded-lg outline-none text-sm text-white focus:border-teal-500"
                         value={stat.label} onChange={(e) => handleStatChange(i, 'label', e.target.value)} placeholder="Название (напр. Харизма)"
                       />
                       <select 
                         className="p-2 bg-slate-900 border border-slate-700 rounded-lg outline-none text-sm text-white focus:border-teal-500"
                         value={stat.icon} onChange={(e) => handleStatChange(i, 'icon', e.target.value)}
                       >
                         {Object.keys(ICONS).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                       </select>
                       <div className="flex items-center gap-3 w-full md:w-1/3">
                          <input type="range" min="0" max="100" value={stat.value} onChange={(e) => handleStatChange(i, 'value', parseInt(e.target.value))} className="w-full accent-teal-500"/>
                          <span className="text-xs font-mono font-bold text-teal-400 w-8">{stat.value}%</span>
                       </div>
                       <button type="button" onClick={() => removeStat(i)} className="p-2 text-slate-800 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                       </button>
                    </div>
                 ))}
             </div>
          </div>

          {/* ТЕКСТЫ */}
          <div className="space-y-1">
             <label className="block text-[12px] font-bold text-slate-800 uppercase ml-1">Теги-фишки (через запятую)</label>
             <input className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none text-sm text-white" value={formData.tags as string} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="играет на гитаре, воспитывает черепаху"/>
          </div>

          <RichTextarea label="Превью для карточки (Коротко)" placeholder="2-3 предложения для сетки..." value={formData.bio || ''} onChange={(val: string) => setFormData({...formData, bio: val})} height="h-24" />
          <RichTextarea label="Полная биография (Для SEO-страницы)" placeholder="Развернутая история..." value={formData.fullBio || ''} onChange={(val: string) => setFormData({...formData, fullBio: val})} height="h-40" />
          
          <div className="space-y-1">
             <label className="block text-[12px] font-bold text-slate-800 uppercase ml-1">Цитаты гида (каждая с новой строки)</label>
             <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-800 h-28" value={formData.quotes as string} onChange={e => setFormData({...formData, quotes: e.target.value})} placeholder="«Горы не покоряют, в них гостят»"/>
          </div>

          <label className="flex items-center gap-3 p-4 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/50 transition">
             <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-teal-500 rounded bg-slate-800 border-slate-700"/>
             <span className="text-sm font-bold text-white">Гид активен (Показывать на сайте)</span>
          </label>

        </form>

       <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex justify-end gap-3 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Отмена</Button>
           <Button type="submit" form="guide-form" variant="primary" disabled={isUploading} className="bg-teal-600 hover:bg-teal-500 text-white">
              {isUploading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>} Сохранить досье
            </Button>
        </div>

      </div>
    </div>
  );
}