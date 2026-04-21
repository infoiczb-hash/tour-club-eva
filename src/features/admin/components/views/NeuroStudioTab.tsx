"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Download,
  Trash2,
  BookmarkPlus,
  Image as ImageIcon,
  Zap,
  ZapOff,
  Copy,
  Check,
  History,
  X,
  Layers,
  Database,
  PenLine,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { performAiTask, type PerformAiTaskResult } from '@/features/admin/actions/ai';
import { getSmmSourcesAction, type SmmSource } from '@/features/admin/actions/smm';
import {
  getAiPromptsAction,
  saveAiPromptAction,
  deleteAiPromptAction,
} from '@/features/admin/actions/ai-prompts';
import { clsx } from 'clsx';

// ============================================================================
// ТИПЫ (улучшены и расширены)
// ============================================================================

interface AiPrompt {
  id: string;
  title: string;
  prompt: string;
  createdAt?: Date | string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: ImageModel;
  sourceTitle?: string;
  createdAt: Date;
}

type ImageModel = 'flux-schnell' | 'flux-dev' | 'dalle3';
type SourceMode = 'manual' | 'slug';
type SlugType = 'tour' | 'blog';
type ViewMode = 'studio' | 'library';
type StylePreset = (typeof STYLE_PRESETS)[number]['id'];

