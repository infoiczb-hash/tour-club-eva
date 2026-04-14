"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, Save, Sparkles, Loader2, Share2, 
  Instagram, Send, Image as ImageIcon, Upload, Palette,
  Clock, Tag, User, TrendingUp, CheckCircle2, ChevronDown, Link as LinkIcon, RefreshCw
} from 'lucide-react';
import { Blog } from '@prisma/client'; 
import Button from '@/shared/ui/Button';
import { performAiTask } from '@/features/admin/actions/ai';
import { uploadImage, uploadImageFromUrl } from '@/lib/api';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getGuides } from '@/features/tours/api';
import dynamic from 'next/dynamic'; // 👈 ДОБАВИЛИ

// 👈 ДОБАВИЛИ: Ленивая загрузка тяжелого редактора
const TiptapEditor = dynamic(() => import('@/shared/ui/TiptapEditor'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Утилита для транслитерации (Русский -> Eng Slug)
const slugify = (text: string) => {
  const ru: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 
    'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => ru[char] || char)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Расчет времени чтения (HTML -> Text -> Words -> Minutes)
const calculateReadTime = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, ' '); // Убираем теги
  const wordCount = text.trim().split(/\s+/).length;
  const time = Math.ceil(wordCount / 200); // 200 слов в минуту
  return time < 1 ? 1 : time;
};

// === СТРОГАЯ ТИПИЗАЦИЯ ===
interface BlogCategory {
  id: string;
  slug: string;
  title: string;
}

interface GuideData {
  id: string;
  name: string;
  role: string;
  image: string | null;
}

interface ExtendedBlog extends Omit<Blog, 'guideId' | 'categoryId' | 'tags'> {
  guideId?: string | null;
  categoryId?: string | null;
  category_id?: string | null;
  tags?: string[];
}

interface Props {
  initialData?: ExtendedBlog | null;
  categories?: BlogCategory[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export default function PostForm({ initialData, categories = [], onClose, onSubmit }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null); 
  
  const [guides, setGuides] = useState<GuideData[]>([]);

  const [tagInput, setTagInput] = useState('');

  const defaultCategoryId = categories.length > 0 ? categories[0].id : '';

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '', 
    excerpt: initialData?.excerpt || '', 
    content: initialData?.content || '',
    image: initialData?.image || '',
    
    category_id: initialData?.categoryId ?? initialData?.category_id ?? defaultCategoryId,
    category: initialData?.category || '', 
    tags: initialData?.tags || [], 
    
    read_time: initialData?.read_time?.toString() || '5',
    is_trending: initialData?.is_trending || false,
    
    author_name: initialData?.author_name || 'Team Eva',
    author_role: initialData?.author_role || 'Guide Club',
    author_image: initialData?.author_image || '',
    guide_id: initialData?.guideId || '',
  });

  useEffect(() => {
    async function loadGuides() {
      const list = await getGuides();
      // Убеждаемся, что данные с сервера ложатся в строгий интерфейс
      setGuides(list as GuideData[]);
    }
    loadGuides();
  }, []);

  useEffect(() => {
    if (!initialData && formData.title) {
        setFormData(prev => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [formData.title, initialData]);

  const handleContentChange = (html: string) => {
    const time = calculateReadTime(html);
    setFormData(prev => ({ 
        ...prev, 
        content: html,
        read_time: String(time)
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); 
      const newTag = tagInput.trim().replace(/^#/, ''); 
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const finalSlug = formData.slug || slugify(formData.title) || `post-${Date.now()}`;

      const payload: Record<string, unknown> = { 
          ...formData, 
          slug: finalSlug,
          read_time: Number(formData.read_time) || 5, 
          image: formData.image || null,
          author_image: formData.author_image || null,
          guide_id: formData.guide_id || null,
          id: initialData?.id 
      };

      if (payload.category_id === '') delete payload.category_id;

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error saving post");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectGuide = (guideId: string) => {
    if (!guideId) {
      setFormData(prev => ({ ...prev, guide_id: '' }));
      return;
    }
    const guide = guides.find(g => g.id === guideId);
    if (guide) {
      setFormData(prev => ({
        ...prev,
        guide_id: guide.id,
        author_name: guide.name,
        author_role: guide.role || 'Guide Club', 
        author_image: guide.image || prev.author_image
      }));
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'author_image') => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoadingField(field);
    try {
       const url = await uploadImage(file, 'blog');
        if (url) setFormData(prev => ({ ...prev, [field]: url }));
        else alert("Upload failed");
    } catch (err) { alert("Upload failed"); } 
    finally { setLoadingField(null); }
  };

  const handleAiImage = async () => {
    if (!formData.title) return alert("Please enter a title first!");
    setIsImageGenerating(true);
    const res: any = await performAiTask({ mode: 'generate_image', prompt: formData.title }); // 👈 ДОБАВЛЕНО : any
    if (res.success) {
       const permanentUrl = await uploadImageFromUrl(res.data as string);
       if (permanentUrl) setFormData(prev => ({ ...prev, image: permanentUrl }));
    } else { alert("AI Error: " + res.error); }
    setIsImageGenerating(false);
  };

 const handleAiText = async () => {
    const topic = prompt("Topic of the article?"); if (!topic) return;
    setIsAiGenerating(true);
    const res: any = await performAiTask({ mode: 'generate_blog', topic }); // 👈 ДОБАВЛЕНО : any
    setIsAiGenerating(false);
    if (res.success) {
        // Убираем any, задаем жесткую структуру ответа Gemini
        const data = res.data as { title: string; excerpt: string; content: string; read_time: string | number; category: string; };
        setFormData(prev => ({ 
            ...prev, 
            title: data.title, 
            excerpt: data.excerpt, 
            content: data.content, 
            read_time: String(data.read_time), 
            category: data.category, 
            slug: slugify(data.title) 
        }));
    } else { alert("AI Error: " + res.error); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">{initialData ? '✏️ Edit Post' : '📝 New Post'}</h2>
            <p className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mt-0.5">CONTENT MANAGER</p>
          </div>
          <div className="flex gap-2">
             <button type="button" onClick={handleAiText} disabled={isAiGenerating} className="hidden sm:flex bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800 px-3 py-2 rounded-xl text-xs font-bold items-center gap-2 transition shadow-sm">
                {isAiGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} AI Generator
             </button>
             <button type="button" onClick={onClose} className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl transition text-slate-800"><X size={24}/></button>
          </div>
        </div>

        <form id="post-form" onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar pb-24">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* TITLE & SLUG GROUP */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-800 uppercase mb-1.5 ml-1 tracking-wider">Title (Заголовок)</label>
                        <input className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-lg font-bold transition-all dark:text-white" 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Top 5 places..." autoFocus 
                        />
                    </div>
                    
                    {/* SLUG FIELD */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                             <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-800 uppercase mb-1.5 ml-1 tracking-wider flex items-center gap-1">
                                <LinkIcon size={10}/> URL Slug
                             </label>
                             <input className="w-full p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-800 focus:ring-1 focus:ring-violet-500/20 outline-none" 
                                value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="my-awesome-post" 
                             />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setFormData({...formData, slug: slugify(formData.title)})}
                            className="p-2 h-[34px] bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                            title="Regenerate Slug from Title"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[12px] font-bold text-slate-800 uppercase mb-1.5 ml-1 tracking-wider flex items-center gap-1"><Tag size={10}/> Category</label>
                        <select className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-sm font-bold dark:text-white appearance-none cursor-pointer" 
                            value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                            <option value="">-- Выберите категорию --</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-slate-800 uppercase mb-1.5 ml-1 tracking-wider flex items-center gap-1"><Clock size={10}/> Read Time (min)</label>
                        <div className="relative">
                            <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-sm font-bold dark:text-white" 
                                value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})} 
                            />
                            <div className="absolute right-3 top-3 text-[12px] text-slate-800 font-bold uppercase pointer-events-none">Auto-calc</div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[12px] font-bold text-slate-800 uppercase mb-1.5 ml-1 tracking-wider flex items-center gap-1">
                        <Tag size={10}/> Tags (Теги статьи)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map(tag => (
                            <span key={tag} className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                                #{tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-violet-900 dark:hover:text-violet-100 ml-1">
                                    <X size={12}/>
                                </button>
                            </span>
                        ))}
                    </div>
                    <input 
                        type="text" 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 text-sm font-bold dark:text-white transition-all placeholder:text-slate-800 placeholder:font-normal" 
                        placeholder="Введите тег и нажмите Enter (или запятую)..." 
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                    />
                </div>

                <div 
                    onClick={() => setFormData(prev => ({...prev, is_trending: !prev.is_trending}))}
                    className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none",
                        formData.is_trending 
                            ? "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-900/50" 
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    )}
                >
                    <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                        formData.is_trending ? "bg-orange-500 text-white" : "bg-slate-200 dark:bg-slate-700"
                    )}>
                        {formData.is_trending && <CheckCircle2 size={14} />}
                    </div>
                    <div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-800 flex items-center gap-2">
                            <TrendingUp size={14} className={formData.is_trending ? "text-orange-500" : "text-slate-800"}/> 
                            Trending (Топ новость)
                        </span>
                        <p className="text-[12px] text-slate-800">Показывать в блоке "Сейчас читают"</p>
                    </div>
                </div>
              </div>

              {/* RIGHT COLUMN: AUTHOR */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 h-fit">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={12}/> Author Details</h3>
                  
                  <div className="mb-4 relative">
                      <label className="text-[12px] font-bold text-slate-800 uppercase ml-1 mb-1 block">Select from Team</label>
                      <div className="relative">
                          <select 
                            className="w-full p-2 pl-3 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-violet-500/20 outline-none"
                            value={formData.guide_id}
                            onChange={(e) => handleSelectGuide(e.target.value)}
                          >
                             <option value="">-- Manual Input --</option>
                             {guides.map(g => (
                               <option key={g.id} value={g.id}>{g.name}</option>
                             ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none"/>
                      </div>
                  </div>

                  <hr className="border-slate-200 dark:border-slate-700 my-4 border-dashed"/>

                  <div className="flex flex-col items-center mb-4">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 relative group overflow-hidden bg-white dark:bg-slate-800 mb-3">
                          {formData.author_image ? (
                              <img src={formData.author_image} className="w-full h-full object-cover" alt="Author"/>
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-800"><User size={24}/></div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                              {loadingField === 'author_image' ? <Loader2 className="animate-spin text-white"/> : <Upload className="text-white"/>}
                          </div>
                          <input type="file" onChange={(e) => handleFile(e, 'author_image')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      </div>
                      <p className="text-[12px] text-slate-800 font-bold uppercase">Author Photo</p>
                  </div>

                  <div className="space-y-3">
                      <div>
                          <label className="text-[12px] font-bold text-slate-800 uppercase ml-1">Name</label>
                          <input className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold dark:text-white" 
                             value={formData.author_name} onChange={e => setFormData({...formData, author_name: e.target.value})} placeholder="Roman Sandu"
                          />
                      </div>
                      <div>
                          <label className="text-[12px] font-bold text-slate-800 uppercase ml-1">Role</label>
                          <input className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold dark:text-white" 
                             value={formData.author_role} onChange={e => setFormData({...formData, author_role: e.target.value})} placeholder="Guide Club"
                          />
                      </div>
                  </div>
              </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800"/>
          
          {/* 2. TEXT CONTENT & TIPTAP */}
          <div className="space-y-6">
              <div>
                  <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-800 uppercase mb-1.5 ml-1 tracking-wider">Preview (Lead)</label>
                  <textarea 
                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm leading-relaxed outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none dark:text-white placeholder:text-slate-800 h-28" 
                    value={formData.excerpt} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} placeholder="Short description for the card..." 
                  />
              </div>

              <div>
                  <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-800 uppercase mb-1.5 ml-1 tracking-wider">Content</label>
                  <TiptapEditor 
                    content={formData.content} 
                    onChange={handleContentChange} 
                    placeholder="Write your story here..."
                  />
              </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800"/>
          
          {/* 3. COVER IMAGE */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider">Cover Image</label>
                <button type="button" onClick={handleAiImage} disabled={isImageGenerating || !formData.title} className="text-[12px] font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 disabled:opacity-50">
                    {isImageGenerating ? <Loader2 size={12} className="animate-spin"/> : <Palette size={12}/>} Generate AI
                </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900 relative group transition-colors">
                <div className="flex gap-4 items-center">
                    <div className="flex-1 relative h-40 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center group/img">
                        {formData.image ? (
                            <>
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"><span className="bg-white/20 p-2 rounded-full text-white backdrop-blur"><X size={20}/></span></button>
                            </>
                        ) : (
                            <div className="text-slate-800 flex flex-col items-center">
                                {loadingField === 'image' ? (
                                    <Loader2 size={32} className="mb-2 animate-spin text-violet-500"/>
                                ) : (
                                    <>
                                        <ImageIcon size={32} className="mb-2 opacity-50"/>
                                        <span className="text-xs font-bold uppercase">{isImageGenerating ? 'Painting...' : 'No Image'}</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input type="file" onChange={(e) => handleFile(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" disabled={isImageGenerating || loadingField === 'image'} />
                    </div>
                    <div className="w-1/3 space-y-3">
                        <input className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-violet-500/20" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="Or URL..." />
                        <button type="button" className="w-full p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-800 flex items-center justify-center gap-2 transition pointer-events-none">
                            <Upload size={16}/> Upload
                        </button>
                        <p className="text-[12px] text-center text-amber-500 font-bold">⚠️ 16:9 Ratio</p>
                    </div>
                </div>
            </div>
          </div>

          {/* SMM GENERATOR */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 p-6 rounded-3xl border border-pink-100 dark:border-pink-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div><h4 className="text-xs font-black text-pink-700 dark:text-pink-400 uppercase flex items-center gap-2 mb-1"><Share2 size={14}/> SMM Announce</h4><p className="text-[12px] text-pink-600/70 dark:text-pink-400/70 font-medium">Generate social media posts</p></div>
             <div className="flex gap-2 w-full sm:w-auto">
                 <Button type="button" variant="secondary" className="bg-white dark:bg-pink-950/50 border-none shadow-sm h-9 text-[12px] flex-1" onClick={async () => {
                     const res: any = await performAiTask({ mode: 'smm_post', context: formData, platform: 'instagram' }); // 👈 ДОБАВЛЕНО : any
                     if(res.success && typeof res.data === 'string') navigator.clipboard.writeText(res.data).then(() => alert('✅ Copied!'));
                 }}><Instagram size={14} className="mr-2 text-pink-600"/> Instagram</Button>
                <Button type="button" variant="secondary" className="bg-white dark:bg-pink-950/50 border-none shadow-sm h-9 text-[12px] flex-1" onClick={async () => {
                     const res: any = await performAiTask({ mode: 'smm_post', context: formData, platform: 'telegram' }); // 👈 ДОБАВЛЕНО : any
                     if(res.success && typeof res.data === 'string') navigator.clipboard.writeText(res.data).then(() => alert('✅ Copied!'));
                 }}><Send size={14} className="mr-2 text-sky-500"/> Telegram</Button>
             </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur rounded-b-2xl flex justify-end gap-3 z-10 absolute bottom-0 left-0 right-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button>
            <Button type="submit" form="post-form" variant="primary" disabled={isUploading} className="bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/20 px-8">
              {isUploading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save size={18} className="mr-2"/>} Save Post
            </Button>
        </div>
      </div>
    </div>
  );
}