import React from 'react';
import HeaderClient from "@/components/layout/HeaderClient"; 
import { prisma } from '@/lib/prisma';
import { getServerUser } from '@/lib/auth';

const baseNavLinks = [
  { name: "Туры", href: "/tour" },
  { name: "Направления", href: "/directions" },
  { name: "Fan-сектор", href: "/fun" },
  { name: "Блог", href: "/blog" },
  { name: "Гиды", href: "/guides" },
  { name: "О клубе", href: "/about" },
];

export default async function Header() {
  // Запрашиваем кэшированного пользователя (без повторных сетевых запросов)
  const user = await getServerUser();

  let userProfile = null;

  if (user) {
    try {
      // 🔥 ДОБАВИЛИ id: true в select
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, name: true, phone: true }
      });
      
      // Если профиль найден, прокидываем его id вместе с остальными данными
      if (profile) {
        userProfile = {
          id: profile.id, // 🔥 ТЕПЕРЬ ID ПЕРЕДАЕТСЯ (нужен колокольчику)
          name: profile.name || null,
          phone: profile.phone || user.phone || null
        };
      }
    } catch (error) {
      console.error('Error fetching member profile in Header:', error);
      // Не роняем всё приложение, если БД не ответила — просто рендерим как для обычного юзера
    }
  }

  return (
    <HeaderClient navLinks={baseNavLinks} user={userProfile} />
  );
}