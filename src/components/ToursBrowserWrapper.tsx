import { getTours } from '@/features/tours/api'; 
import { getTourCategoriesAction } from '@/features/admin/actions/categories';
import ToursBrowser from '@/features/tours/components/ToursBrowser';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

interface ToursBrowserWrapperProps {
  title?: string;
  subtitle?: string;
  limit?: number;
}

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

  // 2. Считаем totalKm для авторизованного пользователя (только пройденные туры)
  let totalKm = 0;
  
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { id: true }
      });
      
      if (profile) {
        const now = new Date();
        // Берем только не отмененные туры, даты которых уже прошли
        const pastBookings = await prisma.booking.findMany({
          where: {
            memberId: profile.id,
            status: { not: 'cancelled' },
            tourDate: { startDate: { lt: now } },
          },
          include: { tour: { select: { distance: true } } }
        });

        // Суммируем дистанцию
        totalKm = pastBookings.reduce((sum, b) => {
          const km = parseFloat(b.tour?.distance ?? '0');
          return sum + (isNaN(km) ? 0 : km);
        }, 0);
      }
    }
  } catch (e) {
    console.error('Ошибка при подсчете пройденных километров:', e);
  }

  return (
    <ToursBrowser 
      tours={tours} 
      categories={categories} 
      limit={limit} 
      title={title}
      subtitle={subtitle}
      totalKm={totalKm} // 👈 Передаем вычисленный километраж клиенту
    />
  );
}