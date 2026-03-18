import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, ChevronRight, TrendingUp } from 'lucide-react';
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

  // Все прошедшие брони, отсортированные от новых к старым
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
          duration: true,
          distance: true,
          category: { select: { title: true, color: true } },
        },
      },
      tourDate: {
        select: {
          startDate: true,
          guide: { select: { name: true, image: true } },
        },
      },
    },
  });

  // Проверяем какие туры уже имеют отзыв от этого участника
  const tourIdsWithReview = await prisma.review.findMany({
    where: {
      tourId: { in: bookings.map(b => b.tourId) },
      // ищем отзыв по имени или телефону участника
      name: profile.name ?? undefined,
    },
    select: { tourId: true },
  });
  const reviewedTourIds = new Set(tourIdsWithReview.map(r => r.tourId));

  // Агрегированная статистика
  const totalKm = bookings.reduce((sum, b) => {
    const km = parseFloat(b.tour.distance ?? '0');
    return sum + (isNaN(km) ? 0 : km);
  }, 0);

  // Уникальные сезоны
  const seasons = new Set(
    bookings
      .filter(b => b.tourDate)
      .map(b => `${getSeason(b.tourDate!.startDate).label} ${b.tourDate!.startDate.getFullYear()}`)
  );

  return {
    profile,
    bookings,
    reviewedTourIds,
    stats: {
      total: bookings.length,
      totalKm: Math.round(totalKm),
      seasons: seasons.size,
    },
  };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/history');

  const data = await getHistory(user.id);
  if (!data) redirect('/login?next=/account/history');

  const { bookings, reviewedTourIds, stats, profile } = data;

  return (
    <div className="space-y-6">

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">История туров</h1>
        <p className="text-sm text-slate-400">
          {stats.total > 0
            ? `${stats.total} ${plural(stats.total, 'приключение', 'приключения', 'приключений')} · ${stats.totalKm} км · ${stats.seasons} ${plural(stats.seasons, 'сезон', 'сезона', 'сезонов')}`
            : 'Здесь появятся ваши прошедшие туры'}
        </p>
      </div>

      {bookings.length === 0 ? (
        /* Пустое состояние */
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-white font-bold mb-2">Ваша история пока пуста</p>
          <p className="text-sm text-slate-400 mb-6">
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
        <div className="space-y-3">
          {bookings.map((booking, idx) => {
            const isFirst = idx === bookings.length - 1;
            const hasReview = reviewedTourIds.has(booking.tourId);
            const season = booking.tourDate ? getSeason(booking.tourDate.startDate) : null;
            const categoryColor: Record<string, string> = {
              teal:    'bg-teal-500/20 text-teal-400',
              blue:    'bg-blue-500/20 text-blue-400',
              green:   'bg-green-500/20 text-green-400',
              orange:  'bg-orange-500/20 text-orange-400',
              purple:  'bg-purple-500/20 text-purple-400',
            };
            const catStyle = categoryColor[booking.tour.category?.color ?? 'teal']
              ?? 'bg-teal-500/20 text-teal-400';

            return (
              <div
                key={booking.id}
                className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden"
              >
                <div className="flex gap-0">

                  {/* Миниатюра */}
                  <div className="relative w-24 sm:w-32 shrink-0">
                    {booking.tour.coverImage ? (
                      <Image
                        src={booking.tour.coverImage}
                        alt={booking.tour.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/20" />

                    {/* Метка "Начало пути" */}
                    {isFirst && (
                      <div className="absolute top-2 left-0 right-0 flex justify-center">
                        <span className="text-[10px] font-black bg-teal-500 text-white px-1.5 py-0.5 rounded-full">
                          Старт
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 min-w-0">

                    {/* Верхняя строка: категория + дата */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {booking.tour.category && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle}`}>
                          {booking.tour.category.title}
                        </span>
                      )}
                      {season && booking.tourDate && (
                        <span className="text-xs text-slate-500 shrink-0">
                          {season.emoji} {formatDate(booking.tourDate.startDate)}
                        </span>
                      )}
                    </div>

                    {/* Название */}
                    <Link
                      href={`/tour/${booking.tour.slug}`}
                      className="block text-sm font-black text-white hover:text-teal-400 transition-colors truncate mb-2"
                    >
                      {booking.tour.title}
                    </Link>

                    {/* Мета */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                      {booking.tour.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {booking.tour.location}
                        </span>
                      )}
                      {booking.tour.distance && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={10} /> {booking.tour.distance} км
                        </span>
                      )}
                      {booking.tour.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {booking.tour.duration}
                        </span>
                      )}
                    </div>

                    {/* Гид + кнопки */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Гид */}
                      {booking.tourDate?.guide ? (
                        <div className="flex items-center gap-1.5">
                          {booking.tourDate.guide.image ? (
                            <Image
                              src={booking.tourDate.guide.image}
                              alt={booking.tourDate.guide.name}
                              width={20}
                              height={20}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-teal-400">
                                {booking.tourDate.guide.name[0]}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-slate-500">
                            {booking.tourDate.guide.name}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Кнопки */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Кнопка отзыва */}
                        {!hasReview ? (
                          <ReviewFromCabinetButton
                            tourId={booking.tourId}
                            tourTitle={booking.tour.title}
                            memberName={profile.name ?? ''}
                          />
                        ) : (
                          <span className="text-xs text-teal-400/60 flex items-center gap-1">
                            ✓ Отзыв
                          </span>
                        )}

                        <Link
                          href={`/tour/${booking.tour.slug}`}
                          className="text-slate-600 hover:text-slate-300 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ─── склонение ───────────────────────────────────────────────────────
function plural(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs >= 11 && abs <= 19) return many;
  if (mod === 1) return one;
  if (mod >= 2 && mod <= 4) return few;
  return many;
}
