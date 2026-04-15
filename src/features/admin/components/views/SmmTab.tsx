// src/features/admin/components/views/SmmTab.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Instagram,
  MessageSquare,
  Plus,
  Sparkles,
  RefreshCw,
  Save,
  Image as ImageIcon,
  Copy,
  Check,
  FileText,
  History,
  Zap,
  ChevronRight,
  Layout,
  Target,
  Users,
  ListPlus,
  Trash2,
  Eye,
  X,
  Calendar as CalendarIcon,
  ChevronLeft
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

// ✅ ТИПИЗАЦИЯ ДЛЯ УСТРАНЕНИЯ ОШИБКИ UNKNOWN
interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  permanentUrls?: string[];
}

const PLATFORMS = [
  { id: 'telegram', label: 'Telegram', icon: <Send size={16} />, color: 'bg-sky-500' },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={16} />, color: 'bg-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: <MessageSquare size={16} />, color: 'bg-blue-600' },
  { id: 'threads', label: 'Threads', icon: <MessageSquare size={16} />, color: 'bg-slate-800' },
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

const DEFAULT_FUNNEL_STEPS = [
  { id: 'hook', label: 'Крючок (Боль/Интрига)', checked: true },
  { id: 'solution', label: 'Суть предложения', checked: true },
  { id: 'emotion', label: 'Эмоция / Атмосфера', checked: true },
  { id: 'details', label: 'Детали маршрута', checked: false },
  { id: 'price', label: 'Цены и Билеты', checked: false },
  { id: 'cta', label: 'Призыв к действию (CTA)', checked: true },
];

export default function SmmTab() {
  const { showToast } = useToast();

  // --- СОСТОЯНИЕ ИНТЕРФЕЙСА ---
  const [viewMode, setViewMode] = useState<'generator' | 'history'>('generator');
  const [sources, setSources] = useState<SmmSource[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- СОСТОЯНИЕ ГЕНЕРАТОРА ---
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]['id']>('instagram');
  const [tone, setTone] = useState<typeof TONES[number]['id']>('sell');
  const [goal, setGoal] = useState<typeof GOALS[number]['id']>('warmup');
  const [audience, setAudience] = useState<typeof AUDIENCES[number]['id']>('warm');
  const [format, setFormat] = useState<'post' | 'feed' | 'story' | 'event'>('feed');
  const [triggerText, setTriggerText] = useState('');
  const [isCarousel, setIsCarousel] = useState(true); // Режим "Одиночка vs Карусель" (П2)
  const [scheduledAt, setScheduledAt] = useState(''); // Планировщик (V2)

  // --- КОНСТРУКТОР ВОРОНКИ ---
  const [funnelSteps, setFunnelSteps] = useState(DEFAULT_FUNNEL_STEPS);

  // --- РЕЗУЛЬТАТЫ ГЕНЕРАЦИИ ---
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedSlides, setGeneratedSlides] = useState<{ title: string; text: string }[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);

  // --- ПРОЦЕССЫ ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- МОДАЛКА ПРОСМОТРА (П8) ---
  const [previewPost, setPreviewPost] = useState<any>(null);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    try {
      const srcRes = (await getSmmSourcesAction()) as ActionResult;
      const histRes = (await getScheduledPostsAction()) as ActionResult;
      
      if (srcRes.success) setSources(srcRes.data || []);
      if (histRes.success) setHistory(histRes.data || []);
    } catch (e) {
      showToast('Ошибка загрузки данных', 'error');
    }
    setIsLoading(false);
  };

  const selectedSource = useMemo(() => 
    sources.find(s => s.id === selectedSourceId), 
  [sources, selectedSourceId]);

  // --- БЕЗОПАСНЫЙ ГЕНЕРАТОР URL (П1, П3, П5) ---
  const getOgUrl = (index: number, slideTitle?: string, slideText?: string) => {
    if (!selectedSource) return '';
    
    const query = new URLSearchParams();
    query.append('format', format);
    query.append('slide', index.toString());
    query.append('title', selectedSource.title);
    query.append('image', selectedSource.image || '');
    query.append('categoryColor', selectedSource.categoryColor);
    query.append('categoryTitle', selectedSource.categoryTitle || 'ТУР');
    query.append('location', selectedSource.location || '');
    query.append('duration', selectedSource.duration || '');
    query.append('tags', (selectedSource.tags || []).join(','));
    query.append('price', selectedSource.price?.toString() || '');
    query.append('currency', selectedSource.currency || 'RUB');
    
    if (selectedSource.date) {
      const d = new Date(selectedSource.date);
      const dateFormatted = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      query.append('date', dateFormatted);
    }

    if (triggerText) query.append('trigger', triggerText);
    if (slideTitle) query.append('slideTitle', slideTitle);
    if (slideText) query.append('slideText', slideText);

    return `/api/og?${query.toString()}`;
  };

  const handleGenerate = async () => {
    if (!selectedSourceId) return showToast('Сначала выбери тур или пост', 'error');
    setIsGenerating(true);

    try {
      const activeSteps = isCarousel 
        ? funnelSteps.filter(s => s.checked).map(s => s.label) 
        : [];

      const res = (await generateSmmContentAction({
        sourceType: selectedSource?.type as any,
        sourceId: selectedSourceId,
        platform,
        tone,
        goal,
        audience,
        steps: activeSteps
      })) as ActionResult;

      if (res.success && res.data) {
        setGeneratedCaption(res.data.caption);
        setGeneratedSlides(res.data.slides || []);
        setHashtags(res.data.hashtags || []);
        showToast('Контент-план готов! ✨', 'success');
      } else {
        showToast(res.error || 'Ошибка ИИ', 'error');
      }
    } catch (e) {
      showToast('Ошибка при генерации', 'error');
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Сохраняем массив всех ссылок в метаданные для истории (П8)
      const imageUrls = [getOgUrl(0)];
      if (isCarousel) {
        generatedSlides.forEach((s, i) => imageUrls.push(getOgUrl(i + 1, s.title, s.text)));
      }

      const res = (await saveScheduledPostAction({
        platform,
        format,
        content: `${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
        imageUrl: imageUrls[0], // Обложка для превью
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledFor: scheduledAt || null,
        sourceType: selectedSource?.type || 'custom',
        sourceId: selectedSourceId,
        metadata: { imageUrls } // П8: Сохраняем всю карусель
      })) as ActionResult;

      if (res.success) {
        showToast(scheduledAt ? 'Пост запланирован!' : 'Сохранено в черновики', 'success');
        initData();
        setViewMode('history');
      }
    } catch (e) {
      showToast('Ошибка при сохранении', 'error');
    }
    setIsSaving(false);
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      const imageUrls = [getOgUrl(0)];
      if (isCarousel) {
        generatedSlides.forEach((s, i) => imageUrls.push(getOgUrl(i + 1, s.title, s.text)));
      }

      const res = (await freezeAndPublishSmmAction({
        imageUrls,
        content: `${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
        platform,
        isPublic: false
      })) as ActionResult;

      if (res.success) {
        showToast('Отправлено в Telegram! 🚀', 'success');
      } else {
        showToast(res.error || 'Ошибка публикации', 'error');
      }
    } catch (e) {
      showToast('Критическая ошибка публикации', 'error');
    }
    setIsPublishing(false);
  };

  const toggleFunnelStep = (id: string) => {
    setFunnelSteps(prev => prev.map(step => step.id === id ? { ...step, checked: !step.checked } : step));
  };

  const previewAspectClass = 
    format === 'story' ? 'aspect-[9/16]' : 
    format === 'feed'  ? 'aspect-[4/5]' : 
    'aspect-square';

  return (
    <div className="space-y-6">
      {/* ─── НАВИГАЦИЯ ─── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('generator')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'generator' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap size={14} /> Мастерская
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'history' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History size={14} /> История
          </button>
        </div>
        <div className="hidden md:flex px-4 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">
            SMM Engine v3.0 Gold
          </span>
        </div>
      </div>

      {viewMode === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ─── ЛЕВАЯ КОЛОНКА: ПАРАМЕТРЫ ─── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
              
              {/* Источник */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Источник данных
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 rounded-2xl px-4 py-4 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white"
                >
                  <option value="">Выберите тур или статью...</option>
                  {sources.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.type === 'tour' ? '🏕️' : '📝'} {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Переключатель Одиночка/Карусель (П2) */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Тип контента
                </label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    onClick={() => setIsCarousel(false)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      !isCarousel ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Одиночный пост
                  </button>
                  <button
                    onClick={() => setIsCarousel(true)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isCarousel ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Карусель (Multi)
                  </button>
                </div>
              </div>

              {/* Воронка (только если карусель) */}
              {isCarousel && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                    <ListPlus size={14} /> Структура карусели
                  </h4>
                  <div className="space-y-2">
                    {funnelSteps.map(step => (
                      <label
                        key={step.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={step.checked}
                          onChange={() => toggleFunnelStep(step.id)}
                          className="w-4.5 h-4.5 rounded text-teal-600 focus:ring-teal-500 bg-white border-slate-300 shadow-sm"
                        />
                        <span className={`text-xs font-bold ${step.checked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                          {step.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Стратегия */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Target size={12} /> Цель
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={12} /> ЦА
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {AUDIENCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Формат и Платформа */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Платформа</label>
                  <div className="space-y-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                          platform === p.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Размер</label>
                  <div className="space-y-2">
                    {['post', 'feed', 'story'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f as any)}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                          format === f ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {f === 'post' ? '1:1' : f === 'feed' ? '4:5' : '9:16'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Хайп-триггер (П5: Безопасен) */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Хайп-триггер (на обложку)
                </label>
                <input
                  type="text"
                  value={triggerText}
                  onChange={(e) => setTriggerText(e.target.value)}
                  placeholder="Осталось 5 мест!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-rose-500 rounded-2xl px-4 py-4 text-sm font-black uppercase outline-none text-rose-600 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedSourceId}
                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl shadow-teal-500/30 transition-all disabled:opacity-50 active:scale-95"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Сгенерировать контент
              </button>
            </div>
          </div>

          {/* ─── ПРАВАЯ КОЛОНКА: МОНТАЖНЫЙ СТОЛ ─── */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Layout size={16} /> Storyboard
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-slate-600 uppercase tracking-tighter shadow-sm border border-slate-200 dark:border-slate-700">
                  {isCarousel ? `${generatedSlides.length + 1} слайдов` : 'Одиночный пост'}
                </span>
              </div>

              <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar snap-x snap-mandatory">
                {/* ОБЛОЖКА (СЛАЙД 0) */}
                <div className="shrink-0 w-80 flex flex-col gap-5 snap-start">
                  <div className={`relative w-full overflow-hidden rounded-3xl border-4 border-slate-50 dark:border-slate-800 bg-[#0f172a] shadow-2xl ${previewAspectClass}`}>
                    {selectedSourceId ? (
                      <img
                        src={getOgUrl(0)}
                        alt="Preview"
                        className="w-full h-full object-cover transition-opacity duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 opacity-20">
                        <ImageIcon size={64} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                    <span className="text-[9px] font-black uppercase text-teal-600 tracking-widest">
                      Слайд 1 (Обложка)
                    </span>
                  </div>
                </div>

                {/* КОНТЕНТНЫЕ СЛАЙДЫ (ПРАВКА ТЕКСТА НА ЛЕТУ) */}
                {isCarousel && generatedSlides.map((slide, idx) => (
                  <div key={idx} className="shrink-0 w-80 flex flex-col gap-5 snap-start">
                    <div className={`relative w-full overflow-hidden rounded-3xl border-4 border-slate-50 dark:border-slate-800 bg-[#0f172a] shadow-2xl ${previewAspectClass}`}>
                      <img
                        src={getOgUrl(idx + 1, slide.title, slide.text)}
                        alt={`Slide ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const newS = [...generatedSlides];
                          newS[idx].title = e.target.value;
                          setGeneratedSlides(newS);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white"
                        placeholder="Заголовок..."
                      />
                      <textarea
                        value={slide.text}
                        onChange={(e) => {
                          const newS = [...generatedSlides];
                          newS[idx].text = e.target.value;
                          setGeneratedSlides(newS);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold leading-relaxed outline-none focus:ring-2 focus:ring-teal-500/20 resize-none text-slate-800 dark:text-slate-200"
                        rows={3}
                        placeholder="Текст слайда..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CAPTION (П4: АБЗАЦЫ) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Текст публикации (Caption)
                </h3>
                {generatedCaption && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`);
                      showToast('Текст скопирован!', 'success');
                    }}
                    className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                  >
                    <Copy size={18} />
                  </button>
                )}
              </div>
              <textarea
                value={generatedCaption}
                onChange={(e) => setGeneratedCaption(e.target.value)}
                placeholder="Здесь появится сгенерированная ИИ подпись..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 text-sm font-medium leading-[1.8] resize-none focus:ring-0 outline-none h-72 custom-scrollbar text-slate-900 dark:text-slate-100"
              />
              <div className="mt-5 flex flex-wrap gap-2.5">
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ДЕЙСТВИЯ (V2: ПЛАНИРОВЩИК) */}
            {generatedCaption && (
              <div className="bg-slate-900 dark:bg-white rounded-[2.5rem] p-7 flex flex-col gap-7 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
                
                {/* ВЕКТОР 2: ВЫБОР ВРЕМЕНИ */}
                <div className="flex flex-col md:flex-row items-center gap-5 bg-white/10 dark:bg-slate-100 p-5 rounded-2xl border border-white/10 dark:border-slate-200">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <CalendarIcon size={24} className="text-amber-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 dark:text-slate-400">Публикация:</span>
                      <span className="text-xs font-bold text-white dark:text-slate-900">Выбери время</span>
                    </div>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="flex-1 bg-white/5 dark:bg-white border-none text-white dark:text-slate-900 font-bold text-sm outline-none cursor-pointer p-2 rounded-lg"
                  />
                  {scheduledAt && (
                    <button onClick={() => setScheduledAt('')} className="text-white/40 hover:text-white dark:text-slate-400 p-2">
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white dark:text-slate-900 dark:bg-slate-100 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    {scheduledAt ? 'Запланировать' : 'В черновики'}
                  </button>
                  <button
                    onClick={handlePublishNow}
                    disabled={isPublishing}
                    className="flex-1 py-5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-teal-500/30 active:scale-95 disabled:opacity-50"
                  >
                    {isPublishing ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                    Заморозить и в TG
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── ПАНЕЛЬ ИСТОРИИ (П8: CRUD + LIGHTBOX) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {history.length > 0 ? (
            history.map((post) => (
              <div
                key={post.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col"
              >
                <div className="relative aspect-[4/5] bg-slate-900 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[1.5s]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />

                  {/* Значки платформы */}
                  <div className="absolute top-5 left-5 flex flex-col gap-3">
                    <span
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-2xl ${
                        post.platform === 'instagram' ? 'bg-pink-500' : 'bg-sky-500'
                      }`}
                    >
                      {post.platform}
                    </span>
                    {post.status === 'scheduled' && (
                      <span className="px-4 py-1.5 bg-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-950 shadow-2xl animate-pulse">
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-5">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed italic opacity-80">
                    "{post.content.substring(0, 200)}..."
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-black border-t border-slate-100 dark:border-slate-800 pt-6 mt-auto">
                    <div className="flex items-center gap-2.5 text-slate-400 uppercase tracking-tighter">
                      <History size={14} /> {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPreviewPost(post)}
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-teal-500 hover:text-white rounded-2xl transition-all text-slate-500 shadow-sm"
                        title="Просмотр карусели"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-2xl transition-all text-slate-500 shadow-sm"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-48 text-center opacity-10">
              <History size={100} className="mx-auto mb-8" strokeWidth={1} />
              <p className="font-black uppercase tracking-[0.5em] text-sm">Архив пуст</p>
            </div>
          )}
        </div>
      )}

      {/* ─── ПОЛНОЭКРАННАЯ МОДАЛКА (LIGHTBOX П8) ─── */}
      {previewPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-6 md:p-12 animate-in fade-in zoom-in-95 duration-300">
          <button
            onClick={() => setPreviewPost(null)}
            className="absolute top-10 right-10 p-5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all shadow-2xl z-[110] border border-white/10"
          >
            <X size={32} />
          </button>

          <div className="w-full max-w-7xl h-full flex flex-col gap-12">
            <div className="flex-1 flex overflow-x-auto gap-10 custom-scrollbar snap-x snap-mandatory items-center px-10">
              {/* П8: Рендерим всю цепочку карусели из метаданных */}
              {(previewPost.metadata?.imageUrls || [previewPost.imageUrl]).map((img: string, i: number) => (
                <div
                  key={i}
                  className="shrink-0 h-[78vh] aspect-[4/5] bg-black rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] snap-center border-8 border-white/5 relative group"
                >
                  <img src={img} alt={`Slide ${i + 1}`} className="w-full h-full object-contain" />
                  <div className="absolute top-8 right-8 px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-2xl text-white/40 text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">
                    Slide {i + 1}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] max-w-4xl mx-auto shadow-2xl flex flex-col gap-5">
              <div className="flex items-center gap-3 text-teal-400">
                <FileText size={20} />
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em]">Copywriting & Tags</h4>
              </div>
              <p className="text-white/90 text-sm leading-[1.8] max-h-56 overflow-y-auto custom-scrollbar font-medium whitespace-pre-line pr-4">
                {previewPost.content}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .whitespace-pre-line { white-space: pre-line; }
      `}</style>
    </div>
  );
}