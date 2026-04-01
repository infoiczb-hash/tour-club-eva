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
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const now = new Date();

  // Все прошедшие брони
  const bookings = await prisma.booking.findMany({
    where: {
      memberId: profile.id,
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
  });

  // Достаем отзывы с их статусами (isActive)
  const userReviews = await prisma.review.findMany({
    where: {
      tourId: { in: bookings.map(b => b.tourId) },
      memberId: profile.id, 
    },
    select: { tourId: true, isActive: true, rating: true },
  });
  
  // Делаем удобную мапу для быстрого поиска статуса
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

  const { bookings, reviewsMap, profile } = data;

  return (
    <div className="space-y-6 max-w-4xl">

     {/* Заголовок */}
      <div className="mb-6 px-2 md:px-0">
        <h1 className="text-2xl font-black text-white mb-1">Архив поездок</h1>
        <p className="text-sm text-slate-300">
          {bookings.length > 0
            ? 'Ваши прошедшие туры и воспоминания'
            : 'Здесь появятся ваши прошедшие туры'}
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-10 text-center mx-2 md:mx-0">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-white font-bold mb-2">Ваша история пока пуста</p>
          <p className="text-sm text-slate-300 mb-6">
            После прохождения первого тура здесь появится ваша летопись приключений
          </p>
          <Link
            href="/tour"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            Найти первый тур
          </Link>
        </div>
      ) : (
        <div className="space-y-3 px-2 md:px-0">
          {bookings.map((booking) => {
            const review = reviewsMap.get(booking.tourId);
            const season = booking.tourDate ? getSeason(booking.tourDate.startDate) : null;
            const catStyle = booking.tour.category?.color === 'teal' ? 'bg-teal-500/20 text-teal-400' : 'bg-blue-500/20 text-blue-400';

            return (
              <div
                key={booking.id}
                className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 flex gap-4 items-center transition-colors hover:bg-slate-900/80"
              >
                {/* Компактное квадратное фото */}
                <Link href={`/tour/${booking.tour.slug}`} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-800 hidden sm:block">
                  {booking.tour.coverImage && (
                    <Image src={booking.tour.coverImage} alt={booking.tour.title} fill className="object-cover" sizes="80px" />
                  )}
                </Link>

                {/* Контент */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    {booking.tour.category && (
                      <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${catStyle}`}>
                        {booking.tour.category.title}
                      </span>
                    )}
                    {season && booking.tourDate && (
                      <span className="text-xs text-slate-300 shrink-0">
                        {season.emoji} {formatDate(booking.tourDate.startDate)}
                      </span>
                    )}
                  </div>

                  <Link href={`/tour/${booking.tour.slug}`} className="block text-sm sm:text-base font-black text-white hover:text-teal-400 transition-colors truncate mb-1">
                    {booking.tour.title}
                  </Link>

                  {booking.tour.location && (
                    <span className="flex items-center gap-1 text-xs text-slate-300">
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
                    <div className="flex items-center gap-1.5 text-[12px] sm:text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 sm:px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <Star size={12} className="fill-emerald-400" />
                      Опубликован
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[12px] sm:text-xs text-amber-400 font-bold bg-amber-500/10 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/20" title="Ждет проверки модератором">
                      <Hourglass size={12} className="animate-pulse" />
                      На модерации
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}