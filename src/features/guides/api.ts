"use server"; 
import { prisma } from '@/lib/prisma';

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