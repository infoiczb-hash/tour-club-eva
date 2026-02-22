import React from 'react';
import { Metadata } from 'next';
import KidsLandingClient from '@/features/directions/kids/KidsLanding'

export const metadata: Metadata = {
  title: 'Детские походы и лагерь | Турклуб ЭВА',
  description: 'Приключения для детей 8-16 лет. Лес, байдарки, костер и новые друзья. Безопасно, без гаджетов, под присмотром профессионалов.',
  openGraph: {
    title: 'Детские приключения | Вместо экрана — костер',
    images: ['/images/kids-camp-og.jpg'], // Замените на реальное фото
  }
};

export default function KidsPage() {
  return (
    <main className="bg-slate-950 min-h-screen selection:bg-amber-500/30">
      <KidsLandingClient />
    </main>
  );
}