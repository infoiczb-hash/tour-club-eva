// src/features/account/actions/wishlistActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Подписаться / отписаться от категории ──────────────────────────
interface ToggleCategoryInput {
  categoryId: string;
  memberId: string;
  subscribe: boolean;
}

export async function toggleCategorySubscription(
  input: ToggleCategoryInput
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();
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