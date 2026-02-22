import React from 'react';
import { Metadata } from 'next';
// Закомментировали запрос к БД, пока не разберемся с зависанием
// import { getTours } from '@/features/tours/api'; 
import HikesLanding from '@/features/directions/hiking/HikesLanding';

export const metadata: Metadata = {
  title: 'Походы и горы с Турклуб ЭВА',
  description: 'Походы и туры в Румынию и другие страны.',
};

// УБРАЛИ async! Это теперь обычный синхронный компонент
export default function HikingPage() {
  
  // Когда почините запрос к БД, раскомментируйте getTours, 
  // верните async функции и передайте const tours = await getTours()
  
  return (
      <HikesLanding tours={[]} />
  );
}