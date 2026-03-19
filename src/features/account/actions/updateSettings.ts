'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SettingsSchema = z.object({
  name: z.string().min(2, "Имя обязательно"),
  email: z.string().email("Неверный формат email").or(z.literal("")).optional().nullable(),
  foodPref: z.string().optional().nullable(),
  shoeSize: z.string().optional().nullable(),
  clothesSize: z.string().optional().nullable(),
  lifeJacketSize: z.string().optional().nullable(),
  inventory: z.array(z.string()).default([]),
});

export type SettingsInput = z.infer<typeof SettingsSchema>;

export async function updateProfileSettingsAction(data: SettingsInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходима авторизация' };
  }

  const parsed = SettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Проверьте правильность заполнения полей' };
  }

  try {
    await prisma.memberProfile.update({
      where: { userId: user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        foodPref: parsed.data.foodPref || null,
        shoeSize: parsed.data.shoeSize || null,
        clothesSize: parsed.data.clothesSize || null,
        lifeJacketSize: parsed.data.lifeJacketSize || null,
        inventory: parsed.data.inventory,
      }
    });

    revalidatePath('/account/settings');
    revalidatePath('/account/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Update Settings Error:', error);
    return { success: false, error: 'Ошибка сохранения в базу данных' };
  }
}