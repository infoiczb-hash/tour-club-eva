// src/features/account/actions/checkWishlistStatus.ts
"use server";

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function checkWishlistStatusAction(tourId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, isWished: false };
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('tour_id', tourId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 — это "not found", не ошибка
      throw error;
    }

    return { 
      success: true, 
      isWished: !!data 
    };
  } catch (error) {
    console.error('❌ Ошибка при проверке статуса избранного:', error);
    return { success: false, isWished: false };
  }
}