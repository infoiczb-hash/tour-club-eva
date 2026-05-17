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
    // РИСК: Убедись, что внутри getTourCategoriesAction() используется unstable_cache. 
    // Если это просто вызов Prisma, страница может терять кэш.
  ]);

  const rawCategories = tCatRes.success && Array.isArray(tCatRes.data) ? tCatRes.data : [];

  // 2. ОПТИМИЗАЦИЯ: Жесткая "диета" для Payload
  // Оставляем только те поля, которые реально использует ToursBrowser.
  // Это кардинально уменьшает размер скачиваемого HTML и ускоряет гидратацию.
  const lightweightCategories = rawCategories.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    icon: c.icon,
    isActive: c.isActive,
  }));

  return (
    <ToursBrowser 
      tours={tours} 
      categories={lightweightCategories} 
      limit={limit} 
      title={title}
      subtitle={subtitle}
    />
  );
}