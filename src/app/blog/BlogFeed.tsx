"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Clock, PenLine, BookOpen, ArrowRight, Sparkles, Filter } from "lucide-react";
import { Blog } from "@prisma/client";
import { useModalStore } from '@/shared/store/useModalStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import AuthorBlock from '@/components/blog/AuthorBlock';

// ─── Типы ────────────────────────────────────────────────────────────────────

interface BlogCategory {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BlogPreview extends Omit<Blog, 'categoryId' | 'tags' | 'content'> {
  tags?: string[];
  categoryId?: string | null;
  blogCategory?: { 
    id: string; 
    slug: string; 
    title: string; 
    isActive: boolean; 
    sortOrder: number;
  } | null;
  guide?: {
    id: string;
    name: string;
    role: string;
    image: string | null;
    slug?: string | null;
  } | null;
}

interface BlogFeedProps {
  initialPosts: BlogPreview[]; 
  categories?: BlogCategory[];
}

function ParamsListener({ onChange }: { onChange: (val: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onChange(searchParams.get('category') || 'all');
  }, [searchParams, onChange]);
  return null;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export default function BlogFeed({ initialPosts = [], categories = [] }: BlogFeedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const openContactModal = useModalStore((state) => state.openContactModal);

  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");

  const formatDate = (date: Date | string) =>
    format(new Date(date), 'd MMMM', { locale: ru });

  const displayCategories = useMemo(() => {
    const allBtn = { id: 'all', slug: 'all', label: 'Все' };
    const dbCats = categories
      .filter(c => c.isActive !== false)
      .map(c => ({ id: c.id, slug: c.slug, label: c.title }));
    return [allBtn, ...dbCats];
  }, [categories]);

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug); 
    const params = new URLSearchParams(window.location.search);
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getLabel = (post: BlogPreview): string => {
    if (post.categoryId) {
      const cat = categories.find(c => c.id === post.categoryId);
      if (cat) return cat.title;
    }
    return post.blogCategory?.title || post.category || 'Статья';
  };

  const authors = ["all", ...Array.from(new Set(initialPosts.map(p => p.author_name).filter(Boolean)))];

  const filteredPosts = useMemo(() => {
    return initialPosts.filter(post => {
      let matchCat = false;
      if (activeCategory === 'all') {
         matchCat = true;
      } else {
         const cat = categories.find(c => c.id === post.categoryId);
         const postSlug = cat?.slug ?? post.category?.toLowerCase();
         matchCat = postSlug === activeCategory.toLowerCase();
      }

      const matchAuth = selectedAuthor === "all" || post.author_name === selectedAuthor;
      return matchCat && matchAuth;
    });
  }, [initialPosts, activeCategory, selectedAuthor, categories]);

  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
  );

  const isDefaultView = activeCategory === 'all';
  const trendingPosts = sortedPosts.filter(post => post.is_trending);
  const regularPosts = sortedPosts.filter(post => !post.is_trending);

  let top3Posts: BlogPreview[] = [];
  let feedPosts: BlogPreview[] = [];

  if (isDefaultView) {
    if (trendingPosts.length >= 3) {
      top3Posts = trendingPosts.slice(0, 3);
      feedPosts = [...trendingPosts.slice(3), ...regularPosts];
    } else {
      const needed = 3 - trendingPosts.length;
      top3Posts = [...trendingPosts, ...regularPosts.slice(0, needed)];
      feedPosts = regularPosts.slice(needed);
    }
  } else {
    feedPosts = sortedPosts;
  }

