import { getTours } from '@/features/tours/api';
import ToursBrowser from '@/features/tours/components/ToursBrowser';
import { Metadata } from 'next';

// 1. SEO (Важно для каталога)
export const metadata: Metadata = {
  title: 'Все туры и походы | Турклуб ЭВА',
  description: 'Расписание авторских путешествий на 2026 год. Походы, сплавы, экспедиции и туры выходного дня.',
  openGraph: {
    title: 'Каталог приключений | Турклуб ЭВА',
    description: 'Найди свое идеальное путешествие.',
    type: 'website',
  }
};

// 2. СТРАНИЦА (Async Server Component)f
export default async function AllToursPage() {
  // Получаем ВСЕ активные туры
  const tours = await getTours();

  return (
    // pt-20 нужен, чтобы контент не залез под фиксированный Header
    <main className="pt-24 pb-8 md:pt-32 md:pb-24 bg-slate-950 min-h-screen relative overflow-hidden" id="tours">
      <ToursBrowser 
         tours={tours} 
         title="Все Приключения" 
         subtitle="Полный каталог 2026"
      />
    </main>
  );
}