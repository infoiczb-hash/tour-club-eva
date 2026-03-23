import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Clock, TrendingUp, ArrowRight, Send, Hourglass, User, CheckCircle2 } from 'lucide-react';
import WishlistToggle from '@/features/account/components/WishlistToggle';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';

// ─── загрузка данных ─────────────────────────────────────────────────
async function getWishlistData(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  // 1. Избранные туры
  const tourWishlist = await prisma.watchList.findMany({
    where: { memberId: profile.id, tourId: { not: null } },
    orderBy: { createdAt: 'desc' },
    include: {
      tour: {
        select: {
          id: true, title: true, slug: true, location: true, coverImage: true,
          duration: true, distance: true, price: true, currency: true, isActive: true,
          category: { select: { title: true, color: true } },
          tourDates: {
            where: { startDate: { gte: new Date() }, isActive: true },
            orderBy: { startDate: 'asc' },
            take: 1,
            select: { startDate: true, spotsLeft: true },
          },
        },
      },
    },
  });

  // 2. Любимые гиды (Новая фича)
  const guideWishlist = await prisma.watchList.findMany({
    where: { memberId: profile.id, guideId: { not: null } },
    orderBy: { createdAt: 'desc' },
    include: {
      guide: { select: { id: true, slug: true, name: true, role: true, image: true } }
    }
  });

  // 3. Лист ожидания (Waitlist)
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

  return {
    profile,
    tourWishlist,
    guideWishlist,
    waitlists,
  };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  teal:   { bg: 'bg-teal-500/10',   text: 'text-teal-400',   border: 'border-teal-500/20'   },
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20'},
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  sky:    { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/20'    },
};

function getCatStyle(color: string) {
  return CAT_COLORS[color] ?? CAT_COLORS.teal;
}

// ─── страница ────────────────────────────────────────────────────────
export default async function WishlistPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/wishlist');

  const data = await getWishlistData(user.id);
  if (!data) redirect('/login?next=/account/wishlist');

  const { profile, tourWishlist, guideWishlist, waitlists } = data;

  const totalItems = tourWishlist.length + guideWishlist.length + waitlists.length;

  return (
    <div className="space-y-8">

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои желания</h1>
        <p className="text-sm text-slate-400">
          Туры и гиды, за которыми вы следите, и ваши листы ожидания.
        </p>
      </div>

      {/* ── ИНТЕГРАЦИЯ С TELEGRAM (Задел на будущее) ──────────────── */}
      {!profile.tgChatId ? (
        <div className="bg-gradient-to-r from-sky-500/10 to-blue-600/10 border border-sky-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-sky-500/20 transition-colors" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center shrink-0 border border-sky-500/30 text-sky-400">
              <Send size={24} className="ml-[-2px]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base mb-1">Уведомления в Telegram</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Подключите бота, чтобы мгновенно узнавать, когда освобождается место в туре из листа ожидания.
              </p>
            </div>
          </div>
          <button className="relative z-10 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] active:scale-95 w-full md:w-auto shrink-0">
            Подключить
          </button>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
           <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
           <p className="text-sm text-emerald-100/80 font-medium">Telegram подключен. Вы будете получать пуш-уведомления.</p>
        </div>
      )}

      {/* ── ЛИСТ ОЖИДАНИЯ (Waitlist) ───────────────────────────────── */}
      {waitlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
             <div className="flex items-center gap-2">
                <Hourglass size={18} className="text-amber-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Лист ожидания
                </h2>
             </div>
             <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20">
               {waitlists.length}
             </span>
          </div>

          <div className="grid gap-3">
            {waitlists.map(wait => (
              <div key={wait.id} className="bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 flex items-center gap-4 transition-colors">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-800">
                  {wait.tour.coverImage && <Image src={wait.tour.coverImage} alt={wait.tour.title} fill className="object-cover opacity-80" sizes="64px" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/tour/${wait.tour.slug}`} className="text-white font-bold text-base hover:text-amber-400 truncate block transition-colors mb-1">
                    {wait.tour.title}
                  </Link>
                  <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest">
                    {wait.tourDate ? formatDate(wait.tourDate.startDate) : 'Жду любую дату'}
                  </p>
                </div>
                <div className="shrink-0">
                  <CancelWaitlistButton id={wait.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ИЗБРАННЫЕ ТУРЫ ─────────────────────────────────────── */}
      {tourWishlist.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-rose-400" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Сохраненные туры
              </h2>
            </div>
            <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
              {tourWishlist.length}
            </span>
          </div>

          <div className="space-y-3">
            {tourWishlist.map(item => {
              if (!item.tour) return null;
              const { tour } = item;
              const nextDate = tour.tourDates[0];
              const catStyle = getCatStyle(tour.category?.color ?? 'teal');
              const isLowSpots = nextDate && nextDate.spotsLeft <= 3;

              return (
                <div key={item.id} className="bg-slate-900/60 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden flex transition-colors group">
                  <div className="relative w-28 sm:w-36 shrink-0">
                    {tour.coverImage ? (
                      <Image src={tour.coverImage} alt={tour.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 112px, 144px" />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800" />
                    )}
                  </div>

                  <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                        {tour.category && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${catStyle.bg} ${catStyle.text} uppercase tracking-widest`}>
                            {tour.category.title}
                            </span>
                        )}
                        <WishlistToggle tourId={tour.id} memberId={profile.id} watchlistId={item.id} inWishlist={true} />
                        </div>

                        <Link href={`/tour/${tour.slug}`} className="block text-base font-black text-white hover:text-teal-400 transition-colors truncate mb-2">
                        {tour.title}
                        </Link>

                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                            {tour.location && <span className="flex items-center gap-1"><MapPin size={12} /> {tour.location}</span>}
                            {tour.duration && <span className="flex items-center gap-1"><Clock size={12} /> {tour.duration}</span>}
                            {tour.distance && <span className="flex items-center gap-1"><TrendingUp size={12} /> {tour.distance} км</span>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                      {nextDate ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-teal-400">
                            {formatDate(nextDate.startDate)}
                          </span>
                          {isLowSpots && (
                            <span className="text-[10px] font-bold text-amber-400 uppercase mt-0.5">
                              Осталось {nextDate.spotsLeft} мест
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Дат пока нет</span>
                      )}

                      <Link href={`/tour/${tour.slug}`} className="text-xs font-bold text-white bg-slate-800 hover:bg-teal-500 hover:text-slate-950 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">
                        Смотреть
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ЛЮБИМЫЕ ГИДЫ (НОВАЯ СЕКЦИЯ) ──────────────────────────── */}
      {guideWishlist.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <User size={18} className="text-violet-400" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Любимые гиды
              </h2>
            </div>
            <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
              {guideWishlist.length}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {guideWishlist.map(item => {
               if (!item.guide) return null;
               return (
                 <div key={item.id} className="bg-slate-900/60 border border-white/5 hover:border-violet-500/30 rounded-2xl p-4 flex items-center gap-4 transition-colors group">
                   <div className="w-14 h-14 rounded-full overflow-hidden relative bg-slate-800 shrink-0 border border-white/10 group-hover:border-violet-500/50 transition-colors">
                     {item.guide.image ? (
                       <Image src={item.guide.image} alt={item.guide.name} fill className="object-cover object-top" sizes="56px" />
                     ) : (
                       <User className="m-auto mt-4 text-slate-500" />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mb-0.5">{item.guide.role}</p>
                     <h3 className="text-white font-bold text-base truncate leading-none">{item.guide.name}</h3>
                   </div>
                   <Link href={`/guides/${item.guide.slug}`} className="text-[10px] font-bold text-violet-400 uppercase tracking-widest hover:text-white bg-violet-500/10 hover:bg-violet-500/20 px-3 py-2 rounded-lg transition-colors border border-violet-500/20">
                     Досье
                   </Link>
                 </div>
               )
            })}
          </div>
        </section>
      )}

      {/* ── ПУСТОЕ СОСТОЯНИЕ (Если вообще ничего нет) ────────────── */}
      {totalItems === 0 && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-6">
                <Heart size={32} />
            </div>
            <p className="text-xl font-black text-white mb-2 uppercase tracking-tight">Ваш список пуст</p>
            <p className="text-slate-400 text-sm mb-8 max-w-sm font-medium">
              Добавляйте туры в избранное, чтобы не потерять их, и подписывайтесь на любимых гидов.
            </p>
            <Link
              href="/tour"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-95"
            >
              Перейти в каталог <ArrowRight size={18} />
            </Link>
          </div>
      )}

    </div>
  );
}