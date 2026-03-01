"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // ✅ ДОБАВИЛИ ДЛЯ URL-ФИЛЬТРОВ
import { Clock, PenLine, BookOpen, User, ArrowRight, Sparkles, Tag } from "lucide-react";
// Если Blog из @prisma/client ругается на новые поля, используй any или расширенный интерфейс
import { Blog } from "@prisma/client";
import ContactHubModal from "@/components/modals/ContactHubModal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Расширяем стандартный тип Blog, чтобы TS знал про новые поля
interface ExtendedBlog extends Omit<Blog, 'categoryId' | 'tags'> {
    tags?: string[];
    categoryId?: string | null;
    categoryRelation?: { slug: string; title: string }; 
}

interface BlogFeedProps {
  initialPosts: ExtendedBlog[];
  categories?: any[]; // ✅ ДОБАВИЛИ ДИНАМИЧЕСКИЕ КАТЕГОРИИ
}

// Старый маппер для обратной совместимости старых постов
const CATEGORY_MAP: Record<string, string> = {
  'HIKING': 'Походы',
  'TIPS': 'Советы',
  'GEAR': 'Снаряжение',
  'STORIES': 'Истории',
  'OTHER': 'Разное'
};

export default function BlogFeed({ initialPosts = [], categories = [] }: BlogFeedProps) {
  // ✅ 1. URL-СИНХРОНИЗАЦИЯ (Вместо локального useState)
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const activeCategory = searchParams.get('category') || 'all';
  const [isHubOpen, setIsHubOpen] = useState(false);

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  // ✅ 2. ФОРМИРУЕМ ДИНАМИЧЕСКИЕ КАТЕГОРИИ
  const displayCategories = useMemo(() => {
    const allBtn = { id: 'all', slug: 'all', label: 'Все' };
    const dbCats = categories.filter(c => c.isActive !== false).map(c => ({
       id: c.id,
       slug: c.slug,
       label: c.title,
    }));
    return [allBtn, ...dbCats];
  }, [categories]);

  // Хендлер изменения URL
  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Умное получение названия категории (ищет в базе, если нет — берет из старого маппера)
  const getLabel = (post: ExtendedBlog) => {
    if (post.categoryId) {
        const cat = categories.find(c => c.id === post.categoryId);
        if (cat) return cat.title;
    }
    return CATEGORY_MAP[post.category] || post.category || 'Статья';
  };

  // ✅ 3. ФИЛЬТРАЦИЯ С УЧЕТОМ НОВЫХ ПОЛЕЙ
  const filteredPosts = useMemo(() => {
    return initialPosts.filter(post => {
      if (activeCategory === "all") return true;
      
      // Ищем либо по связи (categoryId -> категория -> slug), либо по старому текстовому полю category
      const catObj = categories.find(c => c.id === post.categoryId);
      const postSlug = catObj?.slug || post.category?.toLowerCase();
      
      return postSlug === activeCategory.toLowerCase();
    });
  }, [initialPosts, activeCategory, categories]);

  // Сортировка (самые свежие сверху)
  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  
  const isDefaultView = activeCategory === "all";
  const featuredPost = isDefaultView && sortedPosts.length > 0 ? sortedPosts[0] : null;
  const feedPosts = sortedPosts.filter(p => p.id !== featuredPost?.id);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white pb-24">
      
      {/* ================= HEADER ================= */}
      <div className="relative pt-24 pb-8 md:pt-32 md:pb-12 border-b border-white/5 overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

         <div className="container mx-auto max-w-5xl relative z-10 text-center px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6">
                <BookOpen size={12} className="text-teal-400" />
                <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">База знаний</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl leading-[0.9] text-center mb-10 md:mb-14">
                <span className="block font-light text-white tracking-tight">Полевой</span>
                <span className="block font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Журнал</span>
            </h1>
         </div>

         {/* СТИЛИЗОВАННЫЕ ДИНАМИЧЕСКИЕ КАТЕГОРИИ */}
         <div className="w-full overflow-x-auto md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
             <div className="flex justify-start md:justify-center gap-2.5 px-4 min-w-max pb-2 md:pb-0 mx-auto max-w-5xl">
                 {displayCategories.map(cat => (
                     <button
                         key={cat.id}
                         onClick={() => handleCategoryClick(cat.slug)}
                         className={cn(
                             "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shrink-0",
                             activeCategory === cat.slug
                                 ? "bg-teal-400 text-slate-900 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)]" 
                                 : "bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800"
                         )}
                     >
                         {cat.label}
                     </button>
                 ))}
             </div>
         </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 mt-8 md:mt-16">
        
        {/* ================= ✅ ГЛАВНЫЙ РЕЛИЗ (ПЕРЕДЕЛАН В 2 КОЛОНКИ НА ДЕСКТОПЕ) ================= */}
        {isDefaultView && featuredPost && (
            <div className="mb-12 md:mb-24 group cursor-pointer block">
                <Link href={`/blog/${featuredPost.slug}`} className="block">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        
                        {/* ЛЕВАЯ КОЛОНКА: ИЗОБРАЖЕНИЕ */}
                        <div className="relative aspect-[4/3] lg:aspect-[16/9] xl:aspect-[16/9] w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-slate-800 border border-white/5 order-1 lg:order-none shadow-2xl"> 
                            <Image 
                                src={featuredPost.image || '/placeholder.jpg'} 
                                alt={featuredPost.title} 
                                fill 
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                            {/* Бейдж категории */}
                            <div className="absolute top-6 left-6 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-xs font-black text-white uppercase tracking-widest border border-white/10">
                                {getLabel(featuredPost)}
                            </div>
                        </div>

                        {/* ПРАВАЯ КОЛОНКА: КОНТЕНТ */}
                        <div className="flex flex-col items-start order-2 lg:order-none">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-md">
                                    Свежее
                                </div>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock size={14}/> {featuredPost.read_time} мин
                                </span>
                            </div>
                            
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6 group-hover:text-teal-400 transition-colors">
                                {featuredPost.title}
                            </h2>
                            
                            <p className="text-base md:text-xl text-slate-400 font-medium leading-relaxed mb-8">
                                {featuredPost.excerpt}
                            </p>

                            {/* ✅ ДОБАВЛЕНЫ ТЕГИ */}
                            {featuredPost.tags && featuredPost.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-10">
                                    {featuredPost.tags.slice(0, 4).map((tag: string) => (
                                        <span key={tag} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-teal-500/80 bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-500/20">
                                            <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Автор */}
                            <div className="flex items-center gap-4 mt-auto">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border border-white/10 relative shrink-0">
                                    {featuredPost.author_image ? (
                                        <Image src={featuredPost.author_image} alt={featuredPost.author_name || "Автор"} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={20}/></div>
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-bold text-lg">{featuredPost.author_name}</div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{formatDate(featuredPost.date || featuredPost.createdAt)}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </Link>
            </div>
        )}

        {/* ================= CTA: СТАТЬ АВТОРОМ ================= */}
        {isDefaultView && (
            <div 
                onClick={() => setIsHubOpen(true)}
                className="group relative w-full rounded-[2rem] overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-teal-500/20 mb-12 md:mb-24 cursor-pointer hover:border-teal-500/50 transition-all duration-500 shadow-xl"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 via-transparent to-slate-900/50" />
                <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start md:items-center gap-5 md:gap-8">
                        <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-900 text-teal-400 transition-all duration-500 group-hover:rotate-12">
                            <PenLine size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2">
                                У вас есть крутая история?
                            </h3>
                            <p className="text-sm md:text-base text-slate-400 font-medium">
                                Станьте автором полевого журнала и поделитесь опытом с тысячами единомышленников.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-sm font-bold text-teal-500 uppercase tracking-widest group-hover:text-teal-400 transition-colors">
                        <span>Написать нам</span>
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center group-hover:translate-x-2 transition-transform duration-300">
                            <ArrowRight size={18} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ================= ВСЕ СТАТЬИ (Классическая сетка) ================= */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <Sparkles size={24} className="text-teal-500" />
                {activeCategory !== 'all' ? (displayCategories.find(c => c.slug === activeCategory)?.label || 'Материалы') : 'Все материалы'}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {feedPosts.map((post) => (
                <Link 
                    key={post.id} 
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden hover:bg-slate-800/80 hover:border-teal-500/30 transition-all duration-500"
                >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
                        <Image 
                            src={post.image || '/placeholder.jpg'} 
                            alt={post.title} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-700" 
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-4 left-4 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                            {getLabel(post)}
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col flex-grow">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                            <span>{formatDate(post.date || post.createdAt)}</span>
                            <div className="flex items-center gap-1.5"><Clock size={12}/> {post.read_time} мин</div>
                        </div>

                        <h3 className="text-xl font-bold text-white leading-tight mb-3 group-hover:text-teal-400 transition-colors line-clamp-2">
                            {post.title}
                        </h3>
                        
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6 line-clamp-2 flex-grow">
                            {post.excerpt}
                        </p>

                        {/* ✅ ДОБАВЛЕНЫ ТЕГИ В КАРТОЧКАХ */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {post.tags.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-5 border-t border-white/5 mt-auto">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                                 {post.author_image ? (
                                     <Image src={post.author_image} alt={post.author_name || "Автор"} fill className="object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={14}/></div>
                                 )}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">{post.author_name}</div>
                                <div className="text-[10px] text-teal-500 font-black uppercase tracking-widest mt-0.5">Автор клуба</div>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>

        {feedPosts.length === 0 && !featuredPost && (
            <div className="text-center py-20 md:py-32 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02] mt-8">
                <BookOpen size={40} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 font-medium">В этой категории пока нет статей.</p>
                <button 
                    onClick={() => handleCategoryClick('all')}
                    className="mt-6 text-teal-500 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                    Смотреть все материалы
                </button>
            </div>
        )}
      </div>

      <ContactHubModal isOpen={isHubOpen} onClose={() => setIsHubOpen(false)} initialTab="BLOG" />
    </div>
  );
}