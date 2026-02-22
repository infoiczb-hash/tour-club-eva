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

