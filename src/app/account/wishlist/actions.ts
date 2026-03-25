"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function toggleCategorySubscription(categoryId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error("Unauthorized");

  // ОПТИМИЗАЦИЯ: Добавили select, чтобы не тянуть лишние данные (размеры, еду и тд) из базы
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!profile) throw new Error("Profile not found");

  // Проверяем, есть ли уже такая подписка
  const existing = await prisma.watchList.findUnique({
    where: {
      memberId_categoryId: {
        memberId: profile.id,
        categoryId: categoryId
      }
    },
    select: { id: true } // ОПТИМИЗАЦИЯ: Нам нужен только факт существования и ID
  });

  if (existing) {
    // Если есть — удаляем (отписка)
    await prisma.watchList.delete({
      where: { id: existing.id }
    });
  } else {
    // Если нет — создаем (подписка)
    await prisma.watchList.create({
      data: {
        memberId: profile.id,
        categoryId: categoryId
      }
    });
  }

  // Обновляем кэш страницы (теперь, с useOptimistic на клиенте, UI не будет ждать этот шаг)
  revalidatePath("/account/wishlist");
}