import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowRight, Wallet, Tent, Map, Moon, Hourglass, 
  Info, ChevronDown, Star, FlaskConical, Gift, Mountain
} from 'lucide-react';

import VirtualCard from '@/features/account/components/VirtualCard';
import BookingCard from '@/features/account/components/BookingCard';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';
import AchievementsBox from '@/features/account/components/AchievementsBox';
import ReferralCard from '@/features/account/components/ReferralCard';

// ✅ ОТКЛЮЧАЕМ КЭШИРОВАНИЕ, ЧТОБЫ ДАННЫЕ ВСЕГДА БЫЛИ СВЕЖИМИ
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── вспомогательные функции ─────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getDashboardData(userId: string) {
  // 1. Подтягиваем профиль и промокод
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
    include: { promoCode: true }
  });

  if (!profile) return null;

  // 2. ЛОГИКА АВТОГЕНЕРАЦИИ ПРОМОКОДА
  let promoCode = profile.promoCode;
  
  if (!promoCode) {
    const cleanName = profile.name ? profile.name.replace(/\s+/g, '').substring(0, 4).toUpperCase() : 'CLUB';
    const shortId = profile.id.substring(0, 4).toUpperCase();
    const baseCode = `EVA-${cleanName}-${shortId}`;

    try {
      promoCode = await prisma.promoCode.create({
        data: {
          code: baseCode,
          memberId: profile.id,
          discount: 10,
          reward: 10,
        }
      });
    } catch (e) {
      promoCode = await prisma.promoCode.create({
        data: {
          code: `${baseCode}-${Math.floor(Math.random() * 1000)}`,
          memberId: profile.id,
          discount: 10,
          reward: 10,
        }
      });
    }
  }

  const now = new Date();

  // 🚀 3. ТУРБО-РЕЖИМ: Параллельный запуск тяжелых запросов
  const [upcomingBookings, waitlists, pastConfirmedBookings] = await Promise.all([
    // Предстоящие брони
    prisma.booking.findMany({
      where: {
        memberId: profile.id,
        status: { in: ['pending', 'confirmed', 'awaiting_payment', 'moderation'] },
        OR: [
          { tourDate: { startDate: { gte: now } } },
          { tourDateId: null } 
        ]
      },
      orderBy: { tourDate: { startDate: 'asc' } },
      include: {
       tour: {
          select: {
            title: true, slug: true, location: true, meetingPoint: true, coverImage: true,
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
    }),

    // Лист ожидания (если нет телефона, сразу возвращаем пустой массив)
    profile.phone ? prisma.waitlist.findMany({
      where: { phone: profile.phone },
      include: {
        tour: { select: { title: true, slug: true, coverImage: true, location: true } },
        tourDate: { select: { startDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) : Promise.resolve([]),

    // Прошлые туры для статистики
    prisma.booking.findMany({
      where: { 
        memberId: profile.id, 
        status: 'confirmed',
        tourDate: { startDate: { lt: now } }
      },
      include: { 
        tour: { select: { title: true, location: true, distance: true, duration: true } },
        tourDate: { select: { startDate: true, endDate: true } }
      },
    })
  ]);

  // 4. Агрегация статистики и Ачивок (в памяти сервера - это мгновенно)
  let totalKm = 0;
  let totalNights = 0;
  const totalTours = pastConfirmedBookings.length;

  let waterTours = 0;
  let winterTours = 0;
  let pmrTours = 0;

  for (const b of pastConfirmedBookings) {
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
      if (month === 11 || month === 0 || month === 1) { 
        winterTours++;
      }
    }
  }

  return {
    profile,
    promoCode,
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

  const { profile, promoCode, upcomingBookings, waitlists, stats, achievements } = data;
  const displayName = profile.name ?? 'Участник';

  const nearestBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
      <div className="px-2 md:px-0">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Личный кабинет</h1>
        <p className="text-slate-300 mt-2">Управляйте своими путешествиями и привилегиями</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
        
        <div className="w-full xl:w-5/12 order-1 shrink-0 px-2 md:px-0">
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

        <div className="w-full xl:w-7/12 flex flex-col gap-6 order-2">
          
          <div className="order-1 xl:order-2 px-2 md:px-0">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-5 sm:p-6 shadow-lg">
              <h3 className="text-slate-300 font-bold text-xs sm:text-sm mb-4 sm:mb-6 uppercase tracking-wider flex items-center gap-2">
                <Mountain size={16} className="text-teal-500" /> Вы прошли с нами
              </h3>
              
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Tent size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white leading-none">{stats.totalTours}</div>
                    <div className="text-[12px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider mt-1.5">Туров</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                    <Map size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white leading-none">{stats.totalKm}</div>
                    <div className="text-[12px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider mt-1.5">Км</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Moon size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white leading-none">{stats.totalNights}</div>
                    <div className="text-[12px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider mt-1.5">Ночей</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-2 xl:order-1 px-2 md:px-0">
            <div className="bg-slate-900 border border-amber-500/20 rounded-3xl overflow-hidden shadow-lg">
              
              <div className="p-5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="text-amber-500/80 font-bold text-[12px] sm:text-xs uppercase tracking-widest mb-0.5">Ваш баланс</h3>
                    <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1.5">
                      {stats.balance} <span className="text-sm sm:text-base font-bold text-amber-500/50">₽</span>
                    </div>
                  </div>
                </div>
              </div>

              <details className="group border-t border-amber-500/10">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Как получать бонусы?
                  </span>
                  <ChevronDown size={16} className="text-slate-300 group-open:rotate-180 transition-transform duration-300" />
                </summary>
                
                <div className="px-4 pb-5 pt-1 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  
                  <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                    <Star size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">Отзывы о турах</p>
                      <p className="text-xs text-slate-300 leading-snug">Получите +10 ₽ за честный отзыв на сайте после прохождения маршрута.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                    <FlaskConical size={18} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">Fan-сектор</p>
                      <p className="text-xs text-slate-300 leading-snug">Проходите веселые тесты в личном кабинете и получайте +1 ₽ за каждый.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                    <Gift size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">Пригласить друга</p>
                      <p className="text-xs text-slate-300 leading-snug">Дайте другу промокод на 5% скидку. После его первой поездки вы получите бонус!</p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500/80 text-[12px] font-bold uppercase tracking-widest rounded-lg border border-amber-500/20">
                      Оплачивайте до 10% от стоимости тура
                    </span>
                  </div>

                </div>
              </details>
            </div>
          </div>

        </div>
      </div>

      <section className="pt-2">
        <AchievementsBox stats={achievements} />
      </section>

      <section className="pt-2 px-2 md:px-0">
        <ReferralCard 
          promoCode={promoCode.code} 
          rewardAmount={promoCode.reward} 
          friendReward={promoCode.discount} 
        />
      </section>

      {waitlists.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-white/5 px-2 md:px-0">
          <div className="flex items-center gap-2 mb-2">
            <Hourglass size={18} className="text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Лист ожидания
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitlists.map((w: any) => (
              <div key={w.id} className="flex items-center gap-4 bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4">
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

      <section className="space-y-6 pt-4 border-t border-white/5 px-2 md:px-0">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Предстоящие поездки
        </h2>

     {upcomingBookings.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 text-center">
            <p className="text-slate-300 text-sm mb-4">У вас пока нет запланированных туров</p>
            <Link href="/tour" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)]">
              Выбрать приключение <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingBookings.map(booking => {
              const guestsCount = booking.ticketsAdult + booking.ticketsChild + booking.ticketsMember + (booking.ticketsFamily * 3);
              return (
                <BookingCard 
                  key={booking.id} 
                  bookingId={booking.id}
                  booking={{ ...booking, guestsCount }} 
                />
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}