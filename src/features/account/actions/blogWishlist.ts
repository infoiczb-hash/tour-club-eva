// src/features/account/actions/blogWishlist.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFavoritePostAction(postId: string) {
  try {
  const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: 'unauthorized' };

    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!profile) return { success: false, error: 'profile_not_found' };

    // Проверяем, есть ли статья в избранном (предполагаем таблицу FavoritePost)
    const existing = await prisma.favoritePost.findUnique({
      where: {
        memberId_postId: {
          memberId: profile.id,
          postId: postId
        }
      }
    });

    if (existing) {
      await prisma.favoritePost.delete({ where: { id: existing.id } });
    } else {
      await prisma.favoritePost.create({
        data: {
          memberId: profile.id,
          postId: postId
        }
      });
    }

    revalidatePath('/account/wishlist');
    revalidatePath(`/blog`); 
    
    return { success: true, isFavorite: !existing };
  } catch (error) {
    console.error('Toggle post favorite error:', error);
    return { success: false, error: 'server_error' };
  }
}