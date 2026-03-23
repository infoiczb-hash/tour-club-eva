import { getTours } from '@/features/tours/api'; 
import { getTourCategoriesAction } from '@/features/admin/actions/categories';
import ToursBrowser from '@/features/tours/components/ToursBrowser';

interface ToursBrowserWrapperProps {
  title?: string;
  subtitle?: string;
  limit?: number;
}

/**
 * Обертка для браузера туров.
 * Очищена от логики авторизации и подсчета КМ для поддержки ISR.
 */
export default async function ToursBrowserWrapper({ 
  limit = 8, 
  title, 
  subtitle 
}: ToursBrowserWrapperProps) {
  
  // 1. Запрашиваем туры и категории параллельно
  const [tours, tCatRes] = await Promise.all([
    getTours(),
    getTourCategoriesAction(),
  ]);

  const categories = tCatRes.success ? tCatRes.data : [];

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