import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { Prisma, MemberProfile } from '@prisma/client';

// ✅ СТРОГАЯ ТИПИЗАЦИЯ ЧЕРЕЗ PRISMA PAYLOAD
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

  // 3. Предстоящие бронирования (статус 'confirmed')
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      memberId,
      status: 'confirmed', // Правильный статус из схемы
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

  // 6. Статистика (считаем по всем confirmed бронированиям)
  const allConfirmedBookings = await prisma.booking.findMany({
    where: { memberId, status: 'confirmed' },
    include: { tour: { include: { category: true } } }
  });

  const stats = {
    totalTours: allConfirmedBookings.length,
    totalKm: allConfirmedBookings.reduce((sum, b) => sum + (Number(b.tour.distance) || 0), 0),
    totalNights: allConfirmedBookings.reduce((sum, b) => sum + (b.tour.duration ? parseInt(b.tour.duration) - 1 : 0), 0),
    balance: profile?.balance || 0
  };

  const achievements = {
    waterTours: allConfirmedBookings.filter(b => ['water', 'sup', 'kayaking'].includes(b.tour.category?.slug || '')).length,
    winterTours: allConfirmedBookings.filter(b => b.tour.category?.slug === 'winter').length,
    pmrTours: allConfirmedBookings.filter(b => b.tour.location?.includes('Приднестровье')).length,
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