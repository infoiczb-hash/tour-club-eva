// src/features/guides/api.ts
"use server";
import { cache } from 'react';
import { prisma } from '@/lib/prisma';


// ─── Для AdminDashboard / TourForm — минимальный select ──────────────────────
export async function getGuides() {
  const guides = await prisma.guide.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      role: true,
      image: true,
      superpower: true,
      experience: true,
      instagram: true, 
      telegram: true,
      order: true,
    },
    orderBy: { order: 'asc' },
  });

  return guides.map(g => ({ ...g, id: g.id.toString() }));
}

// ─── Для главной страницы — полный профиль, обёрнут в cache() ─────────────────
// ИСПРАВЛЕНИЕ: раньше prisma.guide.findMany вызывался прямо в src/app/page.tsx
// без cache() — на каждый запрос страницы. Теперь дедуплицируется в рамках рендера
// и не дублируется между metadata() и компонентом страницы.
export const getGuidesForLanding = cache(async () => {
  const guides = await prisma.guide.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      role: true,
      image: true,
      actionImage: true,
      bio: true,
      fullBio: true,
      superpower: true,
      experience: true,
      achievements: true,
      tags: true,
      quotes: true,
      stats: true,
      instagram: true,
      telegram: true,
      contact: true,
      order: true,
      isActive: true,
    },
    orderBy: { order: 'asc' },
  });

  return guides.map(g => ({
    id: String(g.id),
    slug: g.slug || '',
    name: g.name,
    role: g.role,
    image: g.image,
    actionImage: g.actionImage,
    bio: g.bio,
    fullBio: g.fullBio,
    superpower: g.superpower,
    experience: g.experience,
    achievements: g.achievements || [],
    tags: g.tags || [],
    quotes: g.quotes || [],
    stats: g.stats,
    instagram: g.instagram,
    telegram: g.telegram,
    contact: g.contact,
    order: g.order,
    isActive: g.isActive,
  }));
});
