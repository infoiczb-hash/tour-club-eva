import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Bell, MapPin, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import WishlistToggle from '@/features/account/components/WishlistToggle';
import CategorySubscribeToggle from '@/features/account/components/CategorySubscribeToggle';

// ─── загрузка данных ─────────────────────────────────────────────────
async function getWishlistData(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  // Вишлист туров
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

  // Подписки на категории
  const categorySubscriptions = await prisma.watchList.findMany({
    where: { memberId: profile.id, categoryId: { not: null } },
    include: {
      category: {
        select: { id: true, slug: true, title: true, icon: true, color: true },
      },
    },
  });

  // Все активные категории для блока "Подписаться"
  const allCategories = await prisma.tourCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, title: true, icon: true, color: true },
  });

  const subscribedCategoryIds = new Set(
    categorySubscriptions.map(s => s.categoryId).filter(Boolean)
  );

  return {
    profile,
    tourWishlist,
    categorySubscriptions,
    allCategories,
    subscribedCategoryIds,
  };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── цвета категорий ────────────────────────────────────────────────
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
    tourWishlist,
    allCategories,
    subscribedCategoryIds,
  } = data;

  return (
    <div className="space-y-8">

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Вишлист</h1>
        <p className="text-sm text-slate-400">
          Сохранённые туры и подписки на категории
        </p>
      </div>

      {/* ── Сохранённые туры ─────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Heart size={14} className="text-rose-400" />
            Туры
            {tourWishlist.length > 0 && (
              <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {tourWishlist.length}
              </span>
            )}
          </h2>
          <Link
            href="/tour"
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            Все туры →
          </Link>
        </div>

        {tourWishlist.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 text-center">
            <Heart size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-2">Нет сохранённых туров</p>
            <p className="text-xs text-slate-600 mb-4">
              Нажмите ♡ на странице тура чтобы добавить в вишлист
            </p>
            <Link
              href="/tour"
              className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
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
              const isLowSpots = nextDate && nextDate.spotsLeft <= 3;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden flex"
                >
                  {/* Фото */}
                  <div className="relative w-24 sm:w-28 shrink-0">
                    {tour.coverImage ? (
                      <Image
                        src={tour.coverImage}
                        alt={tour.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
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
                      {/* Кнопка удаления из вишлиста */}
                      <WishlistToggle
                        tourId={tour.id}
                        memberId={profile.id}
                        watchlistId={item.id}
                        inWishlist={true}
                      />
                    </div>

                    <Link
                      href={`/tour/${tour.slug}`}
                      className="block text-sm font-black text-white hover:text-teal-400 transition-colors truncate mb-2"
                    >
                      {tour.title}
                    </Link>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
                      {tour.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {tour.location}
                        </span>
                      )}
                      {tour.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {tour.duration}
                        </span>
                      )}
                      {tour.distance && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={10} /> {tour.distance} км
                        </span>
                      )}
                    </div>

                    {/* Ближайшая дата или статус */}
                    <div className="flex items-center justify-between">
                      {nextDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-teal-400 font-medium">
                            {formatDate(nextDate.startDate)}
                          </span>
                          {isLowSpots && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                              Осталось {nextDate.spotsLeft} мест
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">Дат пока нет</span>
                      )}

                      <Link
                        href={`/tour/${tour.slug}`}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                      >
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

      {/* ── Подписки на категории ────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-teal-400" />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Уведомления по категориям
          </h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Мы пришлём уведомление в Telegram когда появятся новые даты в выбранных категориях.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allCategories.map(cat => {
            const isSubscribed = subscribedCategoryIds.has(cat.id);
            const style = getCatStyle(cat.color);

            return (
              <CategorySubscribeToggle
                key={cat.id}
                categoryId={cat.id}
                memberId={profile.id}
                title={cat.title}
                icon={cat.icon}
                isSubscribed={isSubscribed}
                colorBg={style.bg}
                colorText={style.text}
                colorBorder={style.border}
              />
            );
          })}
        </div>

        <p className="text-xs text-slate-600">
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
