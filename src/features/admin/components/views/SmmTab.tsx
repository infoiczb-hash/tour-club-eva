// src/features/admin/components/views/SmmTab.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Clock,
  X,
  Calendar as CalendarIcon,
  ListPlus,
  Target,
  FileText,
  Users,
  CheckCircle2,
  Wand2,
  BookmarkPlus,
  AtSign // Добавлено для Threads
} from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import {
  getSmmSourcesAction,
  generateSmmContentAction,
  saveScheduledPostAction,
  getScheduledPostsAction,
  deleteScheduledPostAction,
  freezeAndPublishSmmAction,
  getSmmCalendarEventsAction,
  type SmmSource
} from '@/features/admin/actions/smm';
import {
  getAiPromptsAction,
  saveAiPromptAction,
  deleteAiPromptAction
} from '@/features/admin/actions/ai-prompts';
import { ScheduledPost } from '@prisma/client';
import { clsx } from 'clsx';
import NeuroStudioTab from './NeuroStudioTab';

// --- КОНСТАНТЫ И ТИПЫ ---

type EntityType = 'tour' | 'blog' | 'calendar';
type CalendarPeriod = 'week' | '2weeks' | 'month';

// Восстановлены все форматы
const FORMATS = [
  { id: 'post', label: '1:1 Квадрат', aspect: 'aspect-square' },
  { id: 'feed', label: '4:5 Лента', aspect: 'aspect-[4/5]' },
  { id: 'story', label: '9:16 Сториз', aspect: 'aspect-[9/16]' },
  { id: 'event', label: '16:9 Ивент', aspect: 'aspect-video' },
] as const;
type ContentFormat = typeof FORMATS[number]['id'];

// Типизация для промптов (Нейро-студия)
interface AiPrompt {
  id: string;
  title: string;
  prompt: string;
  createdAt?: Date;
}

// Восстановлен Threads
const PLATFORMS = [
  { id: 'telegram', label: 'Telegram', icon: <Send size={14} /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} /> },
  { id: 'facebook', label: 'Facebook', icon: <MessageSquare size={14} /> },
  { id: 'threads', label: 'Threads', icon: <AtSign size={14} /> },
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
  { id: 'price', label: 'Цены и Билеты', checked: true },
  { id: 'cta', label: 'Призыв к действию', checked: true },
];

// --- ХЕЛПЕРЫ (ВЫНОС ЛОГИКИ ИЗ UI) ---

// Функция определения CSS-класса пропорций для канваса
const getAspectClass = (fmt: string) => {
  const f = FORMATS.find(x => x.id === fmt);
  return f ? f.aspect : 'aspect-[4/5]';
};

