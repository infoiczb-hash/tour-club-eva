"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Flame, Clock, ArrowRight, PenLine, BookOpen, User } from "lucide-react";
import { Blog } from "@prisma/client";
import ContactHubModal from "@/components/modals/ContactHubModal";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface BlogFeedProps {
  initialPosts: Blog[];
}

const CATEGORY_MAP: Record<string, string> = {
  'all': 'Все',
  'HIKING': 'Походы',
  'TIPS': 'Советы',
  'GEAR': 'Снаряжение',
  'STORIES': 'Истории',
  'OTHER': 'Разное'
};

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'HIKING', label: 'Походы' },
  { id: 'TIPS', label: 'Советы' },
  { id: 'GEAR', label: 'Снаряжение' },
  { id: 'STORIES', label: 'Истории' },
];

export default function BlogFeed({ initialPosts }: BlogFeedProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHubOpen, setIsHubOpen] = useState(false);

  const getLabel = (cat: string) => CATEGORY_MAP[cat] || cat;

  const filteredPosts = useMemo(() => {
    return initialPosts.filter(post => {
      const matchCat = activeCategory === "all" || post.category === activeCategory;
      const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [initialPosts, activeCategory, searchQuery]);

  // Сортировка по дате (свежие сверху)
  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const trendingPosts = sortedPosts.filter(p => p.is_trending); // Берем все тренды
  const newPosts = sortedPosts.filter(p => !p.is_trending);

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#0B1120] text-white pb-20">
      
      {/* 1. HERO HEADER */}
      <div className="relative pt-24 pb-8 md:pt-32 md:pb-12 px-4 border-b border-white/5 overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

         <div className="container mx-auto max-w-5xl relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6">
                <BookOpen size={12} className="text-teal-400" />
                <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">База знаний</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl leading-[0.9] text-center mb-6">
                <span className="block font-light text-white tracking-tight">Полевой</span>
                <span className="block font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Журнал</span>
            </h1>
            
            <p className="hidden md:block text-slate-400 text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
               Вдохновение, маршруты и советы от гидов клуба.
            </p>

            {/* SEARCH */}
            <div className="relative max-w-xl mx-auto group z-20 mb-8">
                <div className="absolute inset-0 bg-teal-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-full"/>
                <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-5 py-4 shadow-2xl group-focus-within:border-teal-500/50 transition-colors">
                    <Search className="text-slate-400 group-focus-within:text-teal-400 mr-3" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Найти статью..." 
                        className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-400 font-medium text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning={true}
                    />
                </div>
            </div>

            {/* CATEGORIES */}
            <div className="flex flex-wrap justify-center gap-2.5">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                            activeCategory === cat.id
                                ? 'bg-teal-400 text-slate-900 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.4)]' 
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
         </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 mt-12">
        
        {/* 2. TRENDING SECTION (UX 2026: Horizontal Scroll) */}
        {trendingPosts.length > 0 && searchQuery === "" && (
            <div className="mb-16 md:mb-24">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Flame size={20} className="text-amber-500 animate-pulse"/>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">Сейчас читают</h2>
                </div>
                
                {/* Горизонтальный скролл */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-8 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {trendingPosts.map((post) => (
                         <Link 
                            key={post.id} 
                            href={`/blog/${post.slug}`}
                            className="group relative flex-shrink-0 snap-center rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900 hover:border-teal-500/50 transition-all duration-500 flex flex-col justify-end w-[85vw] md:w-[600px] h-[350px] md:h-[450px]"
                         >
                            <Image 
                                src={post.image || '/placeholder.jpg'} 
                                alt={post.title} 
                                fill 
                                className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                            />
                            {/* Градиент для текста */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                            
                            <div className="relative p-6 md:p-8 w-full flex flex-col h-full justify-end">
                                <div>
                                    <span className="px-3 py-1 bg-teal-400 text-slate-900 text-[14px] font-black uppercase tracking-widest rounded-lg mb-4 inline-block shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                                        {getLabel(post.category)}
                                    </span>
                                    <h3 className="text-2xl md:text-4xl font-black text-white leading-[1.15] mb-3 group-hover:text-teal-400 transition-colors drop-shadow-lg max-w-lg">
                                        {post.title}
                                    </h3>
                                    <p className="text-sm md:text-base text-slate-300 line-clamp-2 md:line-clamp-3 mb-6 max-w-lg font-medium drop-shadow-md hidden md:block">
                                        {post.excerpt}
                                    </p>
                                </div>

                                {/* Автор */}
                                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/10">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-800 shrink-0">
                                         {post.author_image ? (
                                           <Image src={post.author_image} alt={post.author_name || "Автор"} fill className="object-cover" />
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={16}/></div>
                                         )}
                                    </div>
                                    <div className="text-xs md:text-sm">
                                        <div className="text-white font-bold">{post.author_name}</div>
                                        <div className="text-teal-400 font-bold tracking-widest text-[9px] md:text-[14px] uppercase mt-0.5">{formatDate(post.date)}</div>
                                    </div>
                                </div>
                            </div>
                         </Link>
                    ))}
                </div>
            </div>
        )}

        {/* 3. LATEST POSTS */}
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Clock size={20} className="text-slate-400"/>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                        {searchQuery ? 'Результаты поиска' : 'Свежие публикации'}
                    </h2>
                </div>
                
                <button 
                   onClick={() => setIsHubOpen(true)} 
                   className="hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl border border-teal-500/30 bg-teal-500/5 text-teal-400 font-black uppercase text-[14px] tracking-widest hover:bg-teal-500 hover:text-slate-900 transition-all"
                >
                    <PenLine size={16}/> 
                    <span>Стать автором</span>
                </button>
            </div>

            {/* СЕТКА (Убийство колбасы: flex-row на мобильных, flex-col на десктопе) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8">
                {newPosts.map((post) => (
                    <Link 
                        key={post.id} 
                        href={`/blog/${post.slug}`}
                        className="group flex flex-row lg:flex-col bg-slate-900/40 border border-white/5 rounded-2xl lg:rounded-[2rem] overflow-hidden hover:bg-slate-900/80 hover:border-teal-500/40 transition-all duration-300 h-[120px] lg:h-auto"
                    >
                        {/* Изображение (Квадрат слева на моб, Шапка сверху на десктопе) */}
                        <div className="relative w-[120px] lg:w-full h-full lg:h-60 bg-slate-800 shrink-0 overflow-hidden">
                            <Image src={post.image || '/placeholder.jpg'} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700"/>
                             
                             <div className="absolute top-2 left-2 lg:top-4 lg:left-4 px-2 py-0.5 lg:px-2.5 lg:py-1 bg-slate-900/80 backdrop-blur-md rounded-md lg:rounded-lg text-[8px] lg:text-[9px] font-black text-white uppercase border border-white/10 tracking-widest shadow-lg">
                                {getLabel(post.category)}
                            </div>
                        </div>
                        
                        {/* Контент */}
                        <div className="p-3 md:p-4 lg:p-8 flex-1 flex flex-col min-w-0 justify-center lg:justify-start">
                            
                            {/* МЕТА ДАННЫЕ (Только десктоп) */}
                            <div className="hidden lg:flex items-center gap-3 mb-4">
                                <div className="flex items-center gap-2 text-[14px] text-slate-400 font-bold uppercase tracking-widest">
                                    <Clock size={12} className="text-teal-500"/>
                                    <span>{post.read_time} мин</span>
                                </div>
                            </div>

                            <h3 className="text-sm md:text-base lg:text-xl font-bold text-white leading-tight mb-1.5 lg:mb-3 group-hover:text-teal-400 transition-colors line-clamp-3 lg:line-clamp-2">
                                {post.title}
                            </h3>
                            
                            {/* Описание (Скрыто на моб для компактности) */}
                            <p className="hidden lg:block text-sm text-slate-400 line-clamp-3 mb-6 flex-1 font-medium leading-relaxed">
                                {post.excerpt}
                            </p>

                            {/* Дата на мобильных (вместо автора) */}
                            <div className="lg:hidden text-[14px] text-slate-500 font-medium mt-1">
                                {formatDate(post.date)}
                            </div>

                            {/* АВТОР ВНИЗУ (Только десктоп) */}
                            <div className="hidden lg:flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-slate-800">
                                         {post.author_image ? (
                                             <Image src={post.author_image} alt="Author" fill className="object-cover" />
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={14}/></div>
                                         )}
                                    </div>
                                    <div className="text-xs">
                                        <div className="text-white font-bold">{post.author_name}</div>
                                        <div className="text-slate-500 text-[14px]">{formatDate(post.date)}</div>
                                    </div>
                                </div>
                                
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors">
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {newPosts.length === 0 && trendingPosts.length === 0 && (
                <div className="text-center py-32 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02]">
                    <Search size={40} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-500 font-medium">По запросу "{searchQuery}" ничего не найдено.</p>
                </div>
            )}
        </div>
      </div>

      <ContactHubModal 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        initialTab="BLOG"
      />
    </div>
  );
}