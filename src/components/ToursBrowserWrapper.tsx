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

// 🔥 ВЫЧИСЛЕНИЯ НА СЕРВЕРЕ (Снимаем нагрузку с мобильного процессора)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toursWithPrecalculatedDates = tours.map((tour: any) => {
    const dateObj = tour.date ? new Date(tour.date) : null;
    const isPastDate = dateObj ? dateObj.getTime() < today.getTime() : false;
    
    let futureCount = 0;
    if (Array.isArray(tour.dates)) {
      futureCount = tour.dates.filter((d: any) => {
        const end = d.end ? new Date(d.end) : new Date(d.start);
        end.setHours(0, 0, 0, 0);
        return end >= today;
      }).length;
    }

    return {
      ...tour,
      // Инжектим готовые строки, чтобы клиентский компонент вообще не думал
      precalculated: {
        dateStr: dateObj ? dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Скоро',
        isPast: isPastDate,
        hasMoreDates: futureCount > 1
      }
    };
  });

  return (
    <ToursBrowser 
      tours={toursWithPrecalculatedDates} 
      categories={lightweightCategories} 
      limit={limit} 
      title={title}
      subtitle={subtitle}
    />
  );
}