const generateGetOgUrl = (source: SmmSource, format: string, index: number, slideTitle?: string, slideText?: string, trigger?: string, slideType?: string) => {
  const params = new URLSearchParams();
  params.append('format', format);
  params.append('slide', index.toString());
  params.append('type', source.type); 
  params.append('title', source.title);
  params.append('image', source.image || '');
  params.append('categoryColor', source.categoryColor);
  params.append('categoryTitle', source.categoryTitle || (source.type === 'blog' ? 'БЛОГ' : 'ТУР'));
  params.append('tags', (source.tags || []).join(',')); 
  
  if (source.type === 'tour') {
    params.append('location', source.location || '');
    params.append('duration', source.duration || '');
    params.append('price', source.price?.toString() || '');
    params.append('priceMember', (source as any).priceMember?.toString() || '');
    params.append('priceChild', source.priceChild?.toString() || '');
    params.append('currency', source.currency || 'RUB');
    
    //   Новые поля для журнальной карусели
    if (source.route) params.append('route', source.route);
    if (source.meetingPoint) params.append('meetingPoint', source.meetingPoint);
    if (source.spots) params.append('spots', source.spots.toString());
    if (source.spotsLeft !== undefined) params.append('spotsLeft', source.spotsLeft.toString());
    
    if (source.guide) {
      if (source.guide.name) params.append('guideName', source.guide.name);
      if (source.guide.role) params.append('guideRole', source.guide.role);
      if (source.guide.image) params.append('guideImage', source.guide.image);
    }
    
    if (source.highlights) {
       params.append('highlights', typeof source.highlights === 'string' ? source.highlights : JSON.stringify(source.highlights));
    }

    if (source.date) {
      params.append('date', new Date(source.date).toISOString());
    }
  } else if (source.type === 'blog') {
    params.append('author', (source as any).author || 'ЭВА');
    params.append('readTime', (source as any).read_time || '');
  }
  
  if (trigger) params.append('trigger', trigger);
  if (slideTitle) params.append('slideTitle', slideTitle);
  if (slideText) params.append('slideText', slideText);
  if (slideType) params.append('slideType', slideType); //   Прокидываем тип слайда!

  return `/api/og?${params.toString()}`;
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---

export default function SmmTab() {
  const { showToast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);

  // --- СОСТОЯНИЕ ДАННЫХ ---
 const [viewMode, setViewMode] = useState<'generator' | 'history' | 'neuro'>('generator');
  const [sources, setSources] = useState<SmmSource[]>([]);
  const [history, setHistory] = useState<ScheduledPost[]>([]);
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- СОСТОЯНИЕ ГЕНЕРАТОРА (ШАГИ) ---
  const [entityType, setEntityType] = useState<EntityType>('tour');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>('month');
  
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]['id']>('instagram');
  const [tone, setTone] = useState<typeof TONES[number]['id']>('sell');
  const [goal, setGoal] = useState<typeof GOALS[number]['id']>('sell');
  const [audience, setAudience] = useState<typeof AUDIENCES[number]['id']>('warm');
  const [format, setFormat] = useState<ContentFormat>('feed');
  const [isCarousel, setIsCarousel] = useState(true);
  const [funnelSteps, setFunnelSteps] = useState(DEFAULT_FUNNEL);
  const [triggerText, setTriggerText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // --- РЕЗУЛЬТАТЫ И ИНЛАЙН-ФОРМЫ ---
 const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedSlides, setGeneratedSlides] = useState<{ title: string; text: string; type?: string }[]>([]); //   Добавили type
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [calendarBlobUrls, setCalendarBlobUrls] = useState<string[]>([]);

  const [showPromptSave, setShowPromptSave] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');

  // --- ПРОЦЕССЫ И ПОДТВЕРЖДЕНИЯ ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [deleteConfirmHistoryId, setDeleteConfirmHistoryId] = useState<string | null>(null);
  const [deleteConfirmPromptId, setDeleteConfirmPromptId] = useState<string | null>(null);

  // --- ЛАЙТБОКС ---
  const [previewPost, setPreviewPost] = useState<ScheduledPost | null>(null);

  // --- ОЧИСТКА ПАМЯТИ ОТ BLOB ---
useEffect(() => {
    return () => {
      calendarBlobUrls.forEach(url => URL.revokeObjectURL(url)); //   Очищаем весь массив
    };
  }, [calendarBlobUrls]);

  // --- ЗАГРУЗКА ДАННЫХ ---
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [srcRes, histRes, promptsRes] = await Promise.all([
        getSmmSourcesAction() as Promise<{ success: boolean; data?: SmmSource[] }>,
        getScheduledPostsAction() as Promise<{ success: boolean; data?: ScheduledPost[] }>,
        getAiPromptsAction() as Promise<{ success: boolean; data?: any[] }>
      ]);
      
      if (srcRes.success) setSources(srcRes.data || []);
      if (histRes.success) setHistory(histRes.data || []);
      
   // Надежный маппинг Нейро-студии + Защита от пустых данных
      if (promptsRes.success && Array.isArray(promptsRes.data)) {
        const mappedPrompts = promptsRes.data.map((p: any) => ({
          id: p.id,
          title: p.title || 'Без названия',
          // Строго маппим поле prompt из Prisma, с подстраховкой
          prompt: p.prompt || p.content || 'Текст шаблона не найден',
          createdAt: p.createdAt || new Date()
        }));
        setPrompts(mappedPrompts);
      } else {
        console.error('Ошибка загрузки промптов Нейро-студии:', promptsRes);
      }
    } catch (err) {
      showToast('Ошибка при обновлении данных', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedSource = useMemo(() => 
    sources.find(s => s.id === selectedSourceId), 
  [sources, selectedSourceId]);

  const fullContent = useMemo(() => {
    const tagsString = hashtags.length > 0 ? `\n\n${hashtags.map(h => `#${h}`).join(' ')}` : '';
    return `${generatedCaption}${tagsString}`;
  }, [generatedCaption, hashtags]);

  // --- МОМЕНТАЛЬНАЯ АВТОСБОРКА (БЕЗ AI) ---
  const handleAutoAssemble = useCallback(async () => {
    if (entityType === 'calendar') {
      setIsAssembling(true);
      try {
        const days = calendarPeriod === 'week' ? 7 : calendarPeriod === '2weeks' ? 14 : 30;
        const eventsRes = await getSmmCalendarEventsAction(days) as { success: boolean; data?: any[] };
        
        if (eventsRes.success && eventsRes.data && eventsRes.data.length > 0) {
          //   Нарезаем события на чанки: 6 для Сториз, 4 для Ленты/Квадрата
          const chunkSize = format === 'story' ? 6 : 4;
          const chunks = [];
          for (let i = 0; i < eventsRes.data.length; i += chunkSize) {
            chunks.push(eventsRes.data.slice(i, i + chunkSize));
          }

          // Очищаем старые ссылки из памяти
          calendarBlobUrls.forEach(url => URL.revokeObjectURL(url));
          
          //   Делаем параллельные запросы для каждого куска афиши
          const fetchPromises = chunks.map(chunk => 
            fetch('/api/og/calendar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                format: format === 'story' ? 'story' : 'feed', // генератор ждет только story/feed для размеров
                period: calendarPeriod,
                brandColor: 'teal',
                events: chunk
              })
            }).then(r => {
              if (!r.ok) throw new Error('Ошибка генерации');
              return r.blob();
            })
          );

          const blobs = await Promise.all(fetchPromises);
          const newUrls = blobs.map(blob => URL.createObjectURL(blob));
          
          setCalendarBlobUrls(newUrls); //   Сохраняем массив слайдов
          
          setGeneratedCaption(`Свежая афиша туров ЭВА на ${calendarPeriod === 'week' ? 'неделю' : 'ближайшее время'}! 🏔️\n\nВыбирайте свой маршрут и бронируйте места заранее.`);
          setHashtags(['эватур', 'афишатирасполь', 'отдыхпмр']);
          showToast('Афиша собрана!', 'success');
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (e) {
        showToast('Ошибка генерации афиши', 'error');
      } finally {
        setIsAssembling(false);
      }
      return;
    }

    if (!selectedSource) return showToast('Сначала выбери источник', 'error');
    
   setIsAssembling(true);
    //   Добавили type?: string, чтобы TypeScript разрешил класть туда типы слайдов
    const slides: { title: string; text: string; type?: string }[] = [];

  if (isCarousel) {
     if (selectedSource.type === 'tour') {
        //   Формируем строгую маркетинговую воронку (Журнальная верстка)
        
        // 1. Слайд "Логистика" (Рисует генератор сам из данных URL)
        slides.push({ title: 'ЛОГИСТИКА', text: '', type: 'logistics' });
        
        // 2. Слайд "Впечатления"
        if (selectedSource.highlights && (!Array.isArray(selectedSource.highlights) || selectedSource.highlights.length > 0)) {
           slides.push({ title: 'ГЛАВНЫЕ ВПЕЧАТЛЕНИЯ', text: '', type: 'highlights' });
        }
        
        // 3. В стоимость входит
        if (selectedSource.included && selectedSource.included.length > 0) {
           slides.push({ title: 'В СТОИМОСТЬ ВХОДИТ', text: selectedSource.included.join('\n'), type: 'included' });
        }
        
        // 4. Что взять с собой (Генератор добавит чекбоксы [ ✔️ ])
        slides.push({ title: 'ЧТО ВЗЯТЬ С СОБОЙ', text: 'Одежда по погоде\nУдобная обувь для прогулок\nНебольшой рюкзак\nПитьевая вода', type: 'checklist' });
        
        // 5. Цена и Запись (Огромная карточка с тарифами и свободной датой)
        slides.push({ title: 'СТОИМОСТЬ УЧАСТИЯ', text: '', type: 'price' });
        
        showToast('Воронка тура собрана!', 'success');

      } else if (selectedSource.type === 'blog') {
        // Логика сборки БЛОГА
        slides.push({ title: 'О ЧЕМ СТАТЬЯ', text: selectedSource.title });
        slides.push({ title: 'ДЕТАЛИ', text: `Автор: ${(selectedSource as any).author || 'ЭВА'}\nРубрика: ${selectedSource.categoryTitle || 'Блог'}` });
        slides.push({ title: 'ПОЛЕЗНО', text: `Время чтения: ${(selectedSource as any).read_time || '5 мин'}\nЧитайте подробнее на сайте!` });
      }
    }

    setGeneratedSlides(slides);
    
    if (selectedSource.type === 'tour') {
      setGeneratedCaption(`${selectedSource.title.toUpperCase()}\n\n${selectedSource.location}\n\nПриглашаем вас в активное путешествие вместе с турклубом ЭВА! 🏕️`);
    } else {
      setGeneratedCaption(`Новая статья в блоге ЭВА: ${selectedSource.title.toUpperCase()}!\n\nПереходите по ссылке, чтобы узнать больше 📖`);
    }
    
    setHashtags(['эватур', selectedSource.type, 'приднестровье']);
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      setIsAssembling(false);
    }, 100);
  }, [entityType, selectedSource, calendarPeriod, format, isCarousel, calendarBlobUrls, showToast]);

  // --- AI ГЕНЕРАЦИЯ ТЕКСТА ---
  const handleAiTextGenerate = async () => {
    if (!selectedSourceId && entityType !== 'calendar') return showToast('Выбери источник контента', 'error');
    setIsGenerating(true);

    try {
      const activeSteps = isCarousel ? funnelSteps.filter(s => s.checked).map(s => s.label) : [];
      const res = (await generateSmmContentAction({
        sourceType: entityType as any,
        sourceId: selectedSourceId,
        platform,
        tone,
        goal,
        audience,
        steps: activeSteps
      })) as { success: boolean; data?: any; error?: string };

      if (res.success && res.data) {
        setGeneratedCaption(res.data.caption);
        if (res.data.slides && res.data.slides.length > 0 && isCarousel) {
            setGeneratedSlides(res.data.slides);
        }
        if (res.data.hashtags) setHashtags(res.data.hashtags);
        showToast('Текст отшлифован ИИ ✨', 'success');
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        showToast(res.error || 'Ошибка генерации', 'error');
      }
    } catch (err) {
      showToast('Ошибка нейросети', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- СОХРАНЕНИЕ / ПУБЛИКАЦИЯ ---
  const handleSave = async () => {
    setIsSaving(true);
   try {
      const allImages = entityType === 'calendar' 
       ? calendarBlobUrls
        : [generateGetOgUrl(selectedSource!, format, 0, undefined, undefined, triggerText, 'cover'), 
           ...generatedSlides.map((s, i) => generateGetOgUrl(selectedSource!, format, i + 1, s.title, s.text, triggerText, s.type))];

      const res = (await saveScheduledPostAction({
        platform,
        format,
        content: fullContent,
        imageUrl: allImages[0],
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledFor: scheduledAt || null,
        sourceType: entityType,
        sourceId: selectedSourceId,
        metadata: { imageUrls: allImages }
      })) as { success: boolean; error?: string; data?: ScheduledPost };

      if (res.success) {
        showToast(scheduledAt ? 'Пост запланирован' : 'Сохранено в черновики', 'success');
        loadData();
        setViewMode('history');
      } else {
        showToast(res.error || 'Ошибка сохранения', 'error');
      }
    } catch (err) {
      showToast('Не удалось сохранить', 'error');
    } finally {
      setIsSaving(false);
    }
  };

const handlePublishNow = async (isPublic: boolean = false) => {
    setIsPublishing(true);
    try {
      const allImages = entityType === 'calendar' 
       ? calendarBlobUrls
        : [generateGetOgUrl(selectedSource!, format, 0, undefined, undefined, triggerText, 'cover'), 
           ...generatedSlides.map((s, i) => generateGetOgUrl(selectedSource!, format, i + 1, s.title, s.text, triggerText, s.type))];

      const res = (await freezeAndPublishSmmAction({
        imageUrls: allImages,
        content: fullContent,
        platform,
        isPublic: isPublic // 👈 Передаем флаг из кнопки
      })) as { success: boolean; error?: string };

      if (res.success) {
        showToast(isPublic ? 'Опубликовано в публичный канал! 📢' : 'Сохранено в админский ТГ! 🚀', 'success');
      } else {
        showToast(res.error || 'Ошибка публикации', 'error');
      }
    } catch (err) {
      showToast('Сетевая ошибка', 'error');
    } finally {
      setIsPublishing(false);
    }
  };


  // --- УДАЛЕНИЕ ИСТОРИИ ---
  const handleDeleteHistoryPost = async (id: string) => {
    const res = (await deleteScheduledPostAction(id)) as { success: boolean; error?: string };
    if (res.success) {
        setHistory(prev => prev.filter(p => p.id !== id));
        setDeleteConfirmHistoryId(null);
        showToast('Пост удален', 'success');
    } else {
        showToast(res.error || 'Ошибка удаления', 'error');
    }
  };

  // --- НЕЙРО-СТУДИЯ (PROMPTS) ---
  const handleSavePrompt = async () => {
    if (!newPromptTitle.trim()) return showToast('Введите название', 'error');
    if (!generatedCaption.trim()) return showToast('Нет текста для сохранения', 'error');
    
    setIsSaving(true);
    try {
      const res = (await saveAiPromptAction(newPromptTitle, generatedCaption)) as { success: boolean; error?: string };
       if (res.success) {
        showToast('Шаблон сохранен в Нейро-студию', 'success');
        setShowPromptSave(false);
        setNewPromptTitle('');
        loadData();
      } else {
        showToast(res.error || 'Ошибка сохранения', 'error');
      }
    } catch (err) {
      showToast('Ошибка', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    const res = (await deleteAiPromptAction(id)) as { success: boolean; error?: string };
    if (res.success) {
      setPrompts(prev => prev.filter(p => p.id !== id));
      setDeleteConfirmPromptId(null);
      showToast('Шаблон удален', 'success');
    } else {
      showToast(res.error || 'Ошибка удаления', 'error');
    }
  };

  const applyPrompt = (p: AiPrompt) => {
    setGeneratedCaption(p.prompt); 
    setViewMode('generator');
    showToast('Шаблон применен', 'success');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

return (
    <div className="space-y-6 pb-20">
      
      {/* ─── ВЕРХНЯЯ НАВИГАЦИЯ (MOBILE FRIENDLY) ─── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm mt-16 md:mt-0 sticky top-16 md:top-0 z-30">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto hide-scrollbar w-full md:w-auto">
          <button
            onClick={() => setViewMode('generator')}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs  font-black uppercase tracking-widest transition-all shrink-0",
              viewMode === 'generator' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <Zap size={14} /> Мастерская
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs  font-black uppercase tracking-widest transition-all shrink-0",
              viewMode === 'history' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <History size={14} /> История
          </button>
         <button
  onClick={() => setViewMode('neuro')}
  className={clsx(
    "flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs  font-black uppercase tracking-widest transition-all shrink-0",
    viewMode === 'neuro' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
  )}
>
  <Wand2 size={14} /> Нейро-студия
</button>
        </div>
      </div>

      {viewMode === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ─── ЛЕВАЯ КОЛОНКА: WIZARD ─── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
              
              {/* Шаг 1: Сущность */}
              <section>
                <label className="block text-xs  font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px]">1</span>
                  Объект продвижения
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  {(['tour', 'blog', 'calendar'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { setEntityType(t); setSelectedSourceId(''); }}
                      className={clsx(
                        "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        entityType === t ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {t === 'tour' ? 'Тур' : t === 'blog' ? 'Блог' : 'Афиша'}
                    </button>
                  ))}
                </div>
              </section>

              {/* Шаг 2: Контент / Период */}
              <section className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs  font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px]">2</span>
                  Детализация
                </label>
                
                {entityType === 'calendar' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(['week', '2weeks', 'month'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setCalendarPeriod(p)}
                        className={clsx(
                          "py-3 border-2 rounded-xl text-[9px] font-bold uppercase transition-all",
                          calendarPeriod === p ? 'border-teal-500 bg-teal-50 text-teal-600' : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {p === 'week' ? 'Неделя' : p === '2weeks' ? '2 нед.' : 'Месяц'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                    ) : (
                      <select
                        value={selectedSourceId}
                        onChange={(e) => setSelectedSourceId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 rounded-2xl px-4 py-4 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="">Выбрать из базы...</option>
                        {sources.filter(s => s.type === entityType).map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    )}
                    {sources.filter(s => s.type === entityType).length === 0 && !isLoading && (
                      <p className="text-xs  text-rose-500 font-bold px-2 italic">Нет активных элементов в базе</p>
                    )}
                  </div>
                )}
              </section>

              {/* Шаг 3: Формат и ИИ Стратегия */}
              <section className="space-y-6">
                <label className="block text-xs  font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px]">3</span>
                  Настройка форматов
                </label>

                <div className="space-y-3">
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <button
                      onClick={() => setIsCarousel(false)}
                      className={clsx(
                        "flex-1 py-3 rounded-xl text-xs  font-black uppercase tracking-widest transition-all",
                        !isCarousel ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500'
                      )}
                    >
                      Одиночный
                    </button>
                    <button
                      onClick={() => setIsCarousel(true)}
                      className={clsx(
                        "flex-1 py-3 rounded-xl text-xs  font-black uppercase tracking-widest transition-all",
                        isCarousel ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-500'
                      )}
                    >
                      Карусель
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Платформа</label>
                      <div className="space-y-1">
                        {PLATFORMS.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={clsx(
                              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs  font-bold border-2 transition-all",
                              platform === p.id ? 'border-teal-500 bg-teal-50 text-teal-600' : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {p.icon} {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Размер</label>
                      <div className="space-y-1">
                        {FORMATS.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setFormat(f.id)}
                            className={clsx(
                              "w-full py-2.5 rounded-xl text-xs  font-bold border-2 transition-all",
                              format === f.id ? 'border-teal-500 bg-teal-50 text-teal-600' : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                </div>

                {/* Если тур/блог, показываем настройки ИИ */}
                {entityType !== 'calendar' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Тон (AI)</label>
                      <select value={tone} onChange={e => setTone(e.target.value as any)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-2 py-2 text-xs  font-bold text-slate-800 dark:text-slate-200 outline-none">
                         {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Цель (AI)</label>
                      <select value={goal} onChange={e => setGoal(e.target.value as any)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-2 py-2 text-xs  font-bold text-slate-800 dark:text-slate-200 outline-none">
                         {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                   <label className="block text-xs  font-black text-rose-500 uppercase tracking-widest mb-2">Хайп-триггер</label>
                   <input 
                    type="text" 
                    value={triggerText} 
                    onChange={e => setTriggerText(e.target.value)} 
                    placeholder="Например: Мест нет!"
                    className="w-full bg-rose-50 dark:bg-rose-900/10 border-2 border-transparent focus:border-rose-300 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none text-rose-600 transition-colors"
                   />
                </div>
              </section>

              {/* ДЕЙСТВИЯ ШАГА */}
              <div className="space-y-3 pt-4">
                 <button
                   onClick={handleAutoAssemble}
                   disabled={isAssembling || (!selectedSourceId && entityType !== 'calendar')}
                   className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs  flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                 >
                   {isAssembling ? <RefreshCw className="animate-spin" size={16} /> : <Layout size={16} />}
                   {entityType === 'calendar' ? 'Собрать афишу' : 'Собрать карусель (Авто)'}
                 </button>
                 
                 {entityType !== 'calendar' && (
                   <button
                     onClick={handleAiTextGenerate}
                     disabled={isGenerating || (!selectedSourceId)}
                     className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs  flex items-center justify-center gap-3 shadow-xl shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                   >
                     {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                     Написать текст (AI)
                   </button>
                 )}
                 
                 {!selectedSourceId && entityType !== 'calendar' && (
                    <p className="text-[9px] text-slate-500 text-center font-bold">
                      Сначала выбери источник на Шаге 2
                    </p>
                 )}
              </div>

            </div>
          </div>

         {/* ─── ПРАВАЯ КОЛОНКА: КАНВАС ─── */}
          {/* Добавлен min-w-0 для починки горизонтального скролла на широких экранах */}
          <div className="lg:col-span-8 space-y-6 min-w-0" ref={resultRef}>
             
             {/* МОНТАЖНЫЙ СТОЛ */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                     <ImageIcon size={18} /> Монтажный стол
                   </h3>
                </div>

            <div className="flex overflow-x-auto gap-8 pb-8 custom-scrollbar snap-x snap-mandatory">
                   {entityType === 'calendar' ? (
                     calendarBlobUrls.length > 0 ? (
                       //   Если афиша собрана, рендерим карусель из кусков
                       calendarBlobUrls.map((url, idx) => (
                         <div key={idx} className="shrink-0 w-80 snap-start flex flex-col gap-6">
                            <div className={clsx(
                              "relative w-full rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-slate-100 dark:border-slate-800 shadow-2xl",
                              getAspectClass(format)
                            )}>
                              <img src={url} className="w-full h-full object-contain" alt={`Affiche ${idx + 1}`} />
                            </div>
                            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-center">
                               <span className="text-[9px] font-black uppercase text-teal-600 tracking-widest">Афиша: Часть {idx + 1}</span>
                            </div>
                         </div>
                       ))
                     ) : (
                       // ❌ Если афиши еще нет, показываем заглушку
                       <div className="shrink-0 w-80 snap-start flex flex-col gap-6">
                          <div className={clsx(
                            "relative w-full rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-slate-100 dark:border-slate-800 shadow-2xl",
                            getAspectClass(format)
                          )}>
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-4">
                               <CalendarIcon size={48} strokeWidth={1} />
                               <span className="text-xs  font-black uppercase text-slate-500">Нажми "Собрать афишу"</span>
                            </div>
                          </div>
                       </div>
                     )
                   ) : (
                     <>
                        {/* ОБЛОЖКА */}
                        <div className="shrink-0 w-80 snap-start flex flex-col gap-6">
                           <div className={clsx(
                             "relative w-full rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-slate-50 dark:border-slate-800 shadow-2xl transition-all",
                             getAspectClass(format)
                           )}>
                              {selectedSource ? (
                                <img src={generateGetOgUrl(selectedSource, format, 0, undefined, undefined, triggerText)} className="w-full h-full object-cover" />
                              ) : <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-800"><ImageIcon size={40}/></div>}
                           </div>
                           <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-center">
                              <span className="text-[9px] font-black uppercase text-teal-600 tracking-widest">Слайд 1: Обложка</span>
                           </div>
                        </div>

                        {/* КОНТЕНТНЫЕ СЛАЙДЫ */}
                        {isCarousel && generatedSlides.map((slide, idx) => (
                          <div key={idx} className="shrink-0 w-80 snap-start flex flex-col gap-6">
                            <div className={clsx(
                               "relative w-full rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-slate-50 dark:border-slate-800 shadow-2xl",
                               getAspectClass(format)
                             )}>
                                {/*   Добавлен slide.type в конец вызова функции */}
                                <img src={generateGetOgUrl(selectedSource!, format, idx+1, slide.title, slide.text, triggerText, slide.type)} className="w-full h-full object-cover" />
                             </div>
                             {/* Отступы увеличены через space-y-4 для предотвращения наслоения */}
                             <div className="space-y-4">
                                <input 
                                  value={slide.title} 
                                  onChange={e => {
                                    const newS = [...generatedSlides];
                                    newS[idx].title = e.target.value;
                                    setGeneratedSlides(newS);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs  font-black uppercase outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white"
                                />
                                <textarea 
                                  value={slide.text} 
                                  rows={4}
                                  onChange={e => {
                                    const newS = [...generatedSlides];
                                    newS[idx].text = e.target.value;
                                    setGeneratedSlides(newS);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold leading-relaxed outline-none focus:ring-2 focus:ring-teal-500/20 resize-none text-slate-800 dark:text-slate-200"
                                />
                             </div>
                          </div>
                        ))}
                     </>
                   )}
                </div>
             </div>

             {/* КОПИРАЙТИНГ И ХЕШТЕГИ */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Текст публикации</h3>
                   <div className="flex items-center gap-2">
                     <button 
                      onClick={() => setShowPromptSave(!showPromptSave)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs  font-black uppercase tracking-widest hover:bg-teal-50 hover:text-teal-600 transition-colors flex items-center gap-2"
                     >
                       <BookmarkPlus size={14}/> В шаблоны
                     </button>
                     <button 
                      onClick={() => { navigator.clipboard.writeText(fullContent); showToast('Скопировано', 'success'); }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-teal-600"
                     >
                       <Copy size={18}/>
                     </button>
                   </div>
                </div>

                {/* Инлайн-форма сохранения шаблона */}
                {showPromptSave && (
                  <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                     <input 
                       autoFocus
                       value={newPromptTitle}
                       onChange={e => setNewPromptTitle(e.target.value)}
                       placeholder="Название шаблона (напр: Осенний хайп)"
                       className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-slate-900 dark:text-white"
                     />
                     <button 
                       onClick={handleSavePrompt} 
                       disabled={isSaving || !newPromptTitle.trim()}
                       className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs  font-black uppercase tracking-widest hover:bg-teal-700 transition-colors disabled:opacity-50"
                     >
                       Сохранить
                     </button>
                     <button onClick={() => setShowPromptSave(false)} className="p-2.5 text-slate-500 hover:bg-white rounded-xl"><X size={16}/></button>
                  </div>
                )}

                <textarea 
                  value={generatedCaption}
                  onChange={e => setGeneratedCaption(e.target.value)}
                  className="w-full h-64 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] p-6 text-sm font-medium leading-[1.8] outline-none focus:ring-2 focus:ring-teal-500/10 custom-scrollbar text-slate-800 dark:text-slate-100"
                  placeholder="Текст поста появится здесь..."
                />

                <div className="mt-6 flex flex-wrap gap-2">
                   {hashtags.map((tag, i) => (
                     <div key={i} className="group flex items-center gap-1.5 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-xl text-xs  font-black uppercase tracking-widest border border-teal-100 dark:border-teal-900">
                        #{tag}
                        <button onClick={() => setHashtags(h => h.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 transition-opacity">
                           <X size={10}/>
                        </button>
                     </div>
                   ))}
                </div>
             </div>

             {/* ФИНАЛЬНЫЕ ДЕЙСТВИЯ */}
             {generatedCaption && (
               <div className="bg-slate-900 rounded-[3rem] p-8 space-y-8 shadow-2xl">
                  <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                     <div className="flex items-center gap-3 shrink-0">
                        <CalendarIcon size={24} className="text-amber-400" />
                        <span className="text-xs  font-black uppercase text-white tracking-widest">Таймер публикации:</span>
                     </div>
                     <input 
                      type="datetime-local" 
                      value={scheduledAt} 
                      onChange={e => setScheduledAt(e.target.value)}
                      className="flex-1 bg-transparent border-none text-white font-bold text-sm outline-none cursor-pointer"
                     />
                  </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <button
                       onClick={handleSave}
                       disabled={isSaving}
                       className="py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs  flex items-center justify-center gap-3 transition-all"
                     >
                       {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                       {scheduledAt ? 'Запланировать' : 'В БД'}
                     </button>
                     <button
                       onClick={() => handlePublishNow(false)}
                       disabled={isPublishing}
                       className="py-5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs  flex items-center justify-center gap-3 transition-all shadow-xl shadow-teal-500/30"
                     >
                       {isPublishing ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                       В админский ТГ
                     </button>
                     <button
                       onClick={() => handlePublishNow(true)}
                       disabled={isPublishing}
                       className="py-5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs  flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/30"
                     >
                       {isPublishing ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                       В публичный канал
                     </button>
                  </div>
               </div>
             )}

          </div>
        </div>
      )}
      
      {/* ─── ИСТОРИЯ ПУБЛИКАЦИЙ ─── */}
     {viewMode === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm animate-in fade-in duration-300 overflow-hidden">
          {history.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs  font-black uppercase tracking-widest text-slate-400">
                    <th className="pb-4 pl-4">Превью</th>
                    <th className="pb-4 w-1/3">Контент</th>
                    <th className="pb-4">Платформа</th>
                    <th className="pb-4">Статус</th>
                    <th className="pb-4">Создано</th>
                    <th className="pb-4 text-right pr-4">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {history.map(post => (
                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      
                      {/* Thumbnail */}
                      <td className="py-4 pl-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer" onClick={() => setPreviewPost(post)}>
                           {post.imageUrl ? (
                             <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={16}/></div>
                           )}
                        </div>
                      </td>
                      
                      {/* Контент (Обрезанный) */}
                      <td className="py-4 pr-6">
                         <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                           {post.content}
                         </p>
                      </td>
                      
                      {/* Платформа */}
                      <td className="py-4">
                        <span className={clsx(
                           "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs  font-black uppercase tracking-wider",
                           post.platform === 'instagram' ? 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400' : 
                           post.platform === 'facebook' ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400' :
                           post.platform === 'threads' ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' :
                           'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
                        )}>
                           {PLATFORMS.find(p => p.id === post.platform)?.icon}
                           {post.platform}
                        </span>
                      </td>

                      {/* Статус */}
                      <td className="py-4">
                         <span className={clsx(
                           "px-3 py-1 rounded-lg text-xs  font-black uppercase tracking-wider",
                           post.status === 'scheduled' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                         )}>
                            {post.status === 'scheduled' ? 'Запланирован' : 'Черновик'}
                         </span>
                         {post.scheduledFor && (
                           <div className="text-xs  text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                             <Clock size={10} /> {new Date(post.scheduledFor).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}
                           </div>
                         )}
                      </td>

                      {/* Дата создания */}
                      <td className="py-4 text-xs font-bold text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                      </td>

                      {/* Действия (CRUD) */}
                      <td className="py-4 pr-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setPreviewPost(post)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-teal-600" title="Просмотр">
                               <Eye size={16}/>
                            </button>
                            
                            {/* Удаление с инлайн-подтверждением */}
                            <div className="relative flex justify-end min-w-[70px]">
                              {deleteConfirmHistoryId === post.id ? (
                                <div className="flex gap-1 animate-in fade-in slide-in-from-right-2">
                                   <button onClick={() => handleDeleteHistoryPost(post.id)} className="p-2 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600"><CheckCircle2 size={16}/></button>
                                   <button onClick={() => setDeleteConfirmHistoryId(null)} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"><X size={16}/></button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirmHistoryId(post.id)} className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors text-slate-400 hover:text-rose-500" title="Удалить">
                                   <Trash2 size={16}/>
                                </button>
                              )}
                            </div>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center opacity-30">
               <History size={64} className="mx-auto mb-4" strokeWidth={1}/>
               <p className="text-xl font-black uppercase tracking-[0.3em]">Реестр пуст</p>
            </div>
          )}
        </div>
      )}

     {/* ─── НЕЙРО-СТУДИЯ (ГЕНЕРАЦИЯ И ШАБЛОНЫ) ─── */}
     {viewMode === 'neuro' && <NeuroStudioTab />}
      
      {/* ─── LIGHTBOX (ПРОСМОТР КАРУСЕЛИ) ─── */}
      {previewPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/98 backdrop-blur-2xl p-4 md:p-10 animate-in fade-in zoom-in duration-300">
           <button onClick={() => setPreviewPost(null)} className="absolute top-10 right-10 p-5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all z-[110]">
              <X size={32}/>
           </button>
           
           <div className="w-full max-w-7xl h-full flex flex-col gap-12">
              <div className="flex-1 flex overflow-x-auto gap-10 custom-scrollbar snap-x snap-mandatory items-center px-10">
                 {/* Читаем metadata или fallback на imageUrl */}
                 {((previewPost.metadata as Record<string, any>)?.imageUrls || [previewPost.imageUrl]).map((img: string, i: number) => (
                    <div key={i} className="shrink-0 h-[70vh] aspect-[4/5] bg-black rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] snap-center border-4 border-white/5">
                       <img src={img} className="w-full h-full object-contain" alt={`Slide ${i+1}`} />
                    </div>
                 ))}
              </div>
              <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] max-w-4xl mx-auto shadow-2xl">
                 <p className="text-white/80 text-base leading-loose max-h-40 overflow-y-auto custom-scrollbar font-medium whitespace-pre-line">
                    {previewPost.content}
                 </p>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(20, 184, 166, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}