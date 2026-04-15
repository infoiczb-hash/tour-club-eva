// src/features/admin/components/views/SmmTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Send, Instagram, MessageSquare, Plus, Sparkles, 
  RefreshCw, Save, Image as ImageIcon, Copy, Check,
  FileText, History, Zap, ChevronRight, Layout, Target, Users
} from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { 
  getSmmSourcesAction, 
  generateSmmContentAction, 
  saveScheduledPostAction,
  getScheduledPostsAction,
  freezeAndPublishSmmAction,
  type SmmSource
} from '@/features/admin/actions/smm';

const PLATFORMS = [
  { id: 'telegram', label: 'Telegram', icon: <Send size={16}/>, color: 'bg-sky-500' },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={16}/>, color: 'bg-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: <MessageSquare size={16}/>, color: 'bg-blue-600' },
  { id: 'threads', label: 'Threads', icon: <MessageSquare size={16}/>, color: 'bg-slate-800' },
] as const;

const TONES = [
  { id: 'fun', label: 'Хайп 🔥' },
  { id: 'epic', label: 'Эпик 🏔️' },
  { id: 'sell', label: 'Продажи 💰' },
  { id: 'info', label: 'Инфо 📋' },
] as const;

const GOALS = [
  { id: 'warmup', label: 'Прогрев ☕' },
  { id: 'sell', label: 'Продажа 💰' }
] as const;

const AUDIENCES = [
  { id: 'cold', label: 'Холодная 🧊' },
  { id: 'warm', label: 'Теплая ❤️' }
] as const;

