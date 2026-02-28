'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function upsertGuideAction(data: any) {
  try {
    const payload = {
      name: data.name,
      slug: data.slug,
      role: data.role,
      image: data.image,
      actionImage: data.actionImage,
      bio: data.bio,
      fullBio: data.fullBio,
      experience: data.experience,
      superpower: data.superpower,
      achievements: data.achievements || [],
      tags: data.tags || [],
      quotes: data.quotes || [],
      // Prisma отлично понимает JSON, если передать ей массив объектов
      stats: data.stats || [], 
      instagram: data.instagram,
      telegram: data.telegram,
      contact: data.contact,
      order: parseInt(data.order) || 0,
      isActive: data.isActive,
    };

    let guide;
    if (data.id) {
      guide = await prisma.guide.update({
        where: { id: data.id },
        data: payload,
      });
    } else {
      guide = await prisma.guide.create({
        data: payload,
      });
    }

    revalidatePath('/'); // Сброс кэша главной страницы
    revalidatePath('/admin');
    
    return { success: true, data: guide };
  } catch (error) {
    console.error("Ошибка сохранения гида:", error);
    return { success: false, error: "Не удалось сохранить профиль" };
  }
}