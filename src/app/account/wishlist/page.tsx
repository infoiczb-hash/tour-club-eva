// src/app/account/wishlist/page.tsx

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, Bell, MapPin, Clock, TrendingUp, ArrowRight,
  Hourglass, BookOpen 
} from 'lucide-react';
import WishlistToggle from '@/features/account/components/WishlistToggle';
import CategoryPills from '@/components/account/CategoryPills';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';

// ─── загрузка данных (АБСОЛЮТНО ОПТИМИЗИРОВАНО) ──────────────────────
async function getWishlistData(userId: string) {
  // 1. Берем профиль (строгая диета: только id и phone)
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
    select: { id: true, phone: true }
  });
  
  if (!profile) return null;

  // 2. 🚀 ТУРБО-РЕЖИМ: 5 запросов параллельно!
  const [
    waitlists,
    tourWishlist,
    favoritePosts,
    categorySubscriptions,
    allCategories
  ] = await Promise.all([
    // Запрос 1: Лист ожидания
    prisma.waitlist.findMany({
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
    }),

    // Запрос 2: Вишлист туров (с легкими вложенными select)
    prisma.watchList.findMany({
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
    }),

    // Запрос 3: Избранные статьи блога
    prisma.favoritePost.findMany({
      where: { memberId: profile.id },
      include: {
        post: { select: { id: true, title: true, slug: true, image: true, read_time: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Запрос 4: Подписки на категории
    prisma.watchList.findMany({
      where: { memberId: profile.id, categoryId: { not: null } },
      select: { categoryId: true }
    }),

    // Запрос 5: Все категории для Pill-тегов
    prisma.tourCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true, title: true, icon: true, color: true },
    })
  ]);

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

// ─── цвета категорий ──────────────────────────────────────
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

  return (
    <div className="space-y-8 max-w-4xl pb-10">

      {/* ── Заголовок ── */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои желания</h1>
        <p className="text-sm text-slate-300">
          Туры и статьи, за которыми вы следите, и ваши листы ожидания.
        </p>
      </div>

      {/* ── ТЕКСТОВАЯ ПОДСКАЗКА PRO TELEGRAM ── */}
      <div className="flex items-start gap-3 bg-slate-800/40 border border-white/5 rounded-2xl p-4">
        <Bell size={18} className="text-teal-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300 leading-relaxed">
          Уведомления об освободившихся местах и новых датах туров приходят в Telegram. 
          <Link href="/account/settings" className="text-teal-400 hover:text-teal-300 font-bold ml-1.5 transition-colors whitespace-nowrap">
            Настроить →
          </Link>
        </p>
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

      {/* ── СОХРАНЁННЫЕ ТУРЫ ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Heart size={14} className="text-rose-400" />
            Туры
            {tourWishlist.length > 0 && (
              <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
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
            <p className="text-slate-300 text-sm mb-2">Нет сохранённых туров</p>
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
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
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

                    <div className="flex flex-wrap gap-2 text-xs text-slate-300 mb-2">
                      {tour.location && <span className="flex items-center gap-1"><MapPin size={10} /> {tour.location}</span>}
                      {tour.duration && <span className="flex items-center gap-1"><Clock size={10} /> {tour.duration}</span>}
                      {tour.distance && <span className="flex items-center gap-1"><TrendingUp size={10} /> {tour.distance} км</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      {nextDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-teal-400 font-medium">{formatDate(nextDate.startDate)}</span>
                          {isLowSpots && (
                            <span className="text-[12px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
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
                  <p className="text-[12px] text-slate-300 font-bold uppercase tracking-wider mt-1.5">
                    {sp.post.read_time ? `${sp.post.read_time} мин чтения` : 'Статья'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    {/* ── ПОДПИСКИ НА КАТЕГОРИИ ── */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-teal-400" />
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Направления (Подписки)
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Мы пришлём уведомление, когда появятся новые даты в выбранных категориях.
        </p>

        <CategoryPills
          categories={allCategories}
          subscribedIds={subscribedCategoryIds}
          memberId={profile.id}
        />

        {/* ✅ ВЕРНУЛИ ТВОЮ ФРАЗУ ПРО КАНАЛ */}
        <p className="text-xs text-slate-400 mt-5">
          Уведомления о новых турах и постах приходят в наш Telegram канал. Убедитесь что вы подписаны на{' '}
          <a
            href="https://t.me/evaturclub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:text-teal-400 font-medium transition-colors"
          >
            @evaturclub
          </a>
          .
        </p>
      </section>

    </div>
  );
}