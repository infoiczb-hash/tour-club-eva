// src/app/blog/page.tsx
import { prisma } from "@/lib/prisma";
import BlogFeed from "./BlogFeed";
import { Metadata } from "next";
import { getBlogCategoriesAction } from '@/features/admin/actions/categories';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { Suspense } from 'react';
import { BookOpen } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Блог о Походах и Активном Отдыхе в Приднестровье | Турклуб «Эва»",
  description: "Мотивация и психология. Советы по снаряжению, маршруты по Приднестровью и Молдове, истории из сплавов и походов. Полевой журнал турклуба «Эва» — читай и вдохновляйся.",
  // ... (остальные SEO метаданные остаются без изменений)
};

export default async function BlogPage() {
  const [posts, catRes] = await Promise.all([
    prisma.blog.findMany({
      where: { isActive: true },
      orderBy: { date: 'desc' },
      select: {
        id: true, slug: true, title: true, excerpt: true,
        image: true, date: true, read_time: true,
        is_trending: true, category: true, categoryId: true,
        format: true, author_name: true, author_role: true,
        author_image: true, guideId: true, isActive: true,
        tags: true, createdAt: true, updatedAt: true,
        guide: { select: { id: true, name: true, image: true, role: true } },
        blogCategory: {
          select: {
            id: true, slug: true, title: true,
            isActive: true, sortOrder: true, createdAt: true, updatedAt: true,
          }
        },
      },
    }),
    getBlogCategoriesAction(),
  ]);

  const categories = catRes.success ? catRes.data : [];
  const firstPostImage = posts[0]?.image ?? null;

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://evatur.club" },
        { name: "Блог", url: "https://evatur.club/blog" },
      ]} />

      <link rel="preconnect" href="https://nglywosdwqxxctybwjeb.supabase.co" />
      <link rel="dns-prefetch" href="https://nglywosdwqxxctybwjeb.supabase.co" />
      {firstPostImage && (
        <link
          rel="preload"
          as="image"
          href={`${firstPostImage.split('?')[0]}?width=828&quality=65&format=origin`}
          fetchPriority="high"
        />
      )}

      <main className="min-h-screen bg-[#0B1120]">
        
        {/* ✅ LCP-ОПТИМИЗАЦИЯ: Серверный рендер Hero-блока */}
        <div className="relative pt-24 pb-6 md:pt-32 md:pb-8 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-teal-900/10 md:blur-[120px] rounded-full pointer-events-none" />
          <div className="container mx-auto max-w-5xl relative z-10 text-center px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-6">
              <BookOpen size={12} className="text-teal-400" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">База знаний</span>
            </div>
            <h1 className="text-5xl md:text-7xl leading-[0.9] text-center mb-4">
              <span className="block font-light text-white tracking-tight">Полевой</span>
              <span className="block font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Журнал</span>
            </h1>
          </div>
        </div>

        <Suspense fallback={<div className="min-h-screen bg-slate-950 animate-pulse" />}>
          <BlogFeed initialPosts={posts} categories={categories} />
        </Suspense>
      </main>
    </>
  );
}