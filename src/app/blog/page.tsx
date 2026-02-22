import { prisma } from "@/lib/prisma"; // Или твой путь к prisma client
import BlogFeed from "./BlogFeed";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Полевой Журнал | Турклуб Эва",
  description: "Советы туристов, обзоры снаряжения и истории из походов.",
};

export default async function BlogPage() {
  const posts = await prisma.blog.findMany({
    orderBy: {
      date: 'desc',
    },
    });

  return <BlogFeed initialPosts={posts} />;
}