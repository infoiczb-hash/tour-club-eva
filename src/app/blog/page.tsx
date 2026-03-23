import { prisma } from "@/lib/prisma";
import BlogFeed from "./BlogFeed";
import { Metadata } from "next";
import { getBlogCategoriesAction } from '@/features/admin/actions/categories';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { Suspense } from 'react';

export const revalidate = 3600;

// 🔥 МОЩНОЕ ИНФОРМАЦИОННОЕ SEO ДЛЯ БЛОГА
export const metadata: Metadata = {
  title: "Блог о Походах и Активном Отдыхе в Приднестровье | Турклуб «Эва»",
  description: "Мотивация и психология. Советы по снаряжению, маршруты по Приднестровью и Молдове, истории из сплавов и походов. Полевой журнал турклуба «Эва» — читай и вдохновляйся.",
  keywords: [
    "блог о походах Приднестровье",
    "советы туристам",
    "мотивация и психология",
    "топ локаций в Приднестровье",
    "отдых на природе советы",
    "как подготовиться к сплаву и походу"
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Блог о Походах и Активном Отдыхе в Приднестровье",
    description: "Мотивация и психология. Советы по снаряжению, маршруты по Приднестровью и Молдове. Полевой журнал турклуба «Эва» — читай и вдохновляйся.",
    url: "https://evatur.club/blog",
    siteName: "Турклуб «Эва»",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Полевой журнал Турклуба Эва",
      }
    ],
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Блог о Походах | Турклуб Эва",
    description: "Мотивация и психология. Советы по снаряжению и маршруты по Приднестровью.",
    images: ["/og-default.jpg"],
  },
};

export default async function BlogPage() {
  // ✅ Promise.all: два запроса параллельно вместо последовательных
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
        // content не выбираем — не нужен в списке, экономим трафик
      },
    }),
    getBlogCategoriesAction(),
  ]);

  const categories = catRes.success ? catRes.data : [];

  // ✅ preload первой карточки — браузер грузит до гидрации JS
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

      <main className="min-h-screen bg-slate-950">
        <Suspense fallback={<div className="min-h-screen bg-slate-950 animate-pulse" />}>
          <BlogFeed
            initialPosts={posts}
            categories={categories}
          />
        </Suspense>
      </main>
    </>
  );
}