// src/app/account/history/page.tsx

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Hourglass, Star } from 'lucide-react';
import ReviewFromCabinetButton from '@/features/account/components/ReviewFromCabinetButton';

// ─── утилиты ─────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getSeason(d: Date): { label: string; emoji: string } {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return { label: 'весна', emoji: '🌿' };
  if (m >= 5 && m <= 7) return { label: 'лето',  emoji: '☀️'  };
  if (m >= 8 && m <= 10) return { label: 'осень', emoji: '🍂' };
  return { label: 'зима', emoji: '❄️' };
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getHistory(userId: string) {
  const now = new Date();

  // 🔥 ТУРБО-РЕЖИМ: 3 запроса параллельно!
  const [profile, bookings, userReviews] = await Promise.all([
    // 1. Профиль (нужно только имя для компонента отзывов)
    prisma.memberProfile.findUnique({
      where: { userId },
      select: { id: true, name: true }
    }),

    // 2. Брони пользователя (сразу по userId)
    prisma.booking.findMany({
      where: {
        member: { userId },
        status: { not: 'cancelled' },
        tourDate: { startDate: { lt: now } },
      },
      orderBy: { tourDate: { startDate: 'desc' } },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            coverImage: true,
            category: { select: { title: true, color: true } },
          },
        },
        tourDate: {
          select: { startDate: true },
        },
      },
    }),

    // 3. Отзывы пользователя (сразу по userId)
    prisma.review.findMany({
      where: { member: { userId } },
      select: { tourId: true, isActive: true, rating: true },
    })
  ]);

  if (!profile) return null;

  // Делаем удобную мапу для быстрого поиска статуса отзыва O(1)
  const reviewsMap = new Map(userReviews.map(r => [r.tourId, r]));

  return { profile, bookings, reviewsMap };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/account/history');

  const data = await getHistory(user.id);
  if (!data) redirect('/login?next=/account/history');

  const { profile, bookings, reviewsMap } = data;

  return (
    <div className="space-y-8 pb-10">
     <div>
        <h1 className="text-2xl font-black text-ui-text mb-1">История путешествий</h1>
        <p className="text-sm text-ui-muted">
          Вы прошли с нами {bookings.length} {bookings.length === 1 ? 'тур' : bookings.length > 1 && bookings.length < 5 ? 'тура' : 'туров'}. Спасибо за доверие!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {bookings.map(booking => {
          const d = booking.tourDate?.startDate ? new Date(booking.tourDate.startDate) : null;
          const season = d ? getSeason(d) : null;
          const review = reviewsMap.get(booking.tourId);

          return (
          <div key={booking.id} className="bg-ui-panel border border-ui-border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:border-ui-accent/50 transition-colors">
              {/* Изображение */}
           <Link href={`/tour/${booking.tour.slug}`} className="block shrink-0 relative w-full sm:w-48 h-40 sm:h-32 rounded-2xl overflow-hidden group">
                <Image
                  src={booking.tour.coverImage || '/og-default.jpg'}
                  alt={booking.tour.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
               <div className="absolute inset-0 bg-gradient-to-t from-ui-bg/80 to-transparent sm:hidden" />
                {season && (
                  <div className="absolute top-2 left-2 bg-ui-panel/80 backdrop-blur-sm border border-ui-border px-2 py-1 rounded-lg text-xs font-bold text-ui-text uppercase tracking-wider flex items-center gap-1.5">
                    <span>{season.emoji}</span> {season.label}
                  </div>
                )}
              </Link>

              {/* Инфо */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                {booking.tour.category && (
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 text-${booking.tour.category.color}-400`}>
                    {booking.tour.category.title}
                  </p>
                )}
                <h3 className="text-base sm:text-lg font-bold text-ui-text leading-tight mb-2 truncate">
                  <Link href={`/tour/${booking.tour.slug}`} className="hover:text-ui-accent transition-colors">
                    {booking.tour.title}
                  </Link>
                </h3>
                
                {d && (
                  <p className="text-sm font-bold text-ui-muted mb-1">
                    {formatDate(d)}
                  </p>
                )}
               {booking.tour.location && (
                  <span className="flex items-center gap-1 text-xs text-ui-muted">
                    <MapPin size={12} /> {booking.tour.location}
                  </span>
                )}
              </div>

              {/* Блок отзыва (Кнопка или Статус) */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                {!review ? (
                  <ReviewFromCabinetButton
                    tourId={booking.tourId}
                    tourTitle={booking.tour.title}
                    memberName={profile.name ?? ''}
                  />
                ) : review.isActive ? (
                 <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 sm:px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <Star size={12} className="fill-emerald-400" />
                    Опубликован
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/20" title="Ждет проверки модератором">
                    <Hourglass size={12} className="animate-pulse" />
                    На модерации
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}