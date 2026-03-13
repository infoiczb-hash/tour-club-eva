import { getTours } from '@/features/tours/api';
// 👇 1. ЗАМЕНИЛИ ИМПОРТ: Теперь тянем обертку (которая сама подтянет ToursBrowser лениво)
import ToursBrowserWrapper from '@/components/ToursBrowserWrapper';
import { Metadata } from 'next';
import { getTourCategoriesAction } from '@/features/admin/actions/categories';
import { Suspense } from 'react'; // 👈 ДОБАВЛЕНО
import { TourSkeleton } from '@/features/tours/components/TourSkeleton'; // 👈 ДОБАВЛЕНО

export const revalidate = 60; // Страница будет кэшироваться на 60 секунд

// 1. 🔥 СУПЕР-SEO ДЛЯ КАТАЛОГА ТУРОВ (Приднестровье/Молдова)
export const metadata: Metadata = {
  title: 'Расписание Туров 2026 — Сплавы, ТУРЫ и SUP | Турклуб «Эва»',
  description: 'Афиша приключений 2026. Сплавы по Днестру, горные походы,SUP. Группы до 12 чел., с гидами. Бронируй место на ближайший тур.',
  keywords: [
    'туры Приднестровье 2026',
    'расписание туров',
    'байдарки  и SUP на Днестре',
     'туры в Румынию',
    'активный отдых выходного дня'
  ],
  openGraph: {
    title: 'Туры и Походы в Приднестровье 2026 — Расписание | Турклуб «Эва»',
    description: 'Расписание туров 2026: сплавы на байдарках по Днестру, пешие походы, SUP и детские программы. Активный отдых в Приднестровье и Молдове каждые выходные.',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg', // Подтянет ту же красивую обложку
        width: 1200,
        height: 630,
        alt: 'Расписание туров Турклуба Эва'
      }
    ]
  },
  alternates: {
    canonical: '/tour', // Указываем каноническую ссылку для защиты от дублей
  }
};

// 2. СТРАНИЦА (Async Server Component)
export default async function AllToursPage() {
  // Вызовы данных здесь были удалены, так как компонент ToursBrowserWrapper 
  // делает эти запросы к БД самостоятельно и параллельно.

 return (
    <main className="pt-24 pb-8 md:pt-32 md:pb-24 bg-slate-950 min-h-screen relative overflow-hidden" id="tours">
      {/* 👈 ДОБАВЛЕНА ОБЕРТКА SUSPENSE */}
      <Suspense fallback={<TourSkeleton />}>
        <ToursBrowserWrapper
          title="Все Приключения"
          subtitle="Полный каталог 2026"
        />
      </Suspense>
    </main>
  );
}