// src/features/admin/components/views/SmmTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Send, Instagram, MessageSquare, Plus, Sparkles, 
  RefreshCw, Save, Image as ImageIcon, Copy, Check,
  FileText, History, Zap, ChevronRight, Layout, Target, Users, ListPlus, Eye, X, Trash2,
  Wand2, ImagePlus, Download
} from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { 
  getSmmSourcesAction, 
  generateSmmContentAction, 
  saveScheduledPostAction,
  getScheduledPostsAction,
  deleteScheduledPostAction,
  freezeAndPublishSmmAction,
  type SmmSource
} from '@/features/admin/actions/smm';

// ✅ ИСПРАВЛЕНИЕ ТИПИЗАЦИИ
interface ActionRes {
  success: boolean;
  data?: any;
  error?: string;
}

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

// ── ШАГИ ВОРОНКИ ПОД НОВЫЕ UI ШАБЛОНЫ ──
const DEFAULT_FUNNEL_STEPS = [
  { id: 'hook', label: 'ОБЛОЖКА (Крючок)', checked: true },
  { id: 'details', label: 'ДЕТАЛИ МАРШРУТА', checked: true },
  { id: 'impressions', label: 'ГЛАВНЫЕ ВПЕЧАТЛЕНИЯ', checked: true },
  { id: 'program', label: 'ПРОГРАММА ТУРА', checked: false },
  { id: 'included', label: 'ЧТО ВКЛЮЧЕНО', checked: false },
  { id: 'cta', label: 'ПРИЗЫВ (CTA)', checked: true },
];

