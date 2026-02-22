import React from 'react';
import { Metadata } from 'next';
import { getTours } from '@/features/tours/api';
import SupLandingClient from '@/features/directions/sup/SupLanding'

export const metadata: Metadata = {
  title: 'SUP Серфинг и Прогулки | Турклуб ЭВА',
  description: 'Сапбординг в Молдове и Приднестровье. Обучение, сплавы по Днестру, закаты и SUP-йога. Безопасно и доступно для новичков.',
  openGraph: {
    title: 'Открой мир SUP-серфинга',
     }
};

export default async function SupPage() {
  // Получаем туры и сразу фильтруем те, что относятся к воде/sup
  const allTours = await getTours();
  
  // Простая фильтрация: ищем в названии или типе слово "SUP" или "Вода"
  // Либо используйте ваш category id, если он есть (например, type === 'water')
  const supTours = allTours.filter(tour => 
    tour.type === 'water' || 
    tour.title.toLowerCase().includes('sup') ||
    tour.title.toLowerCase().includes('сплав')
  );

  return (
    <main className="bg-slate-950 min-h-screen">
      <SupLandingClient tours={supTours} />
    </main>
  );
}