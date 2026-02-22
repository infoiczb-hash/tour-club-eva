import React from 'react';
import { Metadata } from 'next';
import { getTours } from '@/features/tours/api'; // Проверьте путь к вашему API
import LocalProgram from '@/features/directions/local/LocalLanding';

export const metadata: Metadata = {
  title: 'Локальные путешествия по Приднестровью| Турклуб ЭВА',
  description: 'Авторские маршруты по родным краям. Цыпово, Рашков, Ягорлык, Строенцы, Днестр. Тишина, природа и перезагрузка рядом с домом.',
  openGraph: {
    title: 'Открой Приднестровье заново | Местные программы',
    // images: ['/images/local-og.jpg'], 
  }
};

export default async function LocalPage() {
  // 1. Получаем все туры
  const allTours = await getTours();

  // 2. Фильтруем: Ищем тег "local", "moldova" или категорию
  // Логику фильтрации можно адаптировать под вашу базу данных
  const localTours = allTours.filter(tour => 
    tour.type === 'hiking' || // Часто локальные - это хайкинг
    tour.title.toLowerCase().includes('молдова') ||
    tour.title.toLowerCase().includes('днестр') ||
    tour.title.toLowerCase().includes('строенцы')
  );

  return (
    <main className="bg-slate-950 min-h-screen selection:bg-emerald-500/30">
      <LocalProgram tours={localTours} />
    </main>
  );
}