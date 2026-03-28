import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  MapPin, Clock, ArrowRight,
  Timer, Backpack, FileText, Download, Wallet, Tent, Map, Moon, Hourglass
} from 'lucide-react';

import VirtualCard from '@/features/account/components/VirtualCard';
import BookingCard from '@/features/account/components/BookingCard';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';
import AchievementsBox from '@/features/account/components/AchievementsBox';
import ReferralCard from '@/features/account/components/ReferralCard'; // ✅ Вернули импорт рефералки

// ─── вспомогательные функции ─────────────────────────────────────────

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

  // 1. Все предстоящие брони (для вывода красивых билетов BookingCard)
  const upcomingBookings = await prisma.booking.findMany({
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
          title: true, slug: true, location: true, coverImage: true,
          difficulty: true, duration: true, checklist: true, documents: true, currency: true
        },
      },
      tourDate: {
        select: {
          startDate: true, endDate: true, time: true,
          guide: { select: { name: true, image: true } },
        },
      },
    },
  });

  // 2. Лист ожидания
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

  // 3. Честная история для статистики и Ачивок
  const pastConfirmedBookings = await prisma.booking.findMany({
    where: { 
      memberId: profile.id, 
      status: 'confirmed',
      tourDate: { startDate: { lt: now } }
    },
    include: { 
      tour: { select: { title: true, location: true, distance: true, duration: true } },
      tourDate: { select: { startDate: true, endDate: true } }
    },
  });

  // 4. Агрегация статистики и Ачивок
  let totalKm = 0;
  let totalNights = 0;
  const totalTours = pastConfirmedBookings.length;

  let waterTours = 0;
  let winterTours = 0;
  let pmrTours = 0;

  for (const b of pastConfirmedBookings) {
    // Метрики
    const km = parseFloat(b.tour?.distance ?? '0');
    totalKm += isNaN(km) ? 0 : km;

    if (b.tourDate?.startDate && b.tourDate?.endDate) {
      const diffTime = Math.abs(b.tourDate.endDate.getTime() - b.tourDate.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalNights += diffDays;
    } else if (b.tour?.duration) {
      const d = parseInt(b.tour.duration) - 1;
      totalNights += (isNaN(d) || d < 0 ? 0 : d);
    }

    // Логика Ачивок
    const title = b.tour?.title?.toLowerCase() || '';
    const location = b.tour?.location?.toLowerCase() || '';
    
    if (title.includes('сплав') || title.includes('байдарк') || title.includes('сап') || title.includes('sup')) {
      waterTours++;
    }
    if (location.includes('приднестровь') || location.includes('тирасполь') || location.includes('дубоссар') || location.includes('строенцы') || location.includes('рашков')) {
      pmrTours++;
    }
    if (b.tourDate?.startDate) {
      const month = b.tourDate.startDate.getMonth();
      if (month === 11 || month === 0 || month === 1) { // Декабрь, Январь, Февраль
        winterTours++;
      }
    }
  }

  return {
    profile,
    upcomingBookings,
    waitlists,
    stats: {
      totalTours,
      totalKm: Math.round(totalKm),
      balance: profile.balance || 0, 
      totalNights,
    },
    achievements: {
      waterTours,
      winterTours,
      pmrTours,
      totalKm: Math.round(totalKm),
      totalNights
    }
  };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/dashboard'); 

  const data = await getDashboardData(user.id);
  if (!data) redirect('/login?next=/account/dashboard');

  const { profile, upcomingBookings, waitlists, stats, achievements } = data;
  const displayName = profile.name ?? 'Участник';
  const inventoryCount = profile.inventory?.length || 0;

  // Берем самый ближайший тур для вывода чек-листа снаряжения и QR-кода на карту
  const nearestBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Личный кабинет</h1>
        <p className="text-slate-400 mt-2">Управляйте своими путешествиями и привилегиями</p>
      </div>

      {/* БЛОК 1: Основная сетка Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА: Виртуальная Карта */}
        <div className="xl:col-span-5 flex flex-col gap-4 order-2 xl:order-1">
          <div className="w-full max-w-md mx-auto xl:mx-0">
            <VirtualCard 
              name={displayName} 
              level={profile.level} 
              totalTours={stats.totalTours}
              totalKm={stats.totalKm}      
              memberId={profile.id}
              bookingShortId={nearestBooking?.shortId ?? null}
              tourTitle={nearestBooking?.tour?.title ?? null}
              tourStartDate={nearestBooking?.tourDate?.startDate ?? null}
            />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Баланс и Статистика */}
        <div className="xl:col-span-7 flex flex-col gap-6 order-1 xl:order-2">
          
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
              <Wallet size={80} className="text-amber-500" />
            </div>
            <h3 className="text-amber-500/80 font-medium text-sm mb-1 uppercase tracking-wider">Ваш баланс</h3>
            <div className="text-4xl font-black text-white flex items-baseline gap-2">
              {stats.balance} <span className="text-xl font-medium text-amber-500/50">₽</span>
            </div>
            <p className="text-sm text-amber-500/60 mt-3 max-w-[80%]">
              Используйте баланс для оплаты до 10% стоимости следующих приключений. Оставляйте отзывы для пополнения!
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 shadow-lg">
            <h3 className="text-slate-400 font-medium text-sm mb-6 uppercase tracking-wider">Вы прошли с нами</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Tent size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats.totalTours}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Туров</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                  <Map size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats.totalKm}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Километров</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Moon size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats.totalNights}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Ночей</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* БЛОК 2: ДОСТИЖЕНИЯ */}
      <section className="pt-2">
        <AchievementsBox stats={achievements} />
      </section>

      {/* ✅ БЛОК 3: РЕФЕРАЛЬНАЯ ПРОГРАММА (Вернули на место) */}
      <section className="pt-2">
        <ReferralCard name={profile.name} userId={profile.id} />
      </section>

      {/* БЛОК 4: ЛИСТ ОЖИДАНИЯ */}
      {waitlists.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Hourglass size={18} className="text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Лист ожидания
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitlists.map((w: any) => (
              <div key={w.id} className="flex items-center gap-4 bg-slate-900/60 border border-amber-500/20 rounded-xl p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{w.tour.title}</p>
                  <p className="text-xs text-amber-400/80 font-medium mt-1">
                    {w.tourDate ? formatDate(w.tourDate.startDate) : 'Жду новые даты'}
                  </p>
                </div>
                <div className="shrink-0">
                  <CancelWaitlistButton id={w.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* БЛОК 5: ПРЕДСТОЯЩИЕ ТУРЫ (БИЛЕТЫ) */}
      <section className="space-y-6 pt-4 border-t border-white/5">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Предстоящие поездки
        </h2>

        {upcomingBookings.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm mb-4">У вас пока нет запланированных туров</p>
            <Link href="/tour" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all">
              Выбрать приключение <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingBookings.map(booking => {
              const guestsCount = booking.ticketsAdult + booking.ticketsChild + booking.ticketsMember + (booking.ticketsFamily * 3);
              return <BookingCard key={booking.id} booking={{ ...booking, guestsCount }} />;
            })}
          </div>
        )}
      </section>

      {/* БЛОК 6: СНАРЯЖЕНИЕ И ДОКУМЕНТЫ (Только для ближайшего тура) */}
      {nearestBooking && (
        <section className="space-y-4 pt-4">
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Снаряжение */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0">
                    <Backpack size={20} />
                  </div>
                  <h3 className="text-white font-bold">Снаряжение для тура</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">
                  {inventoryCount > 0 
                    ? `В инвентаре профиля отмечено ${inventoryCount} ${pluralThings(inventoryCount)}. Сверьтесь со списком гида.`
                    : 'Сверьтесь со списком необходимых вещей перед выездом.'}
                </p>
              </div>
              <Link href={`/tour/${nearestBooking.tour.slug}#essentials`} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors text-center border border-white/5">
                Открыть чек-лист
              </Link>
            </div>

            {/* Документы */}
            {nearestBooking.tour.documents && Array.isArray(nearestBooking.tour.documents) && nearestBooking.tour.documents.length > 0 && (
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-white font-bold">Материалы и Документы</h3>
                </div>
                <div className="space-y-3">
                  {(nearestBooking.tour.documents as any[]).map((doc, idx) => (
                    doc.url && (
                      <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 transition-all group">
                        <Download size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white truncate">
                          {doc.title || 'Скачать файл'}
                        </span>
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

    </div>
  );
}