// Тип для вызова performAiTask — убрали "as any"
interface GenerateImagePayload {
  mode: 'generate_image';
  prompt: string;
  engine: ImageModel;
  enhance: boolean;
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const IMAGE_MODELS: ReadonlyArray<{
  id: ImageModel;
  label: string;
  sub: string;
}> = [
  { id: 'flux-schnell', label: '⚡ Flux Schnell', sub: 'Быстро · Пейзажи · Фотореализм' },
  { id: 'flux-dev', label: '🔥 Flux Dev', sub: 'Качество · Детали · Сложные арты' },
  { id: 'dalle3', label: '🔵 DALL·E 3', sub: 'Иллюстрации · Текст в кадре' },
] as const;

const STYLE_PRESETS = [
  { id: 'photo', label: '📷 Фото', hint: 'hyperrealistic photography, 8k, natural light, sharp focus' },
  { id: 'cinematic', label: '🎬 Кино', hint: 'cinematic shot, dramatic lighting, anamorphic lens, film grain' },
  { id: 'watercolor', label: '🎨 Акварель', hint: 'watercolor painting, soft edges, artistic brushstrokes, paper texture' },
  { id: 'epic', label: '🏔️ Эпик', hint: 'epic landscape, golden hour, volumetric light, ultra wide angle' },
  { id: 'pixar', label: '🦄 3D', hint: '3D Pixar style, vibrant colors, cute characters, studio lighting' },
  { id: 'minimal', label: '⬜ Минимал', hint: 'minimalist composition, clean, flat lay, white background' },
] as const;

const PROMPT_EXAMPLES = [
  'Туристы на SUP-досках на закате реки Днестр',
  'Семья у горного костра, золотой час, осень',
  'Медведь с рюкзаком ест зефир в Карпатах',
  'Дети на каяках, солнечный день, смех и брызги',
] as const;

// ============================================================================
// ХЕЛПЕРЫ
// ============================================================================

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function buildPromptFromSource(source: SmmSource, style: StylePreset): string {
  const hint = STYLE_PRESETS.find((s) => s.id === style)?.hint ?? '';
  if (source.type === 'tour') {
    const location = source.location || 'scenic nature';
    const tags = source.tags?.slice(0, 2).join(', ') || 'outdoor adventure';
    return `tourists on ${tags} in ${location}, active lifestyle, nature, ${hint}`.trim();
  }
  if (source.type === 'blog') {
    return `travel blog illustration for "${source.title}", outdoor adventure, nature, ${hint}`.trim();
  }
  return `tourism events, active outdoor lifestyle, nature and adventure, ${hint}`.trim();
}

// ============================================================================
// SUB-КОМПОНЕНТ: карточка изображения (React.memo + улучшенная доступность)
// ============================================================================

const ImageCard = React.memo(
  ({
    image,
    onDelete,
    onSavePrompt,
  }: {
    image: GeneratedImage;
    onDelete: (id: string) => void;
    onSavePrompt: (image: GeneratedImage) => void;
  }) => {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const modelMeta = IMAGE_MODELS.find((m) => m.id === image.model);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(image.prompt);
        setCopied(true);
        showToast('Промпт скопирован', 'success');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        showToast('Не удалось скопировать', 'error');
      }
    }, [image.prompt, showToast]);

    return (
      <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <RefreshCw size={24} className="text-slate-400 animate-spin" />
            </div>
          )}
          <img
            src={image.url}
            alt={image.prompt}
            onLoad={() => setLoaded(true)}
            className={clsx(
              'w-full h-full object-cover transition-all duration-500 group-hover:scale-105',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Оверлей */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
              <a
                href={image.url}
                download={`neuro-${image.id}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-white/30 transition-all"
                aria-label="Скачать изображение"
              >
                <Download size={11} /> Скачать
              </a>
              <button
                onClick={() => onSavePrompt(image)}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/80 backdrop-blur-sm text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-teal-500 transition-all"
                aria-label="Сохранить промпт"
              >
                <BookmarkPlus size={11} /> Сохранить
              </button>
              <button
                onClick={() => onDelete(image.id)}
                className="ml-auto p-2 bg-red-500/60 backdrop-blur-sm text-white rounded-xl hover:bg-red-500/80 transition-all"
                aria-label="Удалить изображение"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>

          {/* Бейджи */}
          {modelMeta && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-slate-900/70 backdrop-blur-sm text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                {modelMeta.label.split(' ').slice(0, 2).join(' ')}
              </span>
            </div>
          )}
          {image.sourceTitle && (
            <div className="absolute top-3 left-3 max-w-[55%]">
              <span className="block px-2 py-1 bg-teal-500/80 backdrop-blur-sm text-white rounded-lg text-[8px] font-black uppercase tracking-widest truncate">
                📌 {image.sourceTitle}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {image.prompt}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-slate-400 font-mono">
              {image.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[9px] font-bold text-slate-500 hover:text-teal-600 transition-colors"
              aria-label="Копировать промпт"
            >
              {copied ? <Check size={10} className="text-teal-500" /> : <Copy size={10} />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ImageCard.displayName = 'ImageCard';

// ============================================================================
// SUB-КОМПОНЕНТ: модалка сохранения промпта (улучшена доступность + фокус)
// ============================================================================

function SavePromptModal({
  image,
  onSave,
  onClose,
}: {
  image: GeneratedImage;
  onSave: (title: string, prompt: string) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    await onSave(title.trim(), image.prompt);
    setIsSaving(false);
  }, [title, image.prompt, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
          aria-label="Закрыть модальное окно"
        >
          <X size={18} />
        </button>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-6">
          Сохранить в библиотеку
        </h3>
        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-100">
          <img src={image.url} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              Название
            </label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Например: SUP закат осень Днестр"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              Промпт
            </label>
            <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 line-clamp-3">
              {image.prompt}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Сохраняем...
              </>
            ) : (
              <>
                <BookmarkPlus size={14} />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ГЛАВНЫЙ КОМПОНЕНТ (рефакторинг + улучшения)
// ============================================================================

export default function NeuroStudioTab() {
  const { showToast } = useToast();

  // ── Состояние ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('studio');
  const [sourceMode, setSourceMode] = useState<SourceMode>('manual');
  const [slugType, setSlugType] = useState<SlugType>('tour');
  const [slugId, setSlugId] = useState('');
  const [sources, setSources] = useState<SmmSource[]>([]);
  const [loadingSrc, setLoadingSrc] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ImageModel>('flux-schnell');
  const [style, setStyle] = useState<StylePreset>('photo');
  const [groqEnhance, setGroqEnhance] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [saveTarget, setSaveTarget] = useState<GeneratedImage | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<AiPrompt[]>([]);
  const [loadingPr, setLoadingPr] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const galleryRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Загрузка данных ───────────────────────────────────────────────────────
  const loadSources = useCallback(async () => {
    setLoadingSrc(true);
    try {
      const res = (await getSmmSourcesAction()) as { success: boolean; data?: SmmSource[] };
      if (res.success) setSources(res.data ?? []);
    } finally {
      setLoadingSrc(false);
    }
  }, []);

  const loadPrompts = useCallback(async () => {
    setLoadingPr(true);
    try {
      const res = (await getAiPromptsAction()) as { success: boolean; data?: AiPrompt[] };
      if (res.success) setSavedPrompts(res.data ?? []);
    } finally {
      setLoadingPr(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
    loadPrompts();
  }, [loadSources, loadPrompts]);

  // Авто-ресайз textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [prompt]);

  // ── Логика источников ─────────────────────────────────────────────────────
  const handleSlugSelect = useCallback(
    (id: string) => {
      setSlugId(id);
      if (!id) return;
      const source = sources.find((s) => s.id === id);
      if (!source) return;
      setPrompt(buildPromptFromSource(source, style));
      showToast(`Промпт собран из «${source.title}»`, 'success');
    },
    [sources, style, showToast]
  );

  const handleStyleChange = useCallback(
    (s: StylePreset) => {
      setStyle(s);
      if (sourceMode === 'slug' && slugId) {
        const source = sources.find((x) => x.id === slugId);
        if (source) setPrompt(buildPromptFromSource(source, s));
      }
    },
    [sourceMode, slugId, sources]
  );

  // ── Генерация изображения (типы + убрали все "as any" кроме самого узкого места) ───────────────────────────────
  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      showToast('Опиши идею или выбери источник из базы', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const hint = STYLE_PRESETS.find((s) => s.id === style)?.hint ?? '';
      const finalPrompt = hint ? `${trimmed}. ${hint}` : trimmed;

      const payload: GenerateImagePayload = {
        mode: 'generate_image',
        prompt: finalPrompt,
        engine: model,
        enhance: groqEnhance,
      };

      // Самое узкое место — только здесь приходится кастовать,
      // потому что тип action'а ещё не обновлён под новые модели
      const res = (await performAiTask(payload as any)) as PerformAiTaskResult;

      if (!res.success) {
        // Безопасно достаём ошибку (тип PerformAiTaskResult, скорее всего, union)
        const errorMsg = 'error' in res ? res.error : 'Ошибка генерации';
        showToast(errorMsg, 'error');
        return;
      }

      if (res.mode !== 'generate_image' || !res.data) {
        showToast('Неожиданный ответ сервера', 'error');
        return;
      }

      const newImg: GeneratedImage = {
        id: genId(),
        url: res.data,
        prompt: trimmed,
        model,
        sourceTitle: sourceMode === 'slug' ? sources.find((s) => s.id === slugId)?.title : undefined,
        createdAt: new Date(),
      };

      setGallery((prev) => [newImg, ...prev]);
      showToast('Готово! ✨', 'success');

      // Прокрутка к галерее
      setTimeout(() => {
        galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch {
      showToast('Сетевая ошибка. Попробуй ещё раз.', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, model, groqEnhance, sourceMode, slugId, sources, showToast]);

  // ── Работа с библиотекой ──────────────────────────────────────────────────
  const handleSavePrompt = useCallback(
    async (title: string, promptText: string) => {
      const res = (await saveAiPromptAction(title, promptText)) as { success: boolean; error?: string };
      if (res.success) {
        showToast('Сохранено в библиотеку 📚', 'success');
        setSaveTarget(null);
        await loadPrompts();
      } else {
        showToast(res.error || 'Ошибка сохранения', 'error');
      }
    },
    [loadPrompts, showToast]
  );

  const handleDeletePrompt = useCallback(
    async (id: string) => {
      const res = (await deleteAiPromptAction(id)) as { success: boolean; error?: string };
      if (res.success) {
        setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirm(null);
        showToast('Удалено', 'success');
      } else {
        showToast(res.error || 'Ошибка удаления', 'error');
      }
    },
    [showToast]
  );

  const applyPrompt = useCallback(
    (p: AiPrompt) => {
      setPrompt(p.prompt);
      setSourceMode('manual');
      setViewMode('studio');
      showToast('Промпт загружен в студию', 'success');
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
    [showToast]
  );

  // Мемоизированный список моделей (чтобы не пересоздавался)
  const renderedModels = useMemo(
    () =>
      IMAGE_MODELS.map((m) => (
        <button
          key={m.id}
          onClick={() => setModel(m.id)}
          className={clsx(
            'w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all',
            model === m.id
              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
              : 'border-transparent bg-slate-100 dark:bg-slate-800 hover:border-slate-200'
          )}
        >
          <div className="text-left">
            <div
              className={clsx(
                'text-[10px] font-black',
                model === m.id ? 'text-teal-600' : 'text-slate-700 dark:text-slate-300'
              )}
            >
              {m.label}
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5">{m.sub}</div>
          </div>
          {model === m.id && <CheckCircle2 size={14} className="text-teal-500 shrink-0" />}
        </button>
      )),
    [model]
  );

  // ── РЕНДЕР ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Подвкладки */}
      <div className="flex items-center gap-2">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
          {[
            { id: 'studio' as ViewMode, icon: <Wand2 size={13} />, label: 'Студия' },
            { id: 'library' as ViewMode, icon: <History size={13} />, label: 'Библиотека' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                viewMode === tab.id
                  ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.icon} {tab.label}
              {tab.id === 'library' && savedPrompts.length > 0 && (
                <span className="bg-teal-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {savedPrompts.length > 9 ? '9+' : savedPrompts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {gallery.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Layers size={13} className="text-teal-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {gallery.length} арт{gallery.length > 4 ? 'ов' : gallery.length > 1 ? 'а' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ══ СТУДИЯ ══ */}
      {viewMode === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Левая панель */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
              {/* 1. Источник */}
              <section>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[8px]">
                    1
                  </span>
                  Источник идеи
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                  <button
                    onClick={() => {
                      setSourceMode('manual');
                      setSlugId('');
                    }}
                    className={clsx(
                      'flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                      sourceMode === 'manual'
                        ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                        : 'text-slate-500'
                    )}
                  >
                    <PenLine size={11} /> Из головы
                  </button>
                  <button
                    onClick={() => setSourceMode('slug')}
                    className={clsx(
                      'flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                      sourceMode === 'slug'
                        ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                        : 'text-slate-500'
                    )}
                  >
                    <Database size={11} /> Из базы
                  </button>
                </div>

                {sourceMode === 'slug' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      {(['tour', 'blog'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setSlugType(t);
                            setSlugId('');
                          }}
                          className={clsx(
                            'py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all',
                            slugType === t
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                              : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500'
                          )}
                        >
                          {t === 'tour' ? '🏕️ Тур' : '📝 Блог'}
                        </button>
                      ))}
                    </div>

                    {loadingSrc ? (
                      <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
                    ) : (
                      <select
                        value={slugId}
                        onChange={(e) => handleSlugSelect(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="">Выбрать из базы...</option>
                        {sources.filter((s) => s.type === slugType).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    )}

                    {slugId && (
                      <p className="text-[9px] text-teal-600 font-bold px-1 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Промпт собран — можешь отредактировать ниже
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* 2. Модель */}
              <section>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[8px]">
                    2
                  </span>
                  Модель генерации
                </label>
                <div className="space-y-2">{renderedModels}</div>
                {model === 'dalle3' && (
                  <p className="text-[9px] text-amber-500 font-bold px-2 mt-3">⚠️ Требует OPENAI_API_KEY в .env</p>
                )}
              </section>

              {/* 3. Стиль */}
              <section>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[8px]">
                    3
                  </span>
                  Стиль изображения
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_PRESETS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStyleChange(s.id)}
                      className={clsx(
                        'px-3 py-2 rounded-xl text-[10px] font-black border-2 transition-all',
                        style === s.id
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                          : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 hover:border-slate-200'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* 4. Улучшатель */}
              <section>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[8px]">
                    4
                  </span>
                  AI-улучшатель промпта
                </label>
                <button
                  onClick={() => setGroqEnhance((v) => !v)}
                  className={clsx(
                    'w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all',
                    groqEnhance
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  )}
                  role="switch"
                  aria-checked={groqEnhance}
                >
                  <div className="flex items-center gap-3">
                    {groqEnhance ? (
                      <Zap size={16} className="text-teal-500" />
                    ) : (
                      <ZapOff size={16} className="text-slate-400" />
                    )}
                    <div className="text-left">
                      <div
                        className={clsx(
                          'text-[10px] font-black uppercase tracking-widest',
                          groqEnhance ? 'text-teal-600' : 'text-slate-500'
                        )}
                      >
                        {groqEnhance ? 'Groq улучшает промпт' : 'Промпт идёт как есть'}
                      </div>
                      <div className="text-[8px] text-slate-400 mt-0.5">
                        {groqEnhance
                          ? 'Идея на RU → детальный промпт на EN'
                          : 'Твой текст напрямую в модель'}
                      </div>
                    </div>
                  </div>
                  <div
                    className={clsx(
                      'w-10 h-6 rounded-full transition-all relative shrink-0',
                      groqEnhance ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
                    )}
                  >
                    <div
                      className={clsx(
                        'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                        groqEnhance ? 'left-5' : 'left-1'
                      )}
                    />
                  </div>
                </button>
              </section>

              {/* 5. Промпт */}
              <section>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-[8px]">
                    5
                  </span>
                  {sourceMode === 'slug' ? 'Промпт (собран из базы)' : 'Твоя идея'}
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
                    }}
                    placeholder={
                      groqEnhance
                        ? 'Напиши идею по-русски...\nНапример: туристы на SUP на закате Днестра'
                        : 'Детальный промпт на английском...\nExample: tourists on SUP boards at sunset, golden hour, 8k'
                    }
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 rounded-2xl px-4 py-4 text-sm font-medium outline-none resize-none transition-colors placeholder:text-slate-400 placeholder:text-xs leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-3 text-[8px] text-slate-300 font-mono">
                    {prompt.length}/500
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5 px-1">Ctrl+Enter — быстрая генерация</p>
              </section>

              {/* Кнопка генерации */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-teal-500/20 transition-all active:scale-95 disabled:active:scale-100"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Генерируем...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Сгенерировать
                  </>
                )}
              </button>

              {/* Примеры (только когда галерея пуста и manual) */}
              {gallery.length === 0 && sourceMode === 'manual' && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Попробуй:</p>
                  {PROMPT_EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Правая панель: галерея */}
          <div className="lg:col-span-8" ref={galleryRef}>
            {gallery.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center py-24 px-8 text-center h-full min-h-[400px]">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <ImageIcon size={32} className="text-slate-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
                  Холст пуст
                </h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Опиши идею слева или выбери тур из базы — система сама соберёт промпт. Нажми
                  «Сгенерировать».
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Layers size={14} /> Результаты сессии ({gallery.length})
                  </h3>
                  <button
                    onClick={() => setGallery([])}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={10} /> Очистить
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gallery.map((img) => (
                    <ImageCard
                      key={img.id}
                      image={img}
                      onDelete={(id) => setGallery((prev) => prev.filter((x) => x.id !== id))}
                      onSavePrompt={setSaveTarget}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ БИБЛИОТЕКА ══ */}
      {viewMode === 'library' && (
        <div className="space-y-4">
          {loadingPr ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : savedPrompts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <BookmarkPlus size={32} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">
                Библиотека пуста
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Генерируй картинки в студии и сохраняй удачные промпты кнопкой «Сохранить» под
                картинкой.
              </p>
              <button
                onClick={() => setViewMode('studio')}
                className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all active:scale-95"
              >
                В студию
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <BookmarkPlus size={14} /> Сохранённые промпты ({savedPrompts.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPrompts.map((p) => (
                  <div
                    key={p.id}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 line-clamp-1 flex-1">
                        {p.title}
                      </h4>
                      <button
                        onClick={() => setDeleteConfirm(p.id)}
                        className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{p.prompt}</p>

                    {deleteConfirm === p.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeletePrompt(p.id)}
                          className="flex-1 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-red-600 transition-all"
                        >
                          Удалить
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl text-[9px] font-black uppercase"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => applyPrompt(p)}
                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 dark:hover:bg-teal-500 dark:hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Wand2 size={11} /> Загрузить в студию
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Модалка сохранения */}
      {saveTarget && (
        <SavePromptModal image={saveTarget} onSave={handleSavePrompt} onClose={() => setSaveTarget(null)} />
      )}
    </div>
  );
}