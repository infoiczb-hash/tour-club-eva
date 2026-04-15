'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { withAdminAuth } from '@/lib/auth';
import { withAdminAudit } from '@/lib/audit'; // ✅ Добавлено ядро аудита
import { Guide } from '@prisma/client';

type UpsertGuideInput = Partial<Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>> & { id?: string };

export const upsertGuideAction = withAdminAuth(
  withAdminAudit({
    actionName: 'UPSERT_GUIDE',
    getTargetId: (data: UpsertGuideInput) => data.id,
  })(async (data: UpsertGuideInput) => {
    try {
      // Проверка обязательных полей перед созданием
      if (!data.name) {
        return { success: false, error: 'Имя гида обязательно' };
      }
      if (!data.role) {
        return { success: false, error: 'Роль гида обязательна' };
      }

      // Для нового гида slug генерируется автоматически Prisma (cuid), но можно и задать
      const payload = {
        name: data.name,
        slug: data.slug, // Если не задан, Prisma сгенерирует cuid
        role: data.role,
        image: data.image ?? null,
        actionImage: data.actionImage ?? null,
        bio: data.bio ?? null,
        fullBio: data.fullBio ?? null,
        experience: data.experience ?? null,
        superpower: data.superpower ?? null,
        achievements: data.achievements ?? [],
        tags: data.tags ?? [],
        quotes: data.quotes ?? [],
        stats: data.stats ?? [],
        instagram: data.instagram ?? null,
        telegram: data.telegram ?? null,
        contact: data.contact ?? null,
        order: data.order ? Number(data.order) : 0,
        isActive: data.isActive ?? true,
      };

      let guide;
      if (data.id) {
        guide = await prisma.guide.update({
          where: { id: data.id },
          data: payload,
        });
      } else {
        guide = await prisma.guide.create({
          data: {
            ...payload,
            // slug автоматически сгенерируется через @default(cuid()), если не задан
          },
        });
      }

      revalidatePath('/');
      revalidatePath('/admin');
      revalidatePath('/guides');
      if (guide.slug) revalidatePath(`/guides/${guide.slug}`);

      return { success: true, data: guide };
    } catch (error: unknown) {
      console.error('Ошибка сохранения гида:', error);
      return { success: false, error: 'Не удалось сохранить профиль' };
    }
  })
);