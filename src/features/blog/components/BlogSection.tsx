// src/features/blog/components/BlogSection.tsx
"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, PenLine, Filter, User, Sparkles } from "lucide-react";
import { Blog } from "@prisma/client";
import { useModalStore } from '@/shared/store/useModalStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

//   ДОБАВИЛИ ТИПЫ ДЛЯ НОВОЙ СТРУКТУРЫ
interface BlogCategory {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
}

//   НОВЫЙ ИНТЕРФЕЙС: Легкий DTO-тип. Жестко убираем 'content' через Omit
export interface BlogPreview extends Omit<Blog, 'categoryId' | 'tags' | 'content'> {
  tags?: string[];
  categoryId?: string | null;
  blogCategory?: { 
    id: string; 
    slug: string; 
    title: string; 
    isActive: boolean; 
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  guide?: {
    id: string;
    name: string;
    role: string;
    image: string | null;
  } | null;
}

interface BlogSectionProps {
  posts: BlogPreview[]; //   ИЗМЕНЕНО: Ожидаем легкие карточки
  categories?: BlogCategory[];
}

export default function BlogSection({ posts, categories = [] }: BlogSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const openContactModal = useModalStore((state) => state.openContactModal);

  const displayCategories = useMemo(() => {
    const allBtn = { id: 'all', slug: 'all', label: 'Все темы' };
    const dbCats = categories
      .filter(c => c.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(c => ({ id: c.id, slug: c.slug, label: c.title }));
    return [allBtn, ...dbCats];
  }, [categories]);

  const authors = ["all", ...Array.from(new Set(posts.map(p => p.author_name).filter(Boolean)))];

  const getLabel = (post: BlogPreview): string => {
    if (post.categoryId) {
      const cat = categories.find(c => c.id === post.categoryId);
      if (cat) return cat.title;
    }
    return post.blogCategory?.title || post.category || 'Статья';
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Проверка категории
      let matchCat = false;
      if (activeCategory === "all") {
         matchCat = true;
      } else {
         const cat = categories.find(c => c.id === post.categoryId);
         const postSlug = cat?.slug || post.blogCategory?.slug || post.category?.toLowerCase();
         matchCat = postSlug === activeCategory.toLowerCase();
      }

      // Проверка автора
      const matchAuth = selectedAuthor === "all" || post.author_name === selectedAuthor;
      return matchCat && matchAuth;
    });
  }, [posts, activeCategory, selectedAuthor, categories]);

  const LIMITED_POSTS = filteredPosts.slice(0, 7);
  const featuredPost = LIMITED_POSTS[0];
  const listPosts = LIMITED_POSTS.slice(1);

 const formatDate = (date: Date | string) => {
    return format(new Date(date), 'd MMMM', { locale: ru });
};

  if (!posts || posts.length === 0) return null;

  return (
  <section className="relative w-full bg-[#0B1120] py-12 md:py-24 overflow-hidden border-t border-white/5" id="blog">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/5 md:blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-3 md:mb-4">
              <BookOpen size={12} className="text-teal-400" />
              <span className="text-[16px] font-bold uppercase tracking-widest text-teal-400">Блог клуба</span>
            </div>
            <h2 className="text-3xl md:text-6xl uppercase tracking-tighter leading-none mb-3 md:mb-4">
              <span className="font-light text-slate-300 block md:inline">Полевой </span>
              <span className="font-black text-white">Журнал</span>
              <span className="text-teal-500">.</span>
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/*   ВНЕДРЕНО: role="tablist" и aria-label */}
            <div 
              role="tablist" 
              aria-label="Категории блога"
              className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0"
            >
              {displayCategories.map(cat => (
                <button
                  key={cat.id}
                  role="tab" //   ДОБАВЛЕНО
                  aria-selected={activeCategory === cat.slug} //   ДОБАВЛЕНО
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-[14px] md:text-xs font-bold uppercase whitespace-nowrap transition-all border ${
                    activeCategory === cat.slug
                      ? 'bg-teal-400 text-slate-900 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]'
                      : 'bg-slate-900 border-white/10 text-slate-300 hover:border-teal-500/50 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="relative group shrink-0 hidden md:block">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 hover:border-teal-500/30 transition-colors">
                <Filter size={12} aria-hidden="true" />
                <select
                  aria-label="Выберите автора"
                  className="bg-transparent outline-none appearance-none w-full cursor-pointer font-bold pr-4 text-slate-300"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                >
                  <option value="all" className="bg-slate-900">Все авторы</option>
                  {authors.map(auth => (
                    auth !== 'all' && (
                      <option key={String(auth)} value={String(auth)} className="bg-slate-900 text-slate-300">
                        {String(auth)}
                      </option>
                    )
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

        {/* Hero Post */}
          {featuredPost && (
            <div className="lg:col-span-3">
              <Link href={`/blog/${featuredPost.slug}`} className="group relative block aspect-[4/3] lg:aspect-[16/9] w-full rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900 shadow-2xl hover:border-teal-500/30 transition-all duration-500">
                <Image
                  src={featuredPost.image || '/placeholder.jpg'}
                  alt={featuredPost.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  quality={75}
                  loading="lazy" 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end items-start">
                  <span className="px-3 py-1.5 bg-teal-400 text-slate-900 text-[14px] font-black uppercase tracking-widest rounded-lg mb-4 shadow-lg shadow-teal-500/20">
                    {getLabel(featuredPost)}
                  </span>
                  <h3 className="text-2xl md:text-5xl font-black text-white leading-[1.1] mb-6 group-hover:text-teal-400 transition-colors drop-shadow-lg">
                    {featuredPost.title}
                  </h3>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10 w-full">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-slate-800 shrink-0">
                      {featuredPost.author_image ? (
                      <Image 
                        src={featuredPost.author_image} 
                        alt={featuredPost.author_name || 'Автор'} 
                        fill 
                        className="object-cover object-top" 
                        sizes="40px" 
                      />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <User size={16} aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-white uppercase tracking-wider mb-0.5">{featuredPost.author_name}</span>
                      <div className="flex items-center gap-2 text-[12px] text-slate-300 font-medium">
                        <span>{formatDate(featuredPost.date || featuredPost.createdAt)}</span>
                        <span className="w-1 h-1 bg-slate-600 rounded-full" />
                        <span>{featuredPost.read_time} мин</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* List Posts */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="flex flex-col gap-3 flex-1">
              {listPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex gap-4 p-3 pr-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-teal-500/30 transition-all items-center"
                >
                  <div className="relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-slate-800 shadow-md">
                    <Image
                      src={post.image || '/placeholder.jpg'}
                      alt={post.title}
                      fill
                      sizes="96px"
                      quality={75}
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-[12px] font-bold text-teal-400 uppercase tracking-widest">
                        {getLabel(post)}
                      </span>
                      <span className="text-[12px] text-slate-300 font-mono">{formatDate(post.date || post.createdAt)}</span>
                    </div>
                   <h4 className="font-bold text-slate-200 text-sm md:text-base leading-snug group-hover:text-teal-400 transition-colors">
                      {post.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/blog"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-teal-400 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-teal-300 hover:scale-[1.01] transition-all shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
              >
                <span>Читать все статьи</span>
                <ArrowRight size={16} strokeWidth={3} aria-hidden="true" />
              </Link>
              <button
                onClick={() => openContactModal('Хочу стать автором блога', 'BLOG')}
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <PenLine size={14} className="group-hover:-rotate-12 transition-transform" aria-hidden="true" />
                <span>Стать автором</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}