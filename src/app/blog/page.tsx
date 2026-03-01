import { prisma } from "@/lib/prisma"; // Проверь правильность пути к твоей Prisma
import BlogFeed from "./BlogFeed";
import { Metadata } from "next";
import { getBlogCategoriesAction } from '@/features/admin/actions/categories';

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
    canonical: "/blog", // Защита от появления дублей в индексе Google
  },
  openGraph: {
    title: "Блог о Походах и Активном Отдыхе в Приднестровье",
    description: "Мотивация и психология. Советы по снаряжению, маршруты по Приднестровью и Молдове. Полевой журнал турклуба «Эва» — читай и вдохновляйся.",
    url: "https://evatur.club/blog",
    siteName: "Турклуб «Эва»",
    images: [
      {
        url: "/og-default.jpg", // 💡 Совет: в будущем можешь сделать отдельную картинку для блога (например, /og-blog.jpg)
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
  // 1. Получаем все посты, сортируем от новых к старым
  const posts = await prisma.blog.findMany({
    orderBy: {
      date: 'desc',
    },
  });

  // 2. Получаем категории
  const catRes = await getBlogCategoriesAction();
  const categories = catRes.success ? catRes.data : [];

  return (
    // Обернул в main, чтобы поисковики правильно читали структуру документа
    <main className="min-h-screen bg-slate-950">
      <BlogFeed 
        initialPosts={posts} 
        categories={categories}
      />
    </main>
  );
}