export default function SmmTab() {
  const { showToast } = useToast();
  
  const [viewMode, setViewMode] = useState<'generator' | 'history' | 'studio'>('generator');
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
  
  // ✅ ПРОБЛЕМА 2: Тумблер Карусель/Одиночка
  const [isCarousel, setIsCarousel] = useState(true);
  
  const [funnelSteps, setFunnelSteps] = useState(DEFAULT_FUNNEL_STEPS);
  
  // Результат генерации
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedSlides, setGeneratedSlides] = useState<{title: string, text: string}[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ✅ ПРОБЛЕМА 8: Стейт для Lightbox Истории
  const [previewPost, setPreviewPost] = useState<any>(null);

  // Стейты Нейро-студии
  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioStyle, setStudioStyle] = useState('Cinematic travel photography, hyperrealistic, epic lighting');
  const [studioResultUrl, setStudioResultUrl] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    const [srcRes, histRes] = await Promise.all([
      getSmmSourcesAction(),
      getScheduledPostsAction()
    ]);
    if ((srcRes as ActionRes).success) setSources((srcRes as ActionRes).data || []);
    if ((histRes as ActionRes).success) setHistory((histRes as ActionRes).data || []);
    setIsLoading(false);
  };

  const selectedSource = sources.find(s => s.id === selectedSourceId);

  // Авто-выбор шагов для Афиши
  useEffect(() => {
    if (selectedSource?.type === 'calendar') {
      setFunnelSteps([
        { id: 'hook', label: 'ОБЛОЖКА (Анонс)', checked: true },
        { id: 'afisha', label: 'АФИША НА МЕСЯЦ', checked: true }
      ]);
    } else {
      setFunnelSteps(DEFAULT_FUNNEL_STEPS);
    }
  }, [selectedSourceId]);

  const toggleFunnelStep = (id: string) => {
    setFunnelSteps(prev => prev.map(step => step.id === id ? { ...step, checked: !step.checked } : step));
  };

  // ── ГЕНЕРАЦИЯ ТЕКСТА ──
  const handleGenerate = async () => {
    if (!selectedSourceId) return showToast('Сначала выбери тур или пост', 'error');
    setIsGenerating(true);
    
    // Если одиночка - шлем пустой массив
    const activeSteps = isCarousel ? funnelSteps.filter(s => s.checked).map(s => s.label) : [];

    const res = (await generateSmmContentAction({
      sourceType: selectedSource?.type as any,
      sourceId: selectedSourceId,
      platform,
      tone,
      goal,
      audience,
      steps: activeSteps
    })) as ActionRes;

    if (res.success && res.data) {
      setGeneratedCaption(res.data.caption);
      setGeneratedSlides(res.data.slides || []);
      setHashtags(res.data.hashtags || []);
      showToast('Контент готов! ✨', 'success');
    } else {
      showToast(res.error || 'Ошибка ИИ', 'error');
    }
    setIsGenerating(false);
  };

  // ── ФОРМИРОВАНИЕ ССЫЛКИ НА ВИЗУАЛ (ПРОБЛЕМЫ 1 и 5) ──
  const getOgUrl = (slideIndex: number = 0, slideTitle?: string, slideText?: string) => {
    if (!selectedSource) return '';
    
    // URLSearchParams сам кодирует спецсимволы и эмодзи
    const params = new URLSearchParams({
      format,
      slide: slideIndex.toString(),
      title: selectedSource.title,
      image: selectedSource.image || '',
      categoryColor: selectedSource.categoryColor,
      categoryTitle: selectedSource.categoryTitle || 'ТУР',
      location: selectedSource.location || '',
      duration: selectedSource.duration || '',
      price: selectedSource.price?.toString() || '',
      currency: selectedSource.currency || 'MDL', 
      date: selectedSource.date ? new Date(selectedSource.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '',
    });
    
    if (selectedSource.tags && selectedSource.tags.length > 0) {
      params.append('tags', selectedSource.tags.join(','));
    }
    if (triggerText) params.append('trigger', triggerText);
    if (slideTitle) params.append('slideTitle', slideTitle);
    if (slideText) params.append('slideText', slideText);
    
    return `/api/og?${params.toString()}`;
  };

  const updateSlideText = (index: number, field: 'title' | 'text', value: string) => {
    const newSlides = [...generatedSlides];
    newSlides[index][field] = value;
    setGeneratedSlides(newSlides);
  };
  
  // ── СОХРАНЕНИЕ В ИСТОРИЮ (ПРОБЛЕМА 8: Сохранение массива картинок) ──
  const handleSave = async () => {
    setIsSaving(true);
    
    const imageUrls = [getOgUrl(0)];
    if (isCarousel) {
      generatedSlides.forEach((s, i) => imageUrls.push(getOgUrl(i + 1, s.title, s.text)));
    }

    const res = (await saveScheduledPostAction({
      platform,
      format,
      content: `${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
      imageUrl: imageUrls[0], 
      status: 'draft',
      sourceType: selectedSource?.type || 'custom',
      sourceId: selectedSourceId,
      metadata: { imageUrls } // Сохраняем всю карусель для Lightbox
    })) as ActionRes; 

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
    showToast('Начинаем заморозку цепочки...', 'info');
    
    try {
      const urlsToFreeze = [getOgUrl(0)];
      if (isCarousel) {
        generatedSlides.forEach((slide, idx) => {
           urlsToFreeze.push(getOgUrl(idx + 1, slide.title, slide.text));
        });
      }

      const fullContent = `${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;

      const res = (await freezeAndPublishSmmAction({
        imageUrls: urlsToFreeze,
        content: fullContent,
        platform,
        isPublic: false 
      })) as { success: boolean; permanentUrls?: string[]; error?: string };

      if (res.success) {
         showToast(`Успешно отправлено ${urlsToFreeze.length} картинок в TG!`, 'success');
      } else {
         showToast(`Ошибка: ${res.error}`, 'error');
      }
    } catch (err) {
      showToast('Произошла критическая ошибка', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Точно удалить этот пост из истории?')) return;
    const res = await deleteScheduledPostAction(id) as ActionRes;
    if (res.success) {
      showToast('Пост удален', 'success');
      initData(); // Перезагружаем историю
    } else {
      showToast(res.error || 'Ошибка удаления', 'error');
    }
  };

  // ── ГЕНЕРАЦИЯ КАРТИНКИ (НЕЙРО-СТУДИЯ) ──
  const handleGenerateImage = async () => {
    if (!studioPrompt) return showToast('Опиши, что нужно нарисовать', 'error');
    setIsGeneratingImage(true);
    
    try {
      // Динамически импортируем performAiTask, чтобы не захламлять верхние импорты
      const { performAiTask } = await import('@/features/admin/actions/ai');
      
      const res = await performAiTask({ 
        mode: 'generate_image', 
        prompt: `${studioStyle}. Subject: ${studioPrompt}.` 
      }) as ActionRes;

      if (res.success && res.data) {
        setStudioResultUrl(res.data);
        showToast('Шедевр готов! 🎨', 'success');
      } else {
        showToast(res.error || 'Ошибка DALL-E 3', 'error');
      }
    } catch (e) {
      showToast('Ошибка сети', 'error');
    } finally {
      setIsGeneratingImage(false);
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
          <button onClick={() => setViewMode('studio')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'studio' ? 'bg-white dark:bg-slate-700 shadow-sm text-fuchsia-600' : 'text-slate-700'}`}>
            <Wand2 size={16}/> Нейро-студия
          </button>
        </div>
      </div>

      {/* ── 1. Вкладка ГЕНЕРАТОР ── */}
      {viewMode === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ЛЕВАЯ КОЛОНКА: НАСТРОЙКИ */}
          <div className="lg:col-span-4 space-y-5">
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
                    <option key={s.id} value={s.id}>
                      {s.type === 'calendar' ? '📅' : s.type === 'tour' ? '🏕️' : '📝'} {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* ТУМБЛЕР РЕЖИМА */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Тип публикации</label>
                <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <button onClick={() => setIsCarousel(false)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${!isCarousel ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-500'}`}>Одиночный</button>
                  <button onClick={() => setIsCarousel(true)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${isCarousel ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-500'}`}>Карусель</button>
                </div>
              </div>

              {/* СТРАТЕГИЯ */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Цель поста</label>
                     <select value={goal} onChange={(e) => setGoal(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
                        {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Аудитория</label>
                     <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
                        {AUDIENCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                     </select>
                  </div>
              </div>

              {/* КОНСТРУКТОР ВОРОНКИ */}
              {isCarousel && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-widest flex items-center gap-2 mb-3">
                      <ListPlus size={14}/> Шаги карусели
                    </h4>
                    <div className="space-y-2">
                      {funnelSteps.map(step => (
                        <label key={step.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={step.checked} 
                            onChange={() => toggleFunnelStep(step.id)}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-white border-slate-300"
                          />
                          <span className={`text-xs font-bold ${step.checked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </label>
                      ))}
                    </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Платформа</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => setPlatform(p.id)} className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${platform === p.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700'}`}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Формат картинок</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setFormat('post')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'post' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>📷 Квадрат (1:1)</button>
                  <button onClick={() => setFormat('feed')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'feed' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>🖼️ Лента (4:5)</button>
                  <button onClick={() => setFormat('story')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'story' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>📱 Сториз (9:16)</button>
                  <button onClick={() => setFormat('event')} className={`py-2 px-2 rounded-lg text-xs font-bold border-2 transition-all ${format === 'event' ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-transparent'}`}>📅 FB Event</button>
                </div>
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Триггер (на обложку)</label>
                 <input 
                   type="text" 
                   value={triggerText} 
                   onChange={(e) => setTriggerText(e.target.value)} 
                   placeholder="Напр: Последние 2 места!" 
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white placeholder:text-slate-700 outline-none" 
                 />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !selectedSourceId}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                Сгенерировать сценарий
              </button>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: ПРЕВЬЮ И ПУБЛИКАЦИЯ */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* МОНТАЖНЫЙ СТОЛ (Storyboard) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-700 mb-4 flex items-center gap-2">
                <Layout size={16}/> Монтажный стол (Слайды: {isCarousel ? generatedSlides.length + 1 : 1})
              </h3>
              
              <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
                {/* Главная обложка */}
                <div className="shrink-0 w-64 flex flex-col gap-3 snap-center">
                  <div className={`relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-md ${previewAspectClass}`}>
                    {selectedSourceId ? (
                      <img src={getOgUrl(0)} alt="Cover" className="w-full h-full object-contain bg-[#0f172a]"/>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 opacity-50"><ImageIcon size={32}/></div>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-500">Обложка</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">{selectedSource?.title || 'Выберите тур'}</p>
                  </div>
                </div>

                {/* Сгенерированные слайды (Только если карусель) */}
                {isCarousel && generatedSlides.map((slide, idx) => (
                  <div key={idx} className="shrink-0 w-64 flex flex-col gap-3 snap-center">
                    <div className={`relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-[#0f172a] shadow-md ${previewAspectClass}`}>
                      <img src={getOgUrl(idx + 1, slide.title, slide.text)} alt={`Slide ${idx + 1}`} className="w-full h-full object-contain"/>
                    </div>
                    {/* Поля для ручного редактирования слайда */}
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={slide.title}
                        onChange={(e) => updateSlideText(idx, 'title', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white outline-none"
                        placeholder="ЗАГОЛОВОК ДЛЯ ДИЗАЙНА"
                      />
                      <textarea 
                        value={slide.text}
                        onChange={(e) => updateSlideText(idx, 'text', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white outline-none resize-none"
                        rows={4}
                        placeholder="Текст или Список"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ПОДПИСЬ (CAPTION) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-700">Текст под постом (Caption)</h3>
                {generatedCaption && (
                  <button onClick={() => navigator.clipboard.writeText(`${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`)} className="text-slate-700 hover:text-teal-500 transition-colors">
                    <Copy size={16}/>
                  </button>
                )}
              </div>
              <textarea 
                value={generatedCaption}
                onChange={(e) => setGeneratedCaption(e.target.value)}
                placeholder="Здесь появится основной текст..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-sm leading-relaxed resize-none focus:ring-0 text-slate-900 dark:text-white outline-none font-medium"
                rows={8}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {hashtags.map((tag, i) => (
                  <span key={i} className="text-[11px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ЭКШЕНЫ */}
            {generatedCaption && (
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
      )}

      {/* ── 2. Вкладка ИСТОРИЯ (Компактный реестр) ── */}
      {viewMode === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">Реестр контента</h2>
            <span className="text-xs font-bold text-slate-500">{history.length} записей</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.length > 0 ? history.map((post) => (
              <div key={post.id} className="group flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-700">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} className="w-full h-full object-cover opacity-90" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500"><ImageIcon size={16}/></div>
                  )}
                  <div className={`absolute top-0 right-0 p-1 rounded-bl-lg text-white ${post.platform === 'telegram' ? 'bg-sky-500' : 'bg-pink-500'}`}>
                    {post.platform === 'telegram' ? <Send size={10}/> : <Instagram size={10}/>}
                  </div>
                </div>
                {/* Text & Meta */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {post.format}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 mt-1">
                    {post.content}
                  </p>
                </div>
                {/* Actions */}
                <div className="ml-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { navigator.clipboard.writeText(post.content); showToast('Текст скопирован', 'success'); }} className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 hover:text-teal-600 transition-all" title="Копировать текст">
                    <Copy size={14}/>
                  </button>
                  {post.imageUrl && (
                    <button onClick={() => setPreviewPost(post)} className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 hover:text-teal-600 transition-all" title="Визуал">
                      <Eye size={14}/>
                    </button>
                  )}
                  <button onClick={() => handleDelete(post.id)} className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all" title="Удалить">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <History size={48} className="mb-2"/>
                <p className="font-bold uppercase tracking-widest text-sm">История пуста</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Вкладка НЕЙРО-СТУДИЯ (DALL-E 3) ── */}
      {viewMode === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Панель управления */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border shadow-2xl space-y-8 flex flex-col">
             <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-3 flex items-center gap-2"><Wand2 size={16} className="text-fuchsia-500"/> Что рисуем?</label>
                <textarea 
                  value={studioPrompt} 
                  onChange={(e) => setStudioPrompt(e.target.value)} 
                  placeholder="Например: Счастливая пара плывет на SUP-досках по живописной реке на рассвете, легкий туман..."
                  className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-fuchsia-500/20 text-slate-900 dark:text-white resize-none" 
                />
             </div>

             <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-3">Стиль (Промпт-инъекция)</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setStudioStyle('Cinematic travel photography, hyperrealistic, epic lighting')} className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${studioStyle.includes('Cinematic') ? 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200' : 'bg-slate-50 text-slate-600 border border-transparent'}`}>🎬 Кинематограф (Реализм)</button>
                  <button onClick={() => setStudioStyle('Beautiful watercolor painting, soft colors, artistic')} className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${studioStyle.includes('watercolor') ? 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200' : 'bg-slate-50 text-slate-600 border border-transparent'}`}>🎨 Акварель (Арт)</button>
                  <button onClick={() => setStudioStyle('3D Pixar style animation, vibrant colors, cute')} className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${studioStyle.includes('Pixar') ? 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200' : 'bg-slate-50 text-slate-600 border border-transparent'}`}>🦄 3D Мультфильм</button>
                </div>
             </div>

             <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !studioPrompt}
                className="w-full mt-auto py-5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-fuchsia-500/30 disabled:opacity-50 transition-all"
              >
                {isGeneratingImage ? <RefreshCw className="animate-spin" size={18}/> : <ImagePlus size={18}/>}
                Создать изображение
              </button>
          </div>

          {/* Холст (Результат) */}
          <div className="lg:col-span-8 bg-slate-100 dark:bg-[#020617] border dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-8 min-h-[600px] relative overflow-hidden shadow-inner">
             {isGeneratingImage ? (
               <div className="flex flex-col items-center gap-4 animate-pulse">
                 <Wand2 size={48} className="text-fuchsia-500 animate-bounce"/>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">DALL-E 3 рисует...</p>
               </div>
             ) : studioResultUrl ? (
               <div className="flex flex-col items-center gap-6 w-full h-full">
                 <img src={studioResultUrl} alt="Generated" className="max-h-[500px] w-auto object-contain rounded-2xl shadow-2xl border border-white/10" />
                 <div className="flex gap-4">
                   <button onClick={() => window.open(studioResultUrl, '_blank')} className="px-6 py-3 bg-white dark:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700">
                     <Eye size={16}/> Открыть оригинал
                   </button>
                   <button onClick={() => { navigator.clipboard.writeText(studioResultUrl); showToast('URL скопирован', 'success'); }} className="px-6 py-3 bg-teal-500 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-400">
                     <Copy size={16}/> Копировать URL
                   </button>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-4 opacity-30">
                 <ImagePlus size={64} className="text-slate-400"/>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Холст пуст</p>
               </div>
             )}
          </div>
        </div>
      )}
      
      {/* ✅ ПРОБЛЕМА 8: Модалка просмотра всех картинок (Lightbox) */}
      {previewPost && (
        <div className="fixed inset-0 bg-slate-950/95 z-[100] flex items-center justify-center p-4 md:p-10 backdrop-blur-sm animate-in fade-in duration-200">
           <button onClick={() => setPreviewPost(null)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"><X size={32}/></button>
           
           <div className="flex gap-6 overflow-x-auto w-full max-w-7xl h-full pb-4 custom-scrollbar snap-x snap-mandatory items-center">
              {/* Если есть массив в метаданных, мапим его, иначе только главную */}
              {(previewPost.metadata?.imageUrls || [previewPost.imageUrl]).map((img: string, i: number) => (
                <div key={i} className="shrink-0 h-[80vh] aspect-[4/5] bg-black rounded-3xl overflow-hidden relative snap-center shadow-2xl border border-white/10">
                  <img src={img} className="w-full h-full object-contain" />
                  <div className="absolute top-4 left-4 bg-black/50 text-white/70 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-white/10">Слайд {i+1}</div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}