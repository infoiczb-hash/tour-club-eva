// src/app/blog/[slug]/page.tsx
import { cache } from 'react';
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Calendar, Clock, User, ArrowRight, BookOpen } from "lucide-react";
import ArticleShare from "@/components/blog/ArticleShare";
import { Metadata } from "next";
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import sanitizeHtml from 'sanitize-html';
import { SafeHTML } from '@/shared/ui/SafeHTML'; // ✅ ИМПОРТ НАШЕГО КОМПОНЕНТА
import PostWishlistButton from '@/features/blog/components/PostWishlistButton';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await prisma.blog.findMany({
    select: { slug: true },
    where: { isActive: true } 
  });
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getPost = cache(async (slug: string) => {
  if (!slug) return null;
  const decodedSlug = decodeURIComponent(slug);

  const post = await prisma.blog.findUnique({
    where: { slug: decodedSlug },
    include: { blogCategory: true } 
  });
  
  if (!post) return null;

  // 1. Пытаемся найти статьи из той же категории
  const relatedPosts = await prisma.blog.findMany({
    where: { 
      id: { not: post.id },
      isActive: true, // Только опубликованные статьи
      // Приоритет — статьи той же категории
      ...(post.categoryId ? { categoryId: post.categoryId } : {}),
    },
    take: 3,
    orderBy: { date: 'desc' },
    // select вместо include — не тянем тяжелое поле content
    select: {
      id: true,
      slug: true,
      title: true,
      image: true,
      category: true,
      blogCategory: {
        select: { title: true }
      }
    }
  });

  let finalRelated = relatedPosts;

  // 2. Если статей в этой категории меньше 3 — добираем свежие из других рубрик
  if (relatedPosts.length < 3) {
    const extra = await prisma.blog.findMany({
      where: {
        id: { notIn: [post.id, ...relatedPosts.map(p => p.id)] },
        isActive: true,
      },
      take: 3 - relatedPosts.length,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        image: true,
        category: true,
        blogCategory: {
          select: { title: true }
        }
      }
    });
    finalRelated = [...relatedPosts, ...extra];
  }

  return { post, relatedPosts: finalRelated };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  
  if (!data) return { title: "Статья не найдена | Турклуб Эва" };
  
  const post = data.post;
  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  
  let imageUrl = post.image || '/og-default.jpg'; 
  if (imageUrl.startsWith('/')) {
    imageUrl = `${BASE_URL}${imageUrl}`;
  }

  return {
    title: `${post.title} | Турклуб «Эва»`,
    description: post.excerpt || `Статья от турклуба «Эва»: ${post.title}`,
    alternates: {
      canonical: postUrl, 
    },
    openGraph: {
      title: `${post.title} | Турклуб «Эва»`,
      description: post.excerpt || '',
      url: postUrl,
      siteName: 'Турклуб «Эва»',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || '',
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) notFound();

  const { post, relatedPosts } = data;
  const postUrl = `${BASE_URL}/blog/${post.slug}`;

  // Проверка сессии и статуса "в избранном" для статьи
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isWished = false;

  if (user) {
    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (profile) {
      const fav = await prisma.favoritePost.findUnique({
        where: {
          memberId_postId: {
            memberId: profile.id,
            postId: post.id
          }
        }
      });
      isWished = !!fav;
    }
  }

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const isoDate = new Date(post.date).toISOString();

  let absoluteImageUrl = post.image || '/og-default.jpg'; 
  if (absoluteImageUrl.startsWith('/')) {
    absoluteImageUrl = `${BASE_URL}${absoluteImageUrl}`;
  }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postUrl
      },
      headline: post.title,
      description: post.excerpt || '',
      image: [absoluteImageUrl],
      datePublished: isoDate,
      dateModified: isoDate, 
      author: {
        '@type': 'Person',
        name: post.author_name || 'Турклуб Эва',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Турклуб «Эва»',
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`
        }
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: BASE_URL
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Журнал',
          item: `${BASE_URL}/blog`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: postUrl
        }
      ]
    }
  ];

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://evatur.club" },
        { name: "Блог", url: "https://evatur.club/blog" },
        { name: post.title, url: `https://evatur.club/blog/${post.slug}` },
      ]} />
    
    <article className="min-h-screen bg-[#0B1120] pb-10 md:pb-24">
      
    <script
        type="application/ld+json"
        // ✅ ИСПРАВЛЕНО: Экранирование для безопасности
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* --- 1. HERO HEADER --- */}
      <div className="relative min-h-[75svh] md:min-h-[65vh] w-full overflow-hidden flex flex-col justify-end">
        
        {/* ФОН */}
        <div className="absolute inset-0 z-0">
            <Image 
                src={post.image || '/placeholder.jpg'} 
                alt={post.title} 
                fill 
                className="object-cover"
                priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-slate-900/40" />
        </div>

        {/* КОНТЕНТ */}
        <div className="relative z-10 container mx-auto px-4 pt-32 pb-8 md:pb-16 max-w-7xl mt-auto">
            
            <Link href="/blog" className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full text-slate-200 hover:text-white transition-all mb-8 md:mb-10 group w-fit shadow-lg">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">В журнал</span>
            </Link>

            <div className="flex items-center gap-3 mb-4 md:mb-5">
                <span className="text-[11px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">
                    Рубрика:
                </span>
                <span className="inline-block px-3 py-1 bg-teal-500 text-slate-950 text-[11px] md:text-[13px] font-black uppercase tracking-widest rounded md:rounded-lg shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                    {(post as any).blogCategory?.title || post.category}
                </span>
            </div>

            <div className="flex items-start justify-between gap-4 mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-4xl drop-shadow-2xl text-balance">
                    {post.title}
                </h1>
                <div className="shrink-0 mt-1 md:mt-2">
                    <PostWishlistButton postId={post.id} initialIsFavorite={isWished} />
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-sm animate-in fade-in duration-700 delay-150">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-slate-800 shadow-md shrink-0">
                        {post.author_image ? (
                         <Image 
                            src={post.author_image} 
                            alt={post.author_name || "Автор статьи"} 
                            fill 
                            className="object-cover object-top" 
                            sizes="48px" 
                         />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <User size={20}/>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-white font-bold uppercase tracking-wider text-[12px] md:text-[13px]">{post.author_name}</div>
                        <div className="text-slate-300 text-[11px] md:text-[12px]">{post.author_role || "Гид клуба"}</div>
                    </div>
                </div>

                <div className="h-8 w-px bg-white/20 hidden md:block" />

                <div className="flex items-center gap-4 text-slate-300 text-[12px] md:text-[13px] font-medium bg-slate-900/50 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/5 w-fit">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-teal-500" />
                        <span>{formatDate(post.date)}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-600" />
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-teal-500" />
                        <span>{post.read_time} мин</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* --- 2. CONTENT GRID --- */}
      <div className="container mx-auto px-4 max-w-7xl mt-8 md:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            
           <div className="lg:col-span-8">
                
                <div className="mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="w-8 h-[2px] bg-teal-500 rounded-full"></span>
                        <h2 className="text-xs md:text-sm font-black text-teal-400 uppercase tracking-widest">
                            О материале
                        </h2>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag: string) => (
                                <span 
                                    key={tag} 
                                    className="px-3 py-1.5 text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-300 bg-slate-800/50 border border-white/5 rounded-lg shadow-sm cursor-default"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* ✅ ВНЕДРЕНИЕ НАШЕГО SafeHTML с кастомными настройками */}
                <SafeHTML 
                    html={post.content}
                    className="prose prose-base prose-invert max-w-none 
                    [&_p:empty]:hidden [&_br]:hidden
                    prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-white
                    prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl md:prose-h2:text-3xl
                    prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-teal-400 prose-h3:text-xl
                    prose-p:text-slate-300 prose-p:text-[15px] md:prose-p:text-[16px] prose-p:leading-snug prose-p:mb-4 prose-p:mt-0
                    prose-strong:text-white prose-strong:font-bold
                    prose-ul:my-3 prose-li:my-0.5 prose-li:text-slate-300 prose-li:text-[15px] md:prose-li:text-[16px] prose-li:leading-snug prose-li:marker:text-teal-500
                    prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-teal-300 transition-colors
                    prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-slate-900/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-white prose-blockquote:my-6 prose-blockquote:font-medium"
                    options={{
                        allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'h1', 'h2', 'img', 'span', 'iframe' ]),
                        allowedAttributes: {
                            '*': ['class', 'style'],
                            'a': ['href', 'name', 'target'],
                            'img': ['src', 'alt'],
                            'iframe': ['src', 'allowfullscreen', 'frameborder', 'width', 'height']
                        },
                        allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
                        // ✅ ИСПРАВЛЕНИЕ УЯЗВИМОСТИ №9 ИЗ АУДИТА (XSS):
                        allowedSchemes: ['http', 'https', 'mailto', 'tel'] 
                    }}
                />

                <ArticleShare title={post.title} slug={post.slug} />

           </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-4 relative mt-12 lg:mt-0">
                <div className="lg:sticky lg:top-28 space-y-6 md:space-y-8 pb-10">
                    
                    {/* Блок "Читайте также" */}
                    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
                        <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">   
                            <BookOpen size={18} className="text-teal-500" />
                            Читайте также 
                        </h2>

                        {relatedPosts.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                {relatedPosts.map(relPost => (
                                    <Link key={relPost.id} href={`/blog/${relPost.slug}`} className="group flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 items-start border-b border-white/5 pb-6 last:border-0 last:pb-0">
                                        <div className="relative w-full sm:w-24 lg:w-full xl:w-24 aspect-[4/3] sm:aspect-square lg:aspect-[4/3] xl:aspect-square shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/5 shadow-md">
                                         <Image
    src={relPost.image || '/placeholder.jpg'}
    alt={relPost.title}
    fill
    className="object-cover group-hover:scale-105 transition-transform duration-500"
   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 120px, 96px"
   loading="lazy"
  />
                                        </div>
                                        <div className="py-1">
                                            <span className="text-[12px] text-teal-400 font-bold uppercase tracking-widest mb-1.5 block opacity-80">
                                                {(relPost as any).blogCategory?.title || relPost.category}
                                            </span>
                                            <h3 className="text-sm font-bold text-slate-200 leading-snug group-hover:text-teal-400 transition-colors line-clamp-3">   
                                                {relPost.title} 
                                            </h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center">
                                <p className="text-slate-300 text-sm font-medium">Нет других статей</p>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <Link href="/blog" className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-slate-800 text-white font-bold uppercase text-[13px] hover:bg-teal-500 hover:text-slate-900 transition-all border border-white/10 hover:border-teal-500 shadow-lg group">
                                <span>Все статьи</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Блок "Хотите с нами?" */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-teal-900/40 to-slate-900 border border-teal-500/20 text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-500" />
                        
                        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tight relative z-10">   
                            Хотите с нами? 
                        </h2>
                        <p className="text-sm text-slate-300 mb-8 leading-relaxed font-medium relative z-10">
                            Теория — это отлично, но лучшие истории происходят на практике. Поехали с нами!
                        </p>
                        <Link href="/tour" className="relative z-10 flex w-full justify-center items-center gap-2 py-4 rounded-xl bg-teal-500 text-slate-950 font-black uppercase text-[13px] tracking-wider hover:bg-teal-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                            Выбрать маршрут <ArrowRight size={16} />
                        </Link>
                    </div>

                </div>
            </aside>

        </div>
      </div>
    </article>
    </>
  );
}