"use client";

import dynamic from 'next/dynamic';
import { Tour } from '@/features/tours/types';

// 1. Описываем все возможные пропсы, которые нужны оригинальному ToursBrowser
interface ToursBrowserWrapperProps {
  tours: Tour[];
  categories?: any[];
  title?: string;
  subtitle?: string;
  limit?: number;
}

// 2. Динамический импорт с отключенным SSR
const ToursBrowser = dynamic(
  () => import('@/features/tours/components/ToursBrowser'),
  { 
    ssr: false,
    // Рекомендую добавить лоадер, чтобы при загрузке на клиенте 
    // страница не прыгала (улучшает метрику CLS)
    loading: () => (
      <div className="h-96 w-full max-w-7xl mx-auto bg-slate-100 dark:bg-slate-900/50 animate-pulse rounded-[2rem] mt-8" />
    )
  }
);

// 3. Принимаем все пропсы и прокидываем их дальше через {...props}
export default function ToursBrowserWrapper(props: ToursBrowserWrapperProps) {
  return <ToursBrowser {...props} />;
}