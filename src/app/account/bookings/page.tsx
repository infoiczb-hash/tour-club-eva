import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, ArrowRight, CheckCircle, XCircle, AlertCircle, Hourglass } from 'lucide-react';
import TransferSpotButton from '@/features/account/components/TransferSpotButton';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton'; // 👈 Новый импорт

// ─── статусы брони ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Ожидает',
    icon: AlertCircle,
    style: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  confirmed: {
    label: 'Подтверждено',
    icon: CheckCircle,
    style: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  cancelled: {
    label: 'Отменено',
    icon: XCircle,
    style: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  },
} as const;

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPrice(price: number, currency: string) {
  return `${price.toLocaleString('ru-RU')} ${currency}`;
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getBookings(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const now = new Date();

  // Предстоящие
  const upcoming = await prisma.booking.findMany({
    where: {
      memberId: profile.id,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        { tourDate: { startDate: { gte: now } } },
        { tourDateId: null }, // брони без конкретной даты
      ],
    },
    orderBy: { tourDate: { startDate: 'asc' } },
    include: {
      tour: {
        select: {
          title: true, slug: true, location: true,
          coverImage: true, duration: true, currency: true,
        },
      },
      tourDate: {
        select: {
          startDate: true, endDate: true, time: true, spotsLeft: true,
          guide: { select: { name: true, image: true } },
        },
      },
    },
  });

  // Прошедшие (последние 5)
  const past = await prisma.booking.findMany({
    where: {
      memberId: profile.id,
      tourDate: { startDate: { lt: now } },
    },
    orderBy: { tourDate: { startDate: 'desc' } },
    take: 5,
    include: {
      tour: {
        select: { title: true, slug: true, coverImage: true, location: true, currency: true },
      },
      tourDate: { select: { startDate: true } },
    },
  });

  // 👇 ДОБАВЛЕНО: Лист ожидания (ищем по номеру телефона)
  let waitlists: any[] = [];
  if (profile.phone) {
    waitlists = await prisma.waitlist.findMany({
      where: { phone: profile.phone },
      include: {
        tour: { select: { title: true, slug: true, coverImage: true, location: true } },
        tourDate: { select: { startDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return { profile, upcoming, past, waitlists };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function BookingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/bookings');

  const data = await getBookings(user.id);
  if (!data) redirect('/login?next=/account/bookings');

  const { upcoming, past, waitlists } = data;

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои брони</h1>
        <p className="text-sm text-slate-400">Управляйте участием в турах и заявками</p>
      </div>

      {/* ── Лист ожидания (если есть) ─────────────────────────────── */}
      {waitlists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Hourglass size={16} className="text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Лист ожидания
            </h2>
          </div>

          <div className="space-y-3">
            {waitlists.map(waitlist => (
              <div
                key={waitlist.id}
                className="flex items-center gap-4 bg-slate-900/40 border border-amber-500/20 rounded-xl p-4 transition-all"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {waitlist.tour.coverImage ? (
                    <Image
                      src={waitlist.tour.coverImage}
                      alt={waitlist.tour.title}
                      fill
                      className="object-cover opacity-80"
                      sizes="48px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-amber-500/10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {waitlist.tour.title}
                  </p>
                  <p className="text-xs text-amber-400/80 font-medium">
                    {waitlist.tourDate ? formatDate(waitlist.tourDate.startDate) : 'Даты уточняются'}
                  </p>
                </div>
                <div className="shrink-0">
                  <CancelWaitlistButton id={waitlist.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Предстоящие ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Предстоящие
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm mb-4">Нет предстоящих бронирований</p>
            <Link
              href="/tour"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Найти тур <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          upcoming.map(booking => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            const totalTickets =
              booking.ticketsAdult +
              booking.ticketsChild +
              booking.ticketsMember +
              booking.ticketsFamily;

            return (
              <div
                key={booking.id}
                className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden"
              >
                {/* Фото + статус */}
                <div className="relative h-36">
                  {booking.tour.coverImage ? (
                    <Image
                      src={booking.tour.coverImage}
                      alt={booking.tour.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  {/* Статус */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${status.style}`}>
                      <StatusIcon size={11} />
                      {status.label}
                    </span>
                  </div>

                  {/* Дата */}
                  {booking.tourDate && (
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <Calendar size={13} className="text-teal-400" />
                      <span className="text-sm font-bold text-white">
                        {formatDate(booking.tourDate.startDate)}
                        {booking.tourDate.time && ` · ${booking.tourDate.time}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Контент */}
                <div className="p-4 space-y-3">
                  <h3 className="text-base font-black text-white">
                    {booking.tour.title}
                  </h3>

                  {/* Мета */}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    {booking.tour.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {booking.tour.location}
                      </span>
                    )}
                    {booking.tour.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {booking.tour.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {totalTickets} {totalTickets === 1 ? 'место' : 'места'}
                    </span>
                  </div>

                  {/* Гид */}
                  {booking.tourDate?.guide && (
                    <div className="flex items-center gap-2">
                      {booking.tourDate.guide.image ? (
                        <Image
                          src={booking.tourDate.guide.image}
                          alt={booking.tourDate.guide.name}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-teal-400">
                            {booking.tourDate.guide.name[0]}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-slate-400">
                        Гид: <span className="text-white font-medium">{booking.tourDate.guide.name}</span>
                      </span>
                    </div>
                  )}

                  {/* Сумма */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-xs text-slate-500">Итого</span>
                    <span className="text-sm font-bold text-white">
                      {formatPrice(booking.totalPrice, booking.tour.currency ?? 'MDL')}
                    </span>
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-2">
                    <Link
                      href={`/tour/${booking.tour.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 py-2.5 rounded-xl transition-all"
                    >
                      О туре <ArrowRight size={13} />
                    </Link>

                    {/* Передать место — только для pending/confirmed */}
                    {booking.status !== 'cancelled' && booking.tourDate && (
                      <TransferSpotButton
                        bookingId={booking.id}
                        tourTitle={booking.tour.title}
                        tourDate={booking.tourDate.startDate.toISOString()}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ── Прошедшие ───────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Прошедшие
          </h2>

          {past.map(booking => (
            <Link
              key={booking.id}
              href={`/tour/${booking.tour.slug}`}
              className="flex items-center gap-3 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all group"
            >
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                {booking.tour.coverImage && (
                  <Image
                    src={booking.tour.coverImage}
                    alt={booking.tour.title}
                    fill
                    className="object-cover opacity-60"
                    sizes="44px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-300 truncate group-hover:text-white transition-colors">
                  {booking.tour.title}
                </p>
                <p className="text-xs text-slate-600">
                  {booking.tourDate ? formatDate(booking.tourDate.startDate) : '—'}
                  {booking.tour.location && ` · ${booking.tour.location}`}
                </p>
              </div>
              <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">
                {formatPrice(booking.totalPrice, booking.tour.currency ?? 'MDL')}
              </span>
            </Link>
          ))}

          <Link
            href="/account/history"
            className="block text-center text-xs text-teal-400 hover:text-teal-300 transition-colors py-2"
          >
            Вся история туров →
          </Link>
        </section>
      )}

    </div>
  );
}