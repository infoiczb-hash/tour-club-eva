import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { Prisma, MemberProfile } from '@prisma/client';

//   СТРОГАЯ ТИПИЗАЦИЯ ЧЕРЕЗ PRISMA PAYLOAD
export type DashboardBooking = Prisma.BookingGetPayload<{
  include: {
    tour: {
      select: {
        title: true; slug: true; location: true; meetingPoint: true;
        coverImage: true; difficulty: true; duration: true;
        checklist: true; documents: true; currency: true;
      }
    };
    tourDate: {
      select: { startDate: true; endDate: true; time: true }
    };
  }
}>;

export type DashboardWaitlist = Prisma.WaitlistGetPayload<{
  include: {
    tour: { select: { title: true; slug: true } };
    tourDate: { select: { startDate: true } };
  }
}>;

export interface DashboardData {
  profile: MemberProfile;
  promoCode: string;
  upcomingBookings: DashboardBooking[];
  waitlists: DashboardWaitlist[];
  unreadCount: number;
  stats: {
    totalTours: number;
    totalKm: number;
    totalNights: number;
    balance: number;
  };
  achievements: {
    waterTours: number;
    winterTours: number;
    pmrTours: number;
    totalKm: number;
    totalNights: number;
  };
}

export const getDashboardData = cache(async (userId: string): Promise<DashboardData | null> => {
  // 1. Получаем профиль по userId (Supabase ID)
  let profile = await prisma.memberProfile.findUnique({
    where: { userId },
    include: { promoCode: true }
  });

  if (!profile) return null;

  // 🔴 КРИТИЧНО: Дальше везде используем memberId (внутренний UUID профиля), а не userId!
  const memberId = profile.id;

  // 2. Генерация промокода (Связь 1-к-1)
  if (!profile.promoCode) {
    const code = nanoid(8).toUpperCase();
    await prisma.promoCode.create({
      data: {
        code,
        discount: 10,
        type: 'percent',
        memberId: memberId, // Привязка к memberId профиля
      }
    });
    // Перезапрашиваем профиль, чтобы подтянуть новый код
    profile = await prisma.memberProfile.findUnique({
      where: { userId },
      include: { promoCode: true }
    });
  }

  const promoCodeStr = profile?.promoCode?.code || '';

 // 3. Предстоящие бронирования (все активные)
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      memberId,
      status: { not: 'cancelled' }, // ✅ ИСПРАВЛЕНО: Показываем всё, кроме отмененных
      tourDate: { startDate: { gte: new Date() } }
    },
    include: {
      tour: {
        select: {
          title: true, slug: true, location: true, meetingPoint: true,
          coverImage: true, difficulty: true, duration: true,
          checklist: true, documents: true, currency: true
        }
      },
      tourDate: {
        select: { startDate: true, endDate: true, time: true }
      }
    },
    orderBy: { tourDate: { startDate: 'asc' } }
  });

  // 4. Лист ожидания
  const waitlists = await prisma.waitlist.findMany({
    where: { memberId }, // Используем memberId
    include: {
      tour: { select: { title: true, slug: true } },
      tourDate: { select: { startDate: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 5. Уведомления
  const unreadCount = await prisma.notification.count({
    where: { memberId, isRead: false } // Используем memberId
  });

  //   6. СТАТИСТИКА: Считаем только уникальные, подтвержденные и ПРОШЕДШИЕ туры
  const allConfirmedBookings = await prisma.booking.findMany({
    where: {
     memberId,
      status: 'confirmed',
      tourDate: { startDate: { lt: new Date() } }, // Только прошедшие
    },
    include: {
      tour: { include: { category: true } },
      tourDate: { select: { id: true, startDate: true, endDate: true } },
    },
  });

  //   СХЛОПЫВАЕМ ДУБЛИ: Если на одну дату куплено 3 билета, считаем как 1 поездку
  // Используем Map для фильтрации по уникальному tourDateId
  const uniqueTrips = Array.from(
    new Map(allConfirmedBookings.map(b => [b.tourDateId, b])).values()
  );

  const stats = {
    totalTours: uniqueTrips.length,
    
    //   УМНЫЙ ПАРСИНГ КМ: Вытаскиваем число даже из строк типа "Около 15 км" или "12-15"
    totalKm: uniqueTrips.reduce((sum, b) => {
      const distanceStr = String(b.tour?.distance || '');
      const match = distanceStr.match(/\d+(\.\d+)?/);
      return sum + (match ? parseFloat(match[0]) : 0);
    }, 0),
    
    //   НОЧИ: Считаем по реальной разнице дат (минимум 24ч для 1 ночи)
    totalNights: uniqueTrips.reduce((sum, b) => {
      const start = b.tourDate?.startDate;
      const end = b.tourDate?.endDate;
      if (!start || !end) return sum;
      
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      const nights = Math.floor(diffMs / 86_400_000); // 86400000 мс в сутках
      return sum + (nights > 0 ? nights : 0);
    }, 0),
    
    balance: profile?.balance || 0,
  };

  //   7. ДОСТИЖЕНИЯ: Базируются на том же массиве уникальных поездок
  const achievements = {
    // Водные туры: проверка по слагам категорий
    waterTours: uniqueTrips.filter(b => 
      ['water', 'sup', 'kayaking'].includes(b.tour.category?.slug || '')
    ).length,
    
    // Зимние туры: проверка по слагу
    winterTours: uniqueTrips.filter(b => 
      b.tour.category?.slug === 'winter'
    ).length,
    
    // ПМР: проверка по вхождению в строку локации
    pmrTours: uniqueTrips.filter(b => 
      b.tour.location?.includes('Приднестровье')
    ).length,
    
    // Переиспользуем уже посчитанные точные данные
    totalKm: stats.totalKm,
    totalNights: stats.totalNights
  };

  return {
    profile: profile as MemberProfile,
    promoCode: promoCodeStr,
    upcomingBookings,
    waitlists,
    unreadCount,
    stats,
    achievements
  };
});