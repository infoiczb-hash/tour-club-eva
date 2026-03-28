import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, Bell, MapPin, Clock, TrendingUp, ArrowRight,
  Hourglass, Send, BookOpen, CheckCircle2 
} from 'lucide-react';
import WishlistToggle from '@/features/account/components/WishlistToggle';
import CategoryPills from './components/CategoryPills';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'evaturclub_bot';

// ─── загрузка данных ─────────────────────────────────────────────────
async function getWishlistData(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  // 1. Лист ожидания (Waitlist) - ТЕПЕРЬ УМНЫЙ (по memberId и phone)
  const waitlists = await prisma.waitlist.findMany({
    where: {
      OR: [
        { memberId: profile.id },
        ...(profile.phone ? [{ phone: profile.phone }] : [])
      ]
    },
    include: {
      tour: { select: { title: true, slug: true, coverImage: true, location: true } },
      tourDate: { select: { startDate: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Вишлист туров (ОРИГИНАЛ - с подтягиванием ближайшей даты и мест)
  const tourWishlist = await prisma.watchList.findMany({
    where: { memberId: profile.id, tourId: { not: null } },
    orderBy: { createdAt: 'desc' },
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
          price: true,
          currency: true,
          isActive: true,
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

  // 3. Избранные Статьи Блога
  const favoritePosts = await prisma.favoritePost.findMany({
    where: { memberId: profile.id },
    include: {
      post: { select: { id: true, title: true, slug: true, image: true, read_time: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 4. Категории для Pill-тегов
  const categorySubscriptions = await prisma.watchList.findMany({
    where: { memberId: profile.id, categoryId: { not: null } },
    select: { categoryId: true }
  });

  const allCategories = await prisma.tourCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, title: true, icon: true, color: true },
  });

  const subscribedCategoryIds = categorySubscriptions.map(s => s.categoryId).filter(Boolean) as string[];

  return {
    profile,
    waitlists,
    tourWishlist,
    favoritePosts,
    allCategories,
    subscribedCategoryIds,
  };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── цвета категорий (ОРИГИНАЛ) ──────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  teal:   { bg: 'bg-teal-500/10',   text: 'text-teal-400',   border: 'border-teal-500/20'   },
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20'  },
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

  const {
    profile,
    waitlists,
    tourWishlist,
    favoritePosts,
    allCategories,
    subscribedCategoryIds,
  } = data;

  const isTelegramConnected = Boolean(profile.tgChatId);
  const telegramLink = `https://t.me/${BOT_USERNAME}?start=user_${profile.id}`;

  return (
    <div className="space-y-8 max-w-4xl pb-10">

      {/* ── Заголовок ── */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои желания</h1>
        <p className="text-sm text-slate-400">
          Туры и статьи, за которыми вы следите, и ваши листы ожидания.
        </p>
      </div>

      {/* ── УМНЫЙ TELEGRAM БАННЕР ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors ${
        isTelegramConnected 
          ? 'bg-emerald-950/30 border-emerald-500/20' 
          : 'bg-slate-900 border-teal-500/20'
      }`}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex items-start gap-4 relative z-10">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isTelegramConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-teal-500/20 text-teal-400'
          }`}>
            {isTelegramConnected ? <CheckCircle2 size={24} /> : <Send size={24} className="-ml-1" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isTelegramConnected ? 'Telegram подключен' : 'Уведомления в Telegram'}
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              {isTelegramConnected 
                ? 'Вы первыми узнаете о новых датах для туров из вашего листа ожидания.'
                : 'Подключите бота, чтобы мгновенно узнавать, когда открывается запись на тур из листа ожидания.'}
            </p>
          </div>
        </div>

        {!isTelegramConnected && (
          <a 
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 shrink-0 w-full sm:w-auto text-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            Подключить
          </a>
        )}
      </div>

      {/* ── ЛИСТ ОЖИДАНИЯ ── */}
      {waitlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Hourglass size={18} className="text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Лист ожидания ({waitlists.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {waitlists.map((w: any) => (
              <div key={w.id} className="flex items-center gap-4 bg-slate-900/60 border border-amber-500/20 rounded-xl p-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {w.tour.coverImage && (
                    <Image src={w.tour.coverImage} alt={w.tour.title} fill className="object-cover opacity-80" sizes="56px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{w.tour.title}</p>
                  <p className="text-xs text-amber-400/80 font-medium mt-0.5">
                    {w.tourDate ? `Хотел на ${formatDate(w.tourDate.startDate)}` : 'Жду новые даты'}
                  </p>
                </div>
                <div className="shrink-0 pr-1">
                    <CancelWaitlistButton id={w.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── СОХРАНЁННЫЕ ТУРЫ (Оригинал) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Heart size={14} className="text-rose-400" />
            Туры
            {tourWishlist.length > 0 && (
              <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {tourWishlist.length}
              </span>
            )}
          </h2>
          <Link href="/tour" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
            Все туры →
          </Link>
        </div>

        {tourWishlist.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 text-center">
            <Heart size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-2">Нет сохранённых туров</p>
            <p className="text-xs text-slate-600 mb-4">Нажмите ♡ на странице тура чтобы добавить в вишлист</p>
            <Link href="/tour" className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors">
              Смотреть туры <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tourWishlist.map(item => {
              if (!item.tour) return null;
              const { tour } = item;
              const nextDate = tour.tourDates[0];
              const catStyle = getCatStyle(tour.category?.color ?? 'teal');
              const isLowSpots = nextDate && nextDate.spotsLeft <= 3 && nextDate.spotsLeft > 0;

              return (
                <div key={item.id} className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden flex">
                  {/* Фото */}
                  <div className="relative w-24 sm:w-28 shrink-0">
                    {tour.coverImage ? (
                      <Image src={tour.coverImage} alt={tour.title} fill className="object-cover" sizes="112px" />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800" />
                    )}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      {tour.category && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                          {tour.category.title}
                        </span>
                      )}
                      <WishlistToggle
                        tourId={tour.id}
                        memberId={profile.id}
                        watchlistId={item.id}
                        inWishlist={true}
                      />
                    </div>

                    <Link href={`/tour/${tour.slug}`} className="block text-sm font-black text-white hover:text-teal-400 transition-colors truncate mb-2">
                      {tour.title}
                    </Link>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
                      {tour.location && <span className="flex items-center gap-1"><MapPin size={10} /> {tour.location}</span>}
                      {tour.duration && <span className="flex items-center gap-1"><Clock size={10} /> {tour.duration}</span>}
                      {tour.distance && <span className="flex items-center gap-1"><TrendingUp size={10} /> {tour.distance} км</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      {nextDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-teal-400 font-medium">{formatDate(nextDate.startDate)}</span>
                          {isLowSpots && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                              Осталось {nextDate.spotsLeft} мест
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">Дат пока нет</span>
                      )}
                      <Link href={`/tour/${tour.slug}`} className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                        {nextDate ? 'Записаться' : 'Подробнее'} →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── ИЗБРАННЫЕ СТАТЬИ БЛОГА ── */}
      {favoritePosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <BookOpen size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Сохраненные статьи ({favoritePosts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoritePosts.map((sp: any) => (
              <Link key={sp.id} href={`/blog/${sp.post.slug}`} className="group flex items-start gap-4 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-colors">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {sp.post.image && (
                    <Image src={sp.post.image} alt={sp.post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="64px" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white line-clamp-2 transition-colors leading-snug">{sp.post.title}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                    {sp.post.read_time ? `${sp.post.read_time} мин чтения` : 'Статья'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── ПОДПИСКИ НА КАТЕГОРИИ (Чистый UI с Pill-тегами) ── */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-teal-400" />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Направления (Подписки)
          </h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Мы пришлём уведомление в Telegram когда появятся новые даты в выбранных категориях.
        </p>

        {/* Рендерим наши новые минималистичные Pill-теги */}
      <CategoryPills
categories={allCategories}
subscribedIds={subscribedCategoryIds}
memberId={profile.id}/>

        <p className="text-xs text-slate-600 mt-4">
          Уведомления приходят в Telegram. Убедитесь что вы подписаны на{' '}
          <a
            href="https://t.me/evaturclub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:text-teal-400 transition-colors"
          >
            @evaturclub
          </a>
          .
        </p>
      </section>

    </div>
  );
}