import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Calendar, Clock, User, ArrowRight } from "lucide-react";
import ArticleShare from "@/components/blog/ArticleShare";
import { Metadata } from "next";

// Базовый URL для SEO (канонические ссылки и микроразметка)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';

// --- ТИПЫ ---
interface PageProps {
  params: Promise<{ slug: string }>;
}

// --- БАЗА ДАННЫХ ---
async function getPost(slug: string) {
  if (!slug) return null;
  const decodedSlug = decodeURIComponent(slug);

  const post = await prisma.blog.findUnique({
    where: { slug: decodedSlug },
  });
  
  if (!post) return null;

  const relatedPosts = await prisma.blog.findMany({
    where: { 
        id: { not: post.id },
        // isActive: true 
    },
    take: 3,
    orderBy: { date: 'desc' }
  });

  return { post, relatedPosts };
}

// --- SEO И OPEN GRAPH (КРАСИВЫЙ ШЕРИНГ) ---
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  
  if (!data) return { title: "Статья не найдена | Турклуб Эва" };
  
  const post = data.post;
  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  
  // Делаем URL картинки абсолютным для соцсетей
  let imageUrl = post.image || '/og-default.jpg'; 
  if (imageUrl.startsWith('/')) {
    imageUrl = `${BASE_URL}${imageUrl}`;
  }

  // ✅ ИСПРАВЛЕНО: Динамические Keywords с надежным фолбеком
