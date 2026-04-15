'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ── Общий хелпер: получить profile.id текущего юзера ──────────────
async function getProfileId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// ── Проверить статус ───────────────────────────────────────────────
export async function getTourWishlistStatus(
  tourId: string
): Promise<{ inWishlist: boolean; watchlistId?: string; memberId?: string }> {
  const memberId = await getProfileId();
  if (!memberId) return { inWishlist: false };

  const item = await prisma.watchList.findUnique({
    where: { memberId_tourId: { memberId, tourId } },
    select: { id: true },
  });

  return { inWishlist: !!item, watchlistId: item?.id, memberId };
}

// ── Toggle ─────────────────────────────────────────────────────────
export async function toggleTourWishlistAction(
  tourId: string
): Promise<{ success: boolean; isWished?: boolean; needsAuth?: boolean }> {
  const memberId = await getProfileId();
  if (!memberId) return { success: false, needsAuth: true };

  const existing = await prisma.watchList.findUnique({
    where: { memberId_tourId: { memberId, tourId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.watchList.delete({ where: { id: existing.id } });
  } else {
    await prisma.watchList.create({ data: { memberId, tourId } });
  }

  revalidatePath('/tour');
  revalidatePath('/account/wishlist');

  return { success: true, isWished: !existing };
}