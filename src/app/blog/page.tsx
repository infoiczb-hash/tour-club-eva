import { prisma } from "@/lib/prisma";
import BlogFeed from "./BlogFeed";
import { Metadata } from "next";
import { getBlogCategoriesAction } from '@/features/admin/actions/categories';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { Suspense } from 'react';

export const revalidate = 60;

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
  const posts = await prisma.blog.findMany({
    orderBy: {
      date: 'desc',
    },
  });

  const catRes = await getBlogCategoriesAction();
  const categories = catRes.success ? catRes.data : [];

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: "Главная", url: "https://evatur.club" },
        { name: "Блог", url: "https://evatur.club/blog" },
      ]} />

      {/*
        ✅ PRECONNECT: экономит ~300мс LCP.
        Браузер заранее устанавливает TCP+TLS соединение с Supabase Storage
        ещё до того, как Next.js Image запросит первое изображение.
        dns-prefetch — фолбэк для браузеров без поддержки preconnect.
      */}
      <link rel="preconnect" href="https://nglywosdwqxxctybwjeb.supabase.co" />
      <link rel="dns-prefetch" href="https://nglywosdwqxxctybwjeb.supabase.co" />

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