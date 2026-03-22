'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { MemberProfile } from '@prisma/client'; // 👈 Строгий тип из Prisma

export async function getMyProfileAction(): Promise<MemberProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const profile = await prisma.memberProfile.findUnique({ 
      where: { userId: user.id } 
    });
    
    return profile;
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    return null;
  }
}