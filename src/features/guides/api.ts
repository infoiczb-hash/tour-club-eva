"use server"; 
import { prisma } from '@/lib/prisma';

export async function getGuides() {
  try {
    const guides = await prisma.guide.findMany();

    // Обязательная нормализация BigInt в строку для Client Components
    return guides.map(guide => ({
      ...guide,
      id: guide.id.toString(),
    }));
  } catch (error) {
    console.error("Ошибка при получении гидов через Prisma:", error);
    return [];
  }
}