const keywordsStr = `${post.category}, поход Приднестровье, активный отдых, турклуб Эва, советы туристам, маршруты Молдова`;

  return {
    title: `${post.title} | Турклуб «Эва»`,
    description: post.excerpt || `Статья от турклуба «Эва»: ${post.title}`,
    keywords: keywordsStr,
    alternates: {
      canonical: postUrl, // ✅ ИСПРАВЛЕНО: Защита от дублей с UTM-метками
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

// --- ВИЗУАЛЬНЫЙ КОМПОНЕНТ СТРАНИЦЫ ---
export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) notFound();

  const { post, relatedPosts } = data;
  const postUrl = `${BASE_URL}/blog/${post.slug}`;

  // Форматирование даты
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const isoDate = new Date(post.date).toISOString();

  // Делаем URL картинки абсолютным для микроразметки
  let absoluteImageUrl = post.image || '/og-default.jpg'; 
  if (absoluteImageUrl.startsWith('/')) {
    absoluteImageUrl = `${BASE_URL}${absoluteImageUrl}`;
  }

  // ✅ ИСПРАВЛЕНО: Внедряем мощную микроразметку (Article + Breadcrumbs)
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
      dateModified: isoDate, // Если в БД появится поле updatedAt, можно будет подставить его
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
    <article className="min-h-screen bg-[#0B1120] pb-10 md:pb-20">
      
      {/* СКРЫТЫЙ КОД ДЛЯ ПОИСКОВЫХ БОТОВ (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* --- 1. HERO HEADER --- */}
      <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
        <Image 
            src={post.image || '/placeholder.jpg'} 
            alt={post.title} 
            fill 
            className="object-cover"
            priority
            sizes="100vw" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/40 to-transparent" />

        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-6 md:pb-16 max-w-7xl">
            {/* Хлебные крошки */}
            <Link href="/blog" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-3 md:mb-6 group w-fit">
                <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-900 transition-all border border-white/10">
                    <ArrowLeft size={16} />
                </div>
                <span className="text-[14px] md:text-xs font-bold uppercase tracking-widest">Журнал</span>
            </Link>

            {/* Категория */}
            <span className="inline-block px-2.5 py-1 bg-teal-500 text-slate-900 text-[12px] md:text-[14px] font-black uppercase tracking-widest rounded md:rounded-lg mb-2 md:mb-5 w-fit shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                {post.category}
            </span>

            {/* ЗАГОЛОВОК */}
            <h1 className="text-xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 md:mb-8 max-w-4xl drop-shadow-lg">
                {post.title}
            </h1>

            {/* Мета данные */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/20 bg-slate-800">
                         {post.author_image ? (
                             <Image src={post.author_image} alt={post.author_name || "Автор статьи"} fill className="object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={16}/></div>
                         )}
                    </div>
                    <div>
                        <div className="text-white font-bold uppercase tracking-wider text-[14px] md:text-xs">{post.author_name}</div>
                        <div className="text-slate-400 text-[12px] md:text-[14px]">{post.author_role || "Гид клуба"}</div>
                    </div>
                </div>

                <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

                <div className="flex items-center gap-3 text-slate-300 text-[14px] md:text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-teal-500" />
                        <span>{formatDate(post.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-teal-500" />
                        <span>{post.read_time} мин</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- 2. CONTENT GRID --- */}
      <div className="container mx-auto px-4 max-w-7xl mt-4 md:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            
            {/* MAIN TEXT */}
            <div className="lg:col-span-8">
                <div 
                    className="prose prose-sm md:prose-lg prose-invert max-w-none 
                    
                    [&_p:empty]:hidden 
                    [&_br]:hidden

                    prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-white
                    prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-xl md:prose-h2:text-3xl
                    prose-h3:text-teal-400 prose-h3:text-lg
                    
                    prose-p:text-slate-300 prose-p:leading-normal prose-p:my-3
                    
                    prose-strong:text-white prose-strong:font-bold
                    
                    prose-ul:my-4 prose-li:my-1 prose-li:text-slate-300 prose-li:marker:text-teal-500
                    
                    prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline
                    
                    prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-white/5 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-white prose-blockquote:my-6"
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                />

                <ArticleShare title={post.title} slug={post.slug} />

                <div className="mt-6 flex flex-wrap gap-2">
                    <span className="text-slate-500 text-xs font-bold mr-1 py-1">Тема:</span>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-slate-400 text-[14px] md:text-xs hover:text-white transition-colors cursor-pointer border border-white/5">#{post.category}</span>
                </div>
            </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-4 space-y-6 md:space-y-8 mt-6 lg:mt-0">
                <div className="lg:sticky lg:top-24 p-5 md:p-6 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
                    <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-white mb-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                        Читайте также
                    </h3>

                    {relatedPosts.length > 0 ? (
                        <div className="flex flex-col gap-5">
                            {relatedPosts.map(relPost => (
                                <Link key={relPost.id} href={`/blog/${relPost.slug}`} className="group flex gap-3 items-start">
                                    <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-white/5">
                                        <Image src={relPost.image || '/placeholder.jpg'} alt={relPost.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="py-1">
                                        <span className="text-[12px] text-teal-400 font-bold uppercase tracking-wider mb-1 block opacity-80">{relPost.category}</span>
                                        <h4 className="text-xs md:text-sm font-bold text-white leading-snug group-hover:text-teal-400 transition-colors line-clamp-3">
                                            {relPost.title}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
                            <p className="text-slate-500 text-xs">Нет других статей</p>
                        </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-white/10">
                        <Link href="/blog" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 text-white font-bold uppercase text-[14px] md:text-xs hover:bg-teal-500 hover:text-slate-900 transition-all border border-white/10 shadow-lg">
                            <span>Все статьи</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-900/30 to-slate-900 border border-teal-500/20 text-center shadow-lg">
                    <h3 className="text-lg font-black text-white mb-2 uppercase">Хотите с нами?</h3>
                    <p className="text-xs md:text-sm text-slate-300 mb-5 leading-relaxed">Наши гиды проведут вас по самым красивым маршрутам.</p>
                    <Link href="/tour" className="inline-flex w-full justify-center py-3 rounded-xl bg-teal-500 text-slate-900 font-bold uppercase text-[14px] md:text-xs hover:bg-teal-400 transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                        Выбрать тур
                    </Link>
                </div>
            </aside>

        </div>
      </div>
    </article>
  );
}