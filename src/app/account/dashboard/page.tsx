// src/app/account/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Clock, Users, TrendingUp,
  ChevronRight, Calendar, ArrowRight,
  Star, Flame,
} from 'lucide-react';
import VirtualCard from '@/features/account/components/VirtualCard';

// ─── уровни ─────────────────────────────────────────────────────────
const LEVELS = [
  { name: 'Первопроходец', min: 0,  max: 2  },
  { name: 'Походник',      min: 3,  max: 6  },
  { name: 'Бывалый',       min: 7,  max: 14 },
  { name: 'Ветеран',       min: 15, max: 29 },
  { name: 'Легенда клуба', min: 30, max: 30 },
];

const LEVEL_STYLES: Record<string, { bar: string; badge: string; glow: string }> = {
  'Первопроходец': { bar: 'bg-teal-500',   badge: 'text-teal-400 bg-teal-400/10 border-teal-400/20',   glow: 'shadow-teal-500/20'   },
  'Походник':      { bar: 'bg-green-500',  badge: 'text-green-400 bg-green-400/10 border-green-400/20', glow: 'shadow-green-500/20'  },
  'Бывалый':       { bar: 'bg-blue-500',   badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   glow: 'shadow-blue-500/20'   },
  'Ветеран':       { bar: 'bg-purple-500', badge: 'text-purple-400 bg-purple-400/10 border-purple-400/20', glow: 'shadow-purple-500/20' },
  'Легенда клуба': { bar: 'bg-amber-500',  badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20', glow: 'shadow-amber-500/20'  },
};

// ─── вспомогательные функции ─────────────────────────────────────────
function getProgressToNext(totalTours: number) {
  const current = LEVELS.find(l => totalTours >= l.min && totalTours <= l.max)
    ?? LEVELS[LEVELS.length - 1];
  const nextLevel = LEVELS[LEVELS.indexOf(current) + 1];

  if (!nextLevel) return { pct: 100, toNext: 0, nextName: null };

  const range = nextLevel.min - current.min;
  const done  = totalTours - current.min;
  const pct   = Math.min(Math.round((done / range) * 100), 100);
  const toNext = nextLevel.min - totalTours;

  return { pct, toNext, nextName: nextLevel.name };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getDashboardData(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  // ✅ ИСПРАВЛЕНИЕ: Ближайший предстоящий тур (теперь учитывает и туры без конкретной даты)
const upcomingBooking = await prisma.booking.findFirst({
    where: {
      memberId: profile.id,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        { tourDate: { startDate: { gte: new Date() } } },
        { tourDateId: null } // ✅ Теперь туры с открытой датой тоже попадают в ЛК
      ]
    },
    orderBy: { tourDate: { startDate: 'asc' } },
    include: {
      tour: {
        select: {
          title: true,
          slug: true,
          location: true,
          coverImage: true,
          difficulty: true,
          duration: true,
        },
      },
      tourDate: {
        select: {
          startDate: true,
          endDate: true,
          time: true,
          guide: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  // Статистика: уникальные гиды
  const uniqueGuides = await prisma.booking.findMany({
    where: { memberId: profile.id },
    include: {
      tourDate: { select: { guideId: true } },
    },
    distinct: ['tourDateId'],
  });
  const guideIds = new Set(
    uniqueGuides.map(b => b.tourDate?.guideId).filter(Boolean)
  );

  // Ночей вне дома — считаем из duration туров
  const bookingsForNights = await prisma.booking.findMany({
    where: { memberId: profile.id },
    include: { tour: { select: { duration: true } } },
  });
  const totalNights = bookingsForNights.reduce((sum, b) => {
    const d = parseInt(b.tour?.duration ?? '1') - 1;
    return sum + (isNaN(d) || d < 0 ? 0 : d);
  }, 0);

  // Последние 3 тура для блока "История"
  const recentBookings = await prisma.booking.findMany({
    where: { memberId: profile.id, status: { not: 'cancelled' } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      tour: {
        select: { title: true, slug: true, coverImage: true, location: true },
      },
      tourDate: { select: { startDate: true } },
    },
  });

  return {
    profile,
    upcomingBooking,
    stats: {
      totalTours: profile.totalTours,
      totalKm: Math.round(profile.totalKm),
      uniqueGuides: guideIds.size,
      totalNights,
    },
    recentBookings,
  };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/dashboard'); 

  const data = await getDashboardData(user.id);
  if (!data) redirect('/login?next=/account/dashboard');

  const { profile, upcomingBooking, stats, recentBookings } = data;
  const displayName = profile.name ?? 'Участник';

  return (
    <div className="space-y-6">

    {/* ── Приветствие + Виртуальная карта ────────────────────── */}
      <section className="flex flex-col mb-4">
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-1">Добро пожаловать,</p>
          <h1 className="text-3xl font-black text-white tracking-tight">{displayName}</h1>
        </div>
        
        <div className="w-full max-w-md mx-auto md:mx-0">
          <VirtualCard 
            name={displayName} 
            level={profile.level} 
            totalTours={stats.totalTours} 
            totalKm={stats.totalKm} 
            memberId={profile.id}
          />
        </div>
      </section>

        {/* ── Статистика ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Туров',    value: stats.totalTours,   unit: '',   icon: Flame    },
          { label: 'Км',       value: stats.totalKm,      unit: 'км', icon: TrendingUp },
          { label: 'Гидов',    value: stats.uniqueGuides, unit: '',   icon: Users    },
          { label: 'Ночей',    value: stats.totalNights,  unit: '',   icon: Star     },
        ].map(({ label, value, unit, icon: Icon }) => (
          <div
            key={label}
            className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">{label}</span>
              <Icon size={14} className="text-slate-600" />
            </div>
            <p className="text-2xl font-black text-white">
              {value}
              {unit && <span className="text-sm font-bold text-slate-400 ml-1">{unit}</span>}
            </p>
          </div>
        ))}
      </section>

      {/* ── Ближайший тур ───────────────────────────────────────── */}
      {upcomingBooking ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Ближайший тур
            </h2>
            <Link
              href="/account/bookings"
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Все брони <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
            {/* Фото */}
            {upcomingBooking.tour.coverImage && (
              <div className="relative h-40 w-full">
                <Image
                  src={upcomingBooking.tour.coverImage}
                  alt={upcomingBooking.tour.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                {/* Дата поверх фото */}
                {upcomingBooking.tourDate && (
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <Calendar size={14} className="text-teal-400" />
                    <span className="text-sm font-bold text-white">
                      {formatDate(upcomingBooking.tourDate.startDate)}
                      {upcomingBooking.tourDate.time && ` · ${upcomingBooking.tourDate.time}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 space-y-3">
              {/* Название */}
              <h3 className="text-lg font-black text-white leading-tight">
                {upcomingBooking.tour.title}
              </h3>

              {/* Детали */}
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                {upcomingBooking.tour.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {upcomingBooking.tour.location}
                  </span>
                )}
                {upcomingBooking.tour.duration && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {upcomingBooking.tour.duration}
                  </span>
                )}
              </div>

              {/* Гид */}
              {upcomingBooking.tourDate?.guide && (
                <div className="flex items-center gap-2 pt-1">
                  {upcomingBooking.tourDate.guide.image ? (
                    <Image
                      src={upcomingBooking.tourDate.guide.image}
                      alt={upcomingBooking.tourDate.guide.name}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-teal-400">
                        {upcomingBooking.tourDate.guide.name[0]}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-slate-400">
                    Гид: <span className="text-white font-medium">
                      {upcomingBooking.tourDate.guide.name}
                    </span>
                  </span>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/tour/${upcomingBooking.tour.slug}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all"
                >
                  О туре <ArrowRight size={14} />
                </Link>
                <Link
                  href="/account/bookings"
                  className="px-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-xl transition-all"
                >
                  Управление
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Нет предстоящих туров */
        <section className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-4">Нет предстоящих туров</p>
          <Link
            href="/tour"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            Найти тур <ArrowRight size={14} />
          </Link>
        </section>
      )}

      {/* ── Последние туры ──────────────────────────────────────── */}
      {recentBookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              История туров
            </h2>
            <Link
              href="/account/history"
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Все туры <ChevronRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {recentBookings.map(booking => (
              <Link
                key={booking.id}
                href={`/tour/${booking.tour.slug}`}
                className="flex items-center gap-3 bg-slate-900/60 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all group"
              >
                {/* Миниатюра */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {booking.tour.coverImage && (
                    <Image
                      src={booking.tour.coverImage}
                      alt={booking.tour.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                    {booking.tour.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.tourDate
                      ? formatDate(booking.tourDate.startDate)
                      : 'Дата не указана'
                    }
                    {booking.tour.location && ` · ${booking.tour.location}`}
                  </p>
                </div>

                <ChevronRight size={14} className="text-slate-600 group-hover:text-teal-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}