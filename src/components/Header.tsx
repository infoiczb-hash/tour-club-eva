import React from 'react';
import HeaderClient from "@/components/layout/HeaderClient"; 
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

const baseNavLinks = [
  { name: "Туры", href: "/tour" },
  { name: "Направления", href: "/directions" },
  { name: "Fan-сектор", href: "/fun" },
  { name: "Блог", href: "/blog" },
  { name: "Гиды", href: "/guides" },
  { name: "О клубе", href: "/about" },
];

export default async function Header() {
  // Проверяем сессию на сервере (без задержек на клиенте)
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;

  if (user) {
    // Если юзер есть, достаем его профиль для аватарки
    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { name: true, phone: true }
    });
    
    userProfile = {
      name: profile?.name || null,
      phone: profile?.phone || user.phone || null
    };
  }

  return (
    <HeaderClient navLinks={baseNavLinks} user={userProfile} />
  );
}