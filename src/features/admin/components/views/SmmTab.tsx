// src/features/admin/components/views/SmmTab.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Instagram,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Save,
  Image as ImageIcon,
  Copy,
  History,
  Zap,
  Layout,
  Trash2,
  Eye,
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Target,
  FileText,
  Users
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

// --- ТИПЫ ДЛЯ ТИПИЗАЦИИ ОТВЕТОВ (Исправление ошибки unknown) ---
interface ActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  permanentUrls?: string[];
}

const PLATFORMS = [
  { id: 'telegram', label: 'Telegram', icon: <Send size={16} />, color: 'bg-sky-500' },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={16} />, color: 'bg-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: <MessageSquare size={16} />, color: 'bg-blue-600' },
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

const DEFAULT_FUNNEL = [
  { id: 'hook', label: 'Крючок/Боль', checked: true },
  { id: 'details', label: 'Детали тура', checked: true },
  { id: 'price', label: 'Цены и Билеты', checked: false },
  { id: 'cta', label: 'Призыв к действию', checked: true },
];

export default function SmmTab() {
  const { showToast } = useToast();

  // --- СОСТОЯНИЕ ДАННЫХ ---
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
  const [isCarousel, setIsCarousel] = useState(true);
  const [funnelSteps, setFunnelSteps] = useState(DEFAULT_FUNNEL);
  const [triggerText, setTriggerText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // --- РЕЗУЛЬТАТЫ ---
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedSlides, setGeneratedSlides] = useState<{ title: string; text: string }[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);

  // --- ПРОЦЕССЫ ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- МОДАЛКА (LIGHTBOX) ---
  const [previewPost, setPreviewPost] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [srcRes, histRes] = (await Promise.all([
        getSmmSourcesAction(),
        getScheduledPostsAction()
      ])) as ActionResponse[];

      if (srcRes.success) setSources(srcRes.data || []);
      if (histRes.success) setHistory(histRes.data || []);
    } catch (err) {
      showToast('Ошибка при загрузке данных', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSource = useMemo(() => 
    sources.find(s => s.id === selectedSourceId), 
  [sources, selectedSourceId]);

  // --- БЕЗОПАСНЫЙ ГЕНЕРАТОР URL (Проблема 1, 3, 5) ---
  const getOgUrl = (index: number, slideTitle?: string, slideText?: string) => {
    if (!selectedSource) return '';
    
    const params = new URLSearchParams();
    params.append('format', format);
    params.append('slide', index.toString());
    params.append('title', selectedSource.title);
    params.append('image', selectedSource.image || '');
    params.append('categoryColor', selectedSource.categoryColor);
    params.append('categoryTitle', selectedSource.categoryTitle || 'ТУР');
    params.append('location', selectedSource.location || '');
    params.append('duration', selectedSource.duration || '');
    params.append('tags', (selectedSource.tags || []).join(','));
    params.append('price', selectedSource.price?.toString() || '');
    params.append('currency', selectedSource.currency || 'RUB');
    
    if (selectedSource.date) {
      const dateStr = new Date(selectedSource.date).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short' 
      });
      params.append('date', dateStr);
    }

    if (triggerText) params.append('trigger', triggerText);
    if (slideTitle) params.append('slideTitle', slideTitle);
    if (slideText) params.append('slideText', slideText);

    return `/api/og?${params.toString()}`;
  };

  const handleGenerate = async () => {
    if (!selectedSourceId) return showToast('Сначала выбери источник контента', 'error');
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
      })) as ActionResponse;

      if (res.success && res.data) {
        setGeneratedCaption(res.data.caption);
        setGeneratedSlides(res.data.slides || []);
        setHashtags(res.data.hashtags || []);
        showToast('ИИ подготовил контент! ✨', 'success');
      } else {
        showToast(res.error || 'Ошибка генерации', 'error');
      }
    } catch (err) {
      showToast('Критическая ошибка ИИ', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // П8: Сохраняем массив всех картинок в метаданные
      const allImages = [
        getOgUrl(0), 
        ...generatedSlides.map((s, i) => getOgUrl(i + 1, s.title, s.text))
      ];

      const res = (await saveScheduledPostAction({
        platform,
        format,
        content: `${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
        imageUrl: allImages[0],
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledFor: scheduledAt || null,
        sourceType: selectedSource?.type || 'custom',
        sourceId: selectedSourceId,
        metadata: { imageUrls: allImages }
      })) as ActionResponse;

      if (res.success) {
        showToast(scheduledAt ? 'Пост запланирован' : 'Сохранено в черновики', 'success');
        loadData();
        setViewMode('history');
      }
    } catch (err) {
      showToast('Не удалось сохранить', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      const allImages = [
        getOgUrl(0), 
        ...generatedSlides.map((s, i) => getOgUrl(i + 1, s.title, s.text))
      ];

      const res = (await freezeAndPublishSmmAction({
        imageUrls: allImages,
        content: `${generatedCaption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
        platform,
        isPublic: false
      })) as ActionResponse;

      if (res.success) {
        showToast('Цепочка отправлена в Telegram! 🚀', 'success');
      } else {
        showToast(res.error || 'Ошибка публикации', 'error');
      }
    } catch (err) {
      showToast('Ошибка связи с сервером', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleFunnelStep = (id: string) => {
    setFunnelSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  return (
    <div className="space-y-6">
      {/* ─── ВЕРХНЯЯ ПАНЕЛЬ НАВИГАЦИИ ─── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('generator')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'generator' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap size={14} /> Мастерская
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'history' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History size={14} /> История
          </button>
        </div>
        <div className="hidden md:flex px-4 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">
            SMM Engine Gold 2026
          </span>
        </div>
      </div>

      {viewMode === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ─── ЛЕВАЯ ПАНЕЛЬ: НАСТРОЙКИ ─── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
              {/* Источник */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Источник контента
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 rounded-2xl px-4 py-4 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white"
                >
                  <option value="">Выберите из базы данных...</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.type === 'tour' ? '🏕️' : '📝'} {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Переключатель режима */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Тип публикации
                </label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    onClick={() => setIsCarousel(false)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      !isCarousel ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Одиночный
                  </button>
                  <button
                    onClick={() => setIsCarousel(true)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isCarousel ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Карусель
                  </button>
                </div>
              </div>

              {/* Стратегия */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Target size={10} /> Цель
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {GOALS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Users size={10} /> Аудитория
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Конструктор воронки (только для карусели) */}
              {isCarousel && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                    <ListPlus size={14} /> Стуктура карусели
                  </h4>
                  <div className="space-y-2">
                    {funnelSteps.map((step) => (
                      <label
                        key={step.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={step.checked}
                          onChange={() => toggleFunnelStep(step.id)}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-white border-slate-300"
                        />
                        <span
                          className={`text-xs font-bold ${
                            step.checked ? 'text-slate-900 dark:text-white' : 'text-slate-500'
                          }`}
                        >
                          {step.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Платформы и Форматы */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Платформа
                  </label>
                  <div className="space-y-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                          platform === p.id
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                            : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Размер
                  </label>
                  <div className="space-y-2">
                    {['post', 'feed', 'story'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f as any)}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                          format === f
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                            : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {f === 'post' ? 'Квадрат' : f === 'feed' ? 'Лента' : 'Сториз'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Триггер */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Хайп-триггер
                </label>
                <input
                  type="text"
                  value={triggerText}
                  onChange={(e) => setTriggerText(e.target.value)}
                  placeholder="Осталось 3 места!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-rose-500 rounded-2xl px-4 py-4 text-sm font-black uppercase outline-none text-rose-600 transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedSourceId}
                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl shadow-teal-500/30 transition-all disabled:opacity-50 active:scale-95"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Сгенерировать сценарий
              </button>
            </div>
          </div>

          {/* ─── ПРАВАЯ ПАНЕЛЬ: МОНТАЖНЫЙ СТОЛ ─── */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Layout size={16} /> Монтажный стол
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 uppercase">
                    {format} • {isCarousel ? `${generatedSlides.length + 1} слайдов` : '1 слайд'}
                  </span>
                </div>
              </div>

              <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar snap-x snap-mandatory">
                {/* 1. ОБЛОЖКА */}
                <div className="shrink-0 w-80 flex flex-col gap-4 snap-start">
                  <div
                    className={`relative w-full overflow-hidden rounded-2xl border-4 border-slate-50 dark:border-slate-800 bg-[#0f172a] shadow-xl ${
                      format === 'story' ? 'aspect-[9/16]' : format === 'feed' ? 'aspect-[4/5]' : 'aspect-square'
                    }`}
                  >
                    {selectedSourceId ? (
                      <img
                        src={getOgUrl(0)}
                        alt="Preview Cover"
                        className="w-full h-full object-cover transition-opacity duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                        <ImageIcon size={48} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                    <span className="text-[9px] font-black uppercase text-teal-600 tracking-widest">
                      Слайд 1 (Обложка)
                    </span>
                  </div>
                </div>

                {/* 2. ТЕКСТОВЫЕ СЛАЙДЫ */}
                {isCarousel &&
                  generatedSlides.map((slide, idx) => (
                    <div key={idx} className="shrink-0 w-80 flex flex-col gap-4 snap-start">
                      <div
                        className={`relative w-full overflow-hidden rounded-2xl border-4 border-slate-50 dark:border-slate-800 bg-[#0f172a] shadow-xl ${
                          format === 'story' ? 'aspect-[9/16]' : format === 'feed' ? 'aspect-[4/5]' : 'aspect-square'
                        }`}
                      >
                        <img
                          src={getOgUrl(idx + 1, slide.title, slide.text)}
                          alt={`Slide ${idx + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const newS = [...generatedSlides];
                            newS[idx].title = e.target.value;
                            setGeneratedSlides(newS);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white"
                          placeholder="Заголовок слайда"
                        />
                        <textarea
                          value={slide.text}
                          onChange={(e) => {
                            const newS = [...generatedSlides];
                            newS[idx].text = e.target.value;
                            setGeneratedSlides(newS);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs font-bold leading-relaxed outline-none focus:ring-2 focus:ring-teal-500/20 resize-none text-slate-800 dark:text-slate-200"
                          rows={3}
                          placeholder="Текст слайда"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* ТЕКСТ ПОСТА */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Подпись к публикации (Caption)
                </h3>
                {generatedCaption && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${generatedCaption}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`);
                      showToast('Скопировано в буфер', 'success');
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              <textarea
                value={generatedCaption}
                onChange={(e) => setGeneratedCaption(e.target.value)}
                placeholder="Здесь появится сгенерированный текст..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-medium leading-[1.8] resize-none focus:ring-0 outline-none h-64 custom-scrollbar text-slate-900 dark:text-slate-100"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ДЕЙСТВИЯ */}
            {generatedCaption && (
              <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 flex flex-col gap-6 shadow-2xl">
                {/* ПЛАНИРОВЩИК (Вектор 2) */}
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white/10 dark:bg-slate-100 p-4 rounded-2xl border border-white/10 dark:border-slate-200">
                  <div className="flex items-center gap-3 shrink-0">
                    <CalendarIcon size={20} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white dark:text-slate-900">
                      Запланировать:
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white dark:text-slate-900 font-bold text-sm outline-none cursor-pointer"
                  />
                  {scheduledAt && (
                    <button
                      onClick={() => setScheduledAt('')}
                      className="text-white/40 hover:text-white dark:text-slate-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white dark:text-slate-900 dark:bg-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    {scheduledAt ? 'Запланировать пост' : 'Сохранить черновик'}
                  </button>
                  <button
                    onClick={handlePublishNow}
                    disabled={isPublishing}
                    className="flex-1 py-5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-teal-500/20"
                  >
                    {isPublishing ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                    Заморозить и в Telegram
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── ПАНЕЛЬ ИСТОРИИ (Проблема 8) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {history.length > 0 ? (
            history.map((post) => (
              <div
                key={post.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col border-b-4 border-b-transparent hover:border-b-teal-500"
              >
                <div className="relative aspect-[4/5] bg-slate-900 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

                  {/* Значки статуса */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${
                        post.platform === 'instagram' ? 'bg-pink-500' : 'bg-sky-500'
                      }`}
                    >
                      {post.platform}
                    </span>
                    {post.status === 'scheduled' && (
                      <span className="px-3 py-1 bg-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-950 shadow-lg">
                        Запланирован
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-4">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed italic">
                    "{post.content.substring(0, 180)}..."
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-black border-t border-slate-50 dark:border-slate-800 pt-5 mt-auto">
                    <div className="flex items-center gap-2 text-slate-400 uppercase tracking-tighter">
                      <History size={12} /> {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewPost(post)}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-teal-500 hover:text-white rounded-xl transition-all text-slate-500"
                        title="Просмотр всей карусели"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-xl transition-all text-slate-500"
                        title="Удалить из базы"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center opacity-20">
              <History size={80} className="mx-auto mb-6" strokeWidth={1} />
              <p className="font-black uppercase tracking-[0.4em] text-sm">История пуста</p>
            </div>
          )}
        </div>
      )}

      {/* ─── ПОЛНОЭКРАННАЯ МОДАЛКА (LIGHTBOX ДЛЯ П8) ─── */}
      {previewPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 md:p-10 animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setPreviewPost(null)}
            className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shadow-2xl z-[110]"
          >
            <X size={28} />
          </button>

          <div className="w-full max-w-7xl h-full flex flex-col gap-10">
            <div className="flex-1 flex overflow-x-auto gap-8 custom-scrollbar snap-x snap-mandatory items-center px-4">
              {/* Рендерим все картинки из метаданных или одну основную */}
              {(previewPost.metadata?.imageUrls || [previewPost.imageUrl]).map((img: string, i: number) => (
                <div
                  key={i}
                  className="shrink-0 h-[75vh] aspect-[4/5] bg-slate-900 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] snap-center border-4 border-white/5"
                >
                  <img src={img} alt={`Slide ${i + 1}`} className="w-full h-full object-contain" />
                  <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white/50 text-[10px] font-black uppercase tracking-widest">
                    Slide {i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] max-w-3xl mx-auto shadow-2xl">
              <h4 className="text-[10px] font-black uppercase text-teal-400 mb-4 tracking-[0.3em] flex items-center gap-2">
                <FileText size={14} /> Текст публикации
              </h4>
              <p className="text-white/90 text-sm leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-medium whitespace-pre-line">
                {previewPost.content}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
        .whitespace-pre-line {
          white-space: pre-line;
        }
      `}</style>
    </div>
  );
}