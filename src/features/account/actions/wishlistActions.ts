'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Добавить / убрать тур из вишлиста ──────────────────────────────
interface ToggleWishlistInput {
  tourId: string;
  memberId: string;
  watchlistId?: string;
  inWishlist: boolean;
}

export async function toggleWishlist(input: ToggleWishlistInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { tourId, memberId, watchlistId, inWishlist } = input;

  // Убеждаемся что memberId принадлежит этому юзеру
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id, id: memberId },
  });
  if (!profile) return { success: false };

  if (inWishlist) {
    // Убрать из вишлиста
    if (watchlistId) {
      await prisma.watchList.delete({ where: { id: watchlistId } });
    } else {
      await prisma.watchList.deleteMany({
        where: { memberId, tourId },
      });
    }
  } else {
    // Добавить в вишлист (upsert — защита от дублей)
    await prisma.watchList.upsert({
      where: { memberId_tourId: { memberId, tourId } },
      create: { memberId, tourId },
      update: {},
    });
  }

  revalidatePath('/account/wishlist');
  return { success: true };
}

// ─── Подписаться / отписаться от категории ──────────────────────────
interface ToggleCategoryInput {
  categoryId: string;
  memberId: string;
  subscribe: boolean;
}

export async function toggleCategorySubscription(
  input: ToggleCategoryInput
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { categoryId, memberId, subscribe } = input;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id, id: memberId },
  });
  if (!profile) return { success: false };

  if (subscribe) {
    await prisma.watchList.upsert({
      where: { memberId_categoryId: { memberId, categoryId } },
      create: { memberId, categoryId },
      update: {},
    });
  } else {
    await prisma.watchList.deleteMany({
      where: { memberId, categoryId },
    });
  }

  revalidatePath('/account/wishlist');
  return { success: true };
}

// ─── Проверить входит ли тур в вишлист участника ────────────────────
// Используется на странице тура для отображения кнопки ♡
export async function getTourWishlistStatus(
  tourId: string
): Promise<{ inWishlist: boolean; watchlistId?: string; memberId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { inWishlist: false };

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { inWishlist: false };

  const item = await prisma.watchList.findUnique({
    where: { memberId_tourId: { memberId: profile.id, tourId } },
  });

  return {
    inWishlist: !!item,
    watchlistId: item?.id,
    memberId: profile.id,
  };
}
