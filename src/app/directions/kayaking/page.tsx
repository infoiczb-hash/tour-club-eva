import React from 'react';
import { Metadata } from 'next';
// Закомментировали запрос к БД, пока не разберемся с зависанием
// import { getTours } from '@/features/tours/api'; 
import KayakingLanding from '@/features/directions/kayaking/KayakingLanding';

export const metadata: Metadata = {
  title: 'Сплавы на байдарках по Днестру | Турклуб ЭВА',
  description: 'Водные походы на каяках и байдарках. Маршруты по Днестру, каньоны, дикие пляжи.',
};

// УБРАЛИ async! Это теперь обычный синхронный компонент
export default function KayakingLandingPage() {
  return (
    <main>
      {/* Передаем пустой массив, чтобы ничего не ломалось */}
      <KayakingLanding tours={[]} />
    </main>
  );
}