// src/app/account/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Clock, TrendingUp,
  ChevronRight, Calendar, ArrowRight,
  Star, Flame, Timer, Backpack,
  FileText, Download, Wallet // 👈 ДОБАВИЛИ Wallet для баланса
} from 'lucide-react';
import VirtualCard from '@/features/account/components/VirtualCard';
import ReferralCard from '@/features/account/components/ReferralCard';

// ─── вспомогательные функции ─────────────────────────────────────────

function getDaysLeft(targetDate: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function pluralDays(n: number) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs >= 11 && abs <= 19) return 'дней';
  if (mod === 1) return 'день';
  if (mod >= 2 && mod <= 4) return 'дня';
  return 'дней';
}

function pluralThings(n: number) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs >= 11 && abs <= 19) return 'вещей';
  if (mod === 1) return 'вещь';
  if (mod >= 2 && mod <= 4) return 'вещи';
  return 'вещей';
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

  const now = new Date();

  // 1. Ближайший предстоящий тур (confirmed или pending)
  const upcomingBooking = await prisma.booking.findFirst({
    where: {
      memberId: profile.id,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        { tourDate: { startDate: { gte: now } } },
        { tourDateId: null } 
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
          checklist: true,
          documents: true,
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

  // 2. 🔥 ЧЕСТНАЯ ИСТОРИЯ: ТОЛЬКО 'confirmed' и ТОЛЬКО прошедшие
  const pastConfirmedBookings = await prisma.booking.findMany({
    where: { 
      memberId: profile.id, 
      status: 'confirmed',
      tourDate: { startDate: { lt: now } }
    },
    include: { 
      tour: { select: { distance: true, duration: true } },
      tourDate: { select: { startDate: true, endDate: true } }
    },
  });

  // 3. 🔥 АГРЕГАЦИЯ ЧЕСТНОЙ СТАТИСТИКИ
  let totalKm = 0;
  let totalNights = 0;
  const totalTours = pastConfirmedBookings.length;

  for (const b of pastConfirmedBookings) {
    // Считаем километры
    const km = parseFloat(b.tour?.distance ?? '0');
    totalKm += isNaN(km) ? 0 : km;

    // Считаем ночевки: Приоритет реальным датам, фолбэк на текстовое поле duration
    if (b.tourDate?.startDate && b.tourDate?.endDate) {
      const diffTime = Math.abs(b.tourDate.endDate.getTime() - b.tourDate.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalNights += diffDays;
    } else if (b.tour?.duration) {
      const d = parseInt(b.tour.duration) - 1;
      totalNights += (isNaN(d) || d < 0 ? 0 : d);
    }
  }

  // 4. Последние 3 брони (для ленты внизу дашборда)
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
      totalTours,
      totalKm: Math.round(totalKm),
      balance: profile.balance, // 👈 ТЯНЕМ БАЛАНС ИЗ ПРОФИЛЯ
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
  const inventoryCount = profile.inventory?.length || 0;

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
            totalTours={stats.totalTours} // 👈 ЧЕСТНОЕ КОЛИЧЕСТВО ТУРОВ
            totalKm={stats.totalKm}       // 👈 ЧЕСТНЫЙ КИЛОМЕТРАЖ
            memberId={profile.id}
          />
        </div>
      </section>

      {/* ── Реферальная программа ───────────────────────────────── */}
      <section>
        <ReferralCard name={profile.name} userId={profile.userId} />
      </section>

      {/* ── Статистика (ОБНОВЛЕННАЯ) ────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Туров',    value: stats.totalTours,   unit: '',    icon: Flame      },
          { label: 'Км',       value: stats.totalKm,      unit: 'км',  icon: TrendingUp },
          { label: 'Баланс',   value: stats.balance,      unit: 'MDL', icon: Wallet     }, // 👈 ЗАМЕНИЛИ ГИДОВ НА БАЛАНС
          { label: 'Ночей',    value: stats.totalNights,  unit: '',    icon: Star       },
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
                
                {/* Плашка обратного отсчета */}
                {upcomingBooking.tourDate && getDaysLeft(upcomingBooking.tourDate.startDate) >= 0 && (
                  <div className="absolute top-4 right-4 bg-teal-500 text-slate-950 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.5)] flex items-center gap-1.5 z-10">
                    <Timer size={14} className="animate-pulse" />
                    {getDaysLeft(upcomingBooking.tourDate.startDate) === 0
                      ? 'Тур уже сегодня!'
                      : `Через ${getDaysLeft(upcomingBooking.tourDate.startDate)} ${pluralDays(getDaysLeft(upcomingBooking.tourDate.startDate))}`}
                  </div>
                )}

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
              <h3 className="text-lg font-black text-white leading-tight">
                {upcomingBooking.tour.title}
              </h3>

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

          {/* Умный чек-лист снаряжения */}
          <div className="mt-4 bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                <Backpack size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Снаряжение для тура</h3>
                {inventoryCount > 0 ? (
                  <p className="text-xs text-slate-400 font-medium">
                    В вашем базовом инвентаре <strong className="text-teal-400">{inventoryCount} {pluralThings(inventoryCount)}</strong>. Сверьтесь со списком тура!
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">
                    Ваш базовый инвентарь пуст. Обязательно проверьте, что нужно взять с собой!
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/tour/${upcomingBooking.tour.slug}#essentials`}
              className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors text-center shrink-0"
            >
              Смотреть список
            </Link>
          </div>

          {/* Документы тура */}
          {(() => {
            interface TourDoc { title?: string; url?: string; }
            const docs = upcomingBooking.tour.documents as unknown as TourDoc[] | null;

            if (!Array.isArray(docs) || docs.length === 0) return null;

            return (
              <div className="mt-4 bg-slate-900/60 border border-white/5 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-blue-400" />
                  <h3 className="text-white font-bold text-sm">Материалы для скачивания</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docs.map((doc, idx) => {
                    if (!doc.url) return null;
                    return (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                          <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {doc.title || 'Документ к туру'}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Открыть файл
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })()}
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