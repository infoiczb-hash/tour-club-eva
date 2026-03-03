import { getTours } from '@/features/tours/api';
import ToursBrowser from '@/features/tours/components/ToursBrowser';
import { Metadata } from 'next';
import { getTourCategoriesAction } from '@/features/admin/actions/categories';

export const revalidate = 60; // Страница будет кэшироваться на 60 секунд

// 1. 🔥 СУПЕР-SEO ДЛЯ КАТАЛОГА ТУРОВ (Приднестровье/Молдова)
export const metadata: Metadata = {
  title: 'Туры и Походы в Приднестровье — Расписание | Турклуб «Эва»',
  description: 'Расписание туров 2026: сплавы на байдарках по Днестру, приключенческие туры, SUP и детские программы. Активный отдых в Приднестровье и Молдове каждые выходные.',
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
  // Получаем ВСЕ активные туры
  const tours = await getTours();
  const catRes = await getTourCategoriesAction();
  const categories = catRes.success ? catRes.data : [];

 return (
    // pt-20 нужен, чтобы контент не залез под фиксированный Header
    <main className="pt-24 pb-8 md:pt-32 md:pb-24 bg-slate-950 min-h-screen relative overflow-hidden" id="tours">
      <ToursBrowser 
         tours={tours} 
         categories={categories} // 👈 ДОБАВИТЬ ЭТУ СТРОКУ
         title="Все Приключения" 
         subtitle="Полный каталог 2026"
      />
    </main>
  );
}