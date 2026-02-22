import React from 'react';
import { Metadata } from 'next';
import OrganizersLanding from '@features/directions/organizers/OrganizersLanding';

export const metadata: Metadata = {
  title: 'Корпоративы и Ретриты | Турклуб ЭВА',
  description: 'Организация выездов для компаний и групп. Сплавы, походы по Приднестровью, горы Румынии. Берем на себя логистику и быт, создаем душевную атмосферу.',
  openGraph: {
    title: 'Ваш надежный партнер в приключениях',
    // images: ['/images/b2b-og.jpg'],
  }
};

export default function OrganizersPage() {
  // Просто возвращаем компонент. Тег <main> и классы фона уже зашиты внутри него.
  return <OrganizersLanding />;
}