  // ─── ОБНОВЛЕННАЯ КАРТОЧКА СТАТЬИ ─────────────────────────────────────────
  const PostCard = ({ post, priority = false }: { post: BlogPreview; priority?: boolean }) => (
    <div className="group flex flex-col bg-slate-900/60 border border-white/5 rounded-[2rem] overflow-hidden hover:bg-slate-800/80 hover:border-teal-500/30 transition-all duration-300 shadow-sm hover:shadow-xl h-full">
      <Link href={`/blog/${post.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-slate-800 block">
        <Image
          src={post.image || '/placeholder.jpg'}
          alt={post.title}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Мягкий бейдж с глассморфизмом */}
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-slate-900/70 backdrop-blur-md rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10 shadow-sm pointer-events-none">
          {getLabel(post)}
        </div>
      </Link>

      <div className="p-6 md:p-8 flex flex-col flex-grow">
        {/* Мета (Дата и время) */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          <span>{formatDate(post.date || post.createdAt)}</span>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-500" />
            <span>{post.read_time} мин</span>
          </div>
        </div>

        {/* Заголовок */}
        <Link href={`/blog/${post.slug}`} className="block mb-3">
          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight group-hover:text-teal-400 transition-colors line-clamp-3">
            {post.title}
          </h3>
        </Link>

        {/* Описание (Читаемое, с интервалом) */}
        <Link href={`/blog/${post.slug}`} className="block flex-grow mb-6">
          <p className="text-sm md:text-[15px] text-slate-300 leading-relaxed line-clamp-3 md:line-clamp-4">
            {post.excerpt}
          </p>
        </Link>

        {/* Теги как пилюли (Pills) */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="px-2.5 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Блок автора (Используем AuthorBlock) */}
        <div className="pt-5 border-t border-white/5 mt-auto">
          <AuthorBlock 
            name={post.author_name || "Турклуб Эва"}
            role={post.author_role || "Автор клуба"}
            image={post.author_image}
            guideSlug={post.guide?.slug || null}
            centered={false}
          />
        </div>
      </div>
    </div>
  );

  // ─── Рендер ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0B1120] text-white pb-24">
      <Suspense fallback={null}>
        <ParamsListener onChange={setActiveCategory} />
      </Suspense>

      <div className="w-full overflow-x-auto md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-white/5 pb-4 pt-4 md:pt-8 md:pb-6">
        <div className="flex justify-start md:justify-center gap-2.5 px-4 min-w-max pb-2 md:pb-0 mx-auto max-w-5xl">
          {displayCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shrink-0',
                activeCategory === cat.slug
                  ? 'bg-teal-400 text-slate-900 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)]'
                  : 'bg-slate-800/50 border-white/5 text-slate-300 hover:text-white hover:bg-slate-800'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 mt-8 md:mt-12">

        {isDefaultView && top3Posts.length > 0 && (
          <div className="mb-16 md:mb-24">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3 mb-8">
              <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
              Выбор редакции
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {top3Posts.map((post, index) => (
                <PostCard key={post.id} post={post} priority={index === 0} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-16 md:mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-slate-300 flex items-center gap-3">
              <Sparkles size={20} className="text-slate-300" />
              {activeCategory !== 'all'
                ? (displayCategories.find(c => c.slug === activeCategory)?.label || 'Материалы')
                : 'Все материалы'}
            </h2>
            
            <div className="relative group shrink-0 hidden md:block">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 hover:border-teal-500/30 transition-colors">
                <Filter size={12} />
                <select
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {feedPosts.map((post, index) => (
              <PostCard key={post.id} post={post} priority={!isDefaultView && index === 0} />
            ))}
          </div>

          {feedPosts.length === 0 && top3Posts.length === 0 && (
            <div className="text-center py-20 md:py-32 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02] mt-8">
              <BookOpen size={40} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-300 font-medium">В этой категории пока нет статей.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => openContactModal('Стать автором блога', 'BLOG')}
          className="group relative w-full rounded-[2rem] overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-teal-500/20 hover:border-teal-500/50 transition-all duration-500 shadow-xl text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 via-transparent to-slate-900/50" />
          <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-5 md:gap-8">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-900 text-teal-400 transition-all duration-500 group-hover:rotate-12">
                <PenLine size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2">
                  У вас есть тематическая статья?
                </h3>
                <p className="text-sm md:text-base text-slate-300 font-medium">
                  Станьте автором журнала и поделитесь опытом с нашим клубом.
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
        </button>

      </div>
    </div>
  );
}