export default function SmmTab() {
  const { showToast } = useToast();
  
  const [viewMode, setViewMode] = useState<'generator' | 'history'>('generator');
  const [sources, setSources] = useState<SmmSource[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Состояние генератора
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]['id']>('instagram');
  const [tone, setTone] = useState<typeof TONES[number]['id']>('sell');
  const [goal, setGoal] = useState<typeof GOALS[number]['id']>('warmup');
  const [audience, setAudience] = useState<typeof AUDIENCES[number]['id']>('warm');
  
  const [format, setFormat] = useState<'post' | 'feed' | 'story' | 'event'>('feed');
  const [triggerText, setTriggerText] = useState('');
  
  // Результат генерации
  const [generatedText, setGeneratedText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    const [srcRes, histRes] = await Promise.all([
      getSmmSourcesAction(),
      getScheduledPostsAction()
    ]);
    if (srcRes.success) setSources(srcRes.data || []);
    if (histRes.success) setHistory(histRes.data || []);
    setIsLoading(false);
  };

  const selectedSource = sources.find(s => s.id === selectedSourceId);

  // ── ГЕНЕРАЦИЯ ТЕКСТА ──
  const handleGenerate = async () => {
    if (!selectedSourceId) return showToast('Сначала выбери тур или пост', 'error');
    setIsGenerating(true);
    
    const res = await generateSmmContentAction({
      sourceType: selectedSource?.type as any,
      sourceId: selectedSourceId,
      platform,
      tone,
      goal,
      audience
    }) as { success: boolean; data?: { text: string; hashtags: string[] }; error?: string };

    if (res.success && res.data) {
      setGeneratedText(res.data.text);
      setHashtags(res.data.hashtags);
      showToast('Текст и теги готовы! ✨', 'success');
    } else {
      showToast(res.error || 'Ошибка ИИ', 'error');
    }
    setIsGenerating(false);
  };

  // ── ФОРМИРОВАНИЕ ССЫЛКИ НА ВИЗУАЛ (С УЧЕТОМ СЛАЙДОВ) ──
  const getOgUrl = (slide: number = 0) => {
    if (!selectedSource) return '';
    const params = new URLSearchParams({
      format,
      slide: slide.toString(),
      title: selectedSource.title,
      image: selectedSource.image || '',
      categoryColor: selectedSource.categoryColor,
      price: selectedSource.price?.toString() || '',
      date: selectedSource.date ? new Date(selectedSource.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '',
    });
    
    if (triggerText) {
      params.append('trigger', triggerText);
    }
    
    return `/api/og?${params.toString()}`;
  };
  
  // ── СОХРАНЕНИЕ В ИСТОРИЮ ──
  const handleSave = async () => {
    setIsSaving(true);
    const res = (await saveScheduledPostAction({
      platform,
      format,
      content: `${generatedText}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
      imageUrl: getOgUrl(0), // Сохраняем обложку для превью
      status: 'draft',
      sourceType: selectedSource?.type || 'custom',
      sourceId: selectedSourceId,
    })) as { success: boolean; error?: string }; 

    if (res.success) {
      showToast('Сохранено в историю', 'success');
      initData();
      setViewMode('history');
    } else {
      showToast(res.error || 'Ошибка при сохранении', 'error');
    }
    setIsSaving(false);
  };

  // ── ЗАМОРОЗКА И ПУБЛИКАЦИЯ В TELEGRAM ──
  const handlePublish = async () => {
    setIsPublishing(true);
    showToast('Начинаем заморозку и генерацию карусели...', 'info');
    
    try {
      const urlsToFreeze = [];

      // Если это Тур, генерируем карусель из 3 слайдов (Обложка, Описание, Что включено)
      if (selectedSource?.type === 'tour') {
         urlsToFreeze.push(getOgUrl(0));
         urlsToFreeze.push(getOgUrl(1));
         urlsToFreeze.push(getOgUrl(2));
      } else {
         urlsToFreeze.push(getOgUrl(0));
      }

      const fullContent = `${generatedText}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;

      // 🔥 ИСПРАВЛЕНИЕ ЗДЕСЬ: Явно указываем тип ответа сервера для TypeScript
      const res = (await freezeAndPublishSmmAction({
        imageUrls: urlsToFreeze,
        content: fullContent,
        platform,
        isPublic: false // Временно отправляем в тестовый админский канал
      })) as { success: boolean; permanentUrls?: string[]; error?: string };

      if (res.success) {
         showToast('Успешно заморожено и опубликовано в TG!', 'success');
      } else {
         showToast(`Ошибка: ${res.error}`, 'error');
      }
    } catch (err) {
      showToast('Произошла критическая ошибка', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const previewAspectClass = 
    format === 'story' ? 'aspect-[9/16]' : 
    format === 'feed'  ? 'aspect-[4/5]' : 
    format === 'event' ? 'aspect-[1.91/1]' : 
    'aspect-square';

  return (
    <div className="space-y-6">
      {/* Переключатель режимов */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('generator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'generator' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-700'}`}
          >
            <Zap size={16}/> Мастерская
          </button>
          <button 
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-700'}`}
          >
            <History size={16}/> История
          </button>
        </div>
      </div>

      {viewMode === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ЛЕВАЯ КОЛОНКА: НАСТРОЙКИ */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Источник контента</label>
                <select 
                  value={selectedSourceId} 
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white"
                >
                  <option value="">Выбери из списка...</option>
                  {sources.map(s => (
                    <option key={s.id} value={s.id}>{s.type === 'tour' ? '🏕️' : '📝'} {s.title}</option>
                  ))}
                </select>
              </div>

              {/* СТРАТЕГИЯ (Goal & Audience) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-slate-700/50">
                  <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-widest flex items-center gap-2">
                    <Target size={12}/> AI Стратегия
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Цель поста</label>
                         <select 
                           value={goal} 
                           onChange={(e) => setGoal(e.target.value as any)} 
                           className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer text-slate-900 dark:text-white"
                         >
                            {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Аудитория</label>
                         <select 
                           value={audience} 
                           onChange={(e) => setAudience(e.target.value as any)} 
                           className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer text-slate-900 dark:text-white"
                         >
                            {AUDIENCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                         </select>
                      </div>
                  </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Платформа</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${platform === p.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700'}`}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Формат креатива</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setFormat('post')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'post' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>📷 Квадрат (1:1)</button>
                  <button onClick={() => setFormat('feed')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'feed' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>🖼️ Лента (4:5)</button>
                  <button onClick={() => setFormat('story')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'story' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>📱 Сториз (9:16)</button>
                  <button onClick={() => setFormat('event')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'event' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>📅 FB Event</button>
                </div>
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Триггер (Яркая плашка на фото)</label>
                 <input 
                   type="text" 
                   value={triggerText} 
                   onChange={(e) => setTriggerText(e.target.value)} 
                   placeholder="Напр: Последние 2 места!" 
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white placeholder:text-slate-700 outline-none" 
                 />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Тональность текста</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setTone(t.id)}
                      className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${tone === t.id ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !selectedSourceId}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                Генерировать контент
              </button>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: ПРЕВЬЮ И ПУБЛИКАЦИЯ */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* ТЕКСТ */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-700">Текст поста</h3>
                  {generatedText && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(`${generatedText}\n\n${hashtags.map(h => `#${h}`).join(' ')}`)} 
                      className="text-slate-700 hover:text-teal-500 transition-colors"
                    >
                      <Copy size={16}/>
                    </button>
                  )}
                </div>
                <textarea 
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  placeholder="Здесь появится текст от AI..."
                  className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-sm leading-relaxed resize-none focus:ring-0 text-slate-900 dark:text-white outline-none"
                  rows={12}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {hashtags.map((tag, i) => (
                    <span key={i} className="text-[11px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* ВИЗУАЛ (API OG) */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-700">Превью обложки</h3>
                <div className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-xl transition-all duration-300 ${previewAspectClass}`}>
                  {selectedSourceId ? (
                    <img 
                      key={getOgUrl(0)} 
                      src={getOgUrl(0)} 
                      alt="Preview" 
                      className="w-full h-full object-contain bg-[#0f172a]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                      <ImageIcon size={48} strokeWidth={1}/>
                      <p className="text-xs font-bold mt-2">Выберите тур для превью</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ЭКШЕНЫ СОХРАНЕНИЯ */}
            {generatedText && (
              <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || isPublishing} 
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} В черновики
                </button>
                <button 
                  onClick={handlePublish} 
                  disabled={isSaving || isPublishing} 
                  className="flex-1 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all"
                >
                  {isPublishing ? <RefreshCw className="animate-spin" size={16}/> : <Send size={16}/>} Заморозить и в TG
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* РЕЕСТР ИСТОРИИ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {history.length > 0 ? history.map(post => (
            <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col">
              {post.imageUrl && (
                <div className="relative h-40 overflow-hidden bg-[#0f172a] shrink-0">
                  <img src={post.imageUrl} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700">
                    {post.platform} • {post.format}
                  </span>
                  <span className="text-[10px] text-slate-700">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-700 line-clamp-3 leading-relaxed flex-1">
                  {post.content}
                </p>
                <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800 mt-auto">
                   <button 
                     onClick={() => navigator.clipboard.writeText(post.content)} 
                     className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-teal-50 text-slate-800 dark:text-slate-700 hover:text-teal-600 transition-colors"
                   >
                     <Copy size={12}/> Текст
                   </button>
                   {post.imageUrl && (
                     <a 
                       href={post.imageUrl} 
                       target="_blank" 
                       rel="noreferrer"
                       className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-teal-50 text-slate-800 dark:text-slate-700 hover:text-teal-600 transition-colors"
                     >
                       <ImageIcon size={12}/> Визуал
                     </a>
                   )}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-30">
              <History size={48} className="mx-auto mb-2"/>
              <p className="font-bold">История пуста</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}