"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, PenLine, Filter, User } from "lucide-react";
import { Blog } from "@prisma/client";
import { useModalStore } from '@/shared/store/useModalStore';

interface BlogSectionProps {
  posts: Blog[];
}

export default function BlogSection({ posts }: BlogSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const openContactModal = useModalStore((state) => state.openContactModal);

  const categories = ["all", ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];
  const authors = ["all", ...Array.from(new Set(posts.map(p => p.author_name).filter(Boolean)))];

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchCat = activeCategory === "all" || post.category === activeCategory;
      const matchAuth = selectedAuthor === "all" || post.author_name === selectedAuthor;
      return matchCat && matchAuth;
    });
  }, [posts, activeCategory, selectedAuthor]);

  const LIMITED_POSTS = filteredPosts.slice(0, 7);
  const featuredPost = LIMITED_POSTS[0];
  const listPosts = LIMITED_POSTS.slice(1);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  if (!posts || posts.length === 0) return null;

  return (
    <section className="relative w-full bg-[#0B1120] py-12 md:py-20 overflow-hidden border-t border-white/5" id="blog">
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
              <span className="font-light text-slate-400 block md:inline">Полевой </span>
              <span className="font-black text-white">Журнал</span>
              <span className="text-teal-500">.</span>
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[14px] md:text-xs font-bold uppercase whitespace-nowrap transition-all border ${
                    activeCategory === cat
                      ? 'bg-teal-400 text-slate-900 border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]'
                      : 'bg-slate-900 border-white/10 text-slate-400 hover:border-teal-500/50 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Все темы' : cat}
                </button>
              ))}
            </div>
            <div className="relative group shrink-0 hidden md:block">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-400 hover:border-teal-500/30 transition-colors">
                <Filter size={12} />
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
              <Link href={`/blog/${featuredPost.slug}`} className="group relative block h-[400px] md:h-[520px] w-full rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900 shadow-2xl hover:border-teal-500/30 transition-all duration-500">
                <Image
                  src={featuredPost.image || '/placeholder.jpg'}
                  alt={featuredPost.title}
                  fill
                  // FIX #7: sizes помогает браузеру выбрать правильный размер
                  // quality передаётся в cloudinaryLoader → supabaseLoader
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  quality={75}
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end items-start">
                  <span className="px-3 py-1.5 bg-teal-400 text-slate-900 text-[14px] font-black uppercase tracking-widest rounded-lg mb-4 shadow-lg shadow-teal-500/20">
                    {featuredPost.category}
                  </span>
                  <h3 className="text-2xl md:text-5xl font-black text-white leading-[1.1] mb-6 group-hover:text-teal-400 transition-colors line-clamp-3 drop-shadow-lg">
                    {featuredPost.title}
                  </h3>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10 w-full">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-slate-800">
                      {featuredPost.author_image ? (
                        <Image
                          src={featuredPost.author_image}
                          alt={featuredPost.author_name || "Автор статьи"}
                          fill
                          sizes="40px"
                          quality={75}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={16} /></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-white uppercase tracking-wider mb-0.5">{featuredPost.author_name}</span>
                      <div className="flex items-center gap-2 text-[12px] text-slate-400 font-medium">
                        <span>{formatDate(featuredPost.date)}</span>
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
                      // FIX #7: маленькие карточки — небольшой размер
                      sizes="96px"
                      quality={75}
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">{formatDate(post.date)}</span>
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm md:text-base leading-snug group-hover:text-teal-400 transition-colors line-clamp-2">
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
                <ArrowRight size={16} strokeWidth={3} />
              </Link>
              <button
                onClick={() => openContactModal('Хочу стать автором блога', 'HELP')}
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <PenLine size={14} className="group-hover:-rotate-12 transition-transform" />
                <span>Стать автором</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}