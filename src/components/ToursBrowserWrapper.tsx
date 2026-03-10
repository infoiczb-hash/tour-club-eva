import { getTours } from '@/features/tours/api'; 
import { getTourCategoriesAction } from '@/features/admin/actions/categories';
import ToursBrowser from '@/features/tours/components/ToursBrowser';

// 1. Описываем только те пропсы, которые передаются ИЗ главной страницы (page.tsx)
interface ToursBrowserWrapperProps {
  title?: string;
  subtitle?: string;
  limit?: number;
}

// 2. Убрали "use client" и next/dynamic. 
// Теперь это полноценный асинхронный СЕРВЕРНЫЙ компонент!
export default async function ToursBrowserWrapper({ 
  limit = 8, 
  title, 
  subtitle 
}: ToursBrowserWrapperProps) {
  
  // 3. Запрашиваем данные напрямую из базы параллельно
  const [tours, tCatRes] = await Promise.all([
    getTours(),
    getTourCategoriesAction(),
  ]);

  const categories = tCatRes.success ? tCatRes.data : [];

  // 4. Передаем данные в клиентский компонент ToursBrowser
  return (
    <ToursBrowser 
      tours={tours} 
      categories={categories} 
      limit={limit} 
      title={title}
      subtitle={subtitle}
    />
  );
}