'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

export async function upsertGuideAction(data: any) {
  try {
    await requireAuth(); // ✅ AUTH CHECK

    const payload = {
      name: data.name,
      slug: data.slug,
      role: data.role,
      image: data.image ?? null,
      actionImage: data.actionImage ?? null,
      bio: data.bio ?? null,
      fullBio: data.fullBio ?? null,
      experience: data.experience ?? null,
      superpower: data.superpower ?? null,
      achievements: data.achievements || [],
      tags: data.tags || [],
      quotes: data.quotes || [],
      stats: data.stats || [],
      instagram: data.instagram ?? null,
      telegram: data.telegram ?? null,
      contact: data.contact ?? null,
      order: parseInt(data.order) || 0,
      isActive: data.isActive ?? true,
    };

    let guide;
    if (data.id) {
      guide = await prisma.guide.update({ where: { id: data.id }, data: payload });
    } else {
      guide = await prisma.guide.create({ data: payload });
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, data: guide };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Unauthorized' };
    console.error('Ошибка сохранения гида:', error);
    return { success: false, error: 'Не удалось сохранить профиль' };
  }
}