import { Metadata } from 'next';
import DirectionsClient from './DirectionsClient';
import { BASE_URL } from '@/lib/constants';

// 🔥 Идеальные SEO-метаданные
export const metadata: Metadata = {
  title: 'Направления — Сплавы, SUP, Походы | Турклуб «Эва»',
  description: 'Все направления Турклуба Эва: сплавы на байдарках, SUP, горные походы, детские туры и корпоративные программы. Активный отдых в Приднестровье и Молдове.',
  alternates: { 
    canonical: `${BASE_URL}/directions` 
  },
  openGraph: {
    title: 'Направления | Турклуб «Эва»',
    url: `${BASE_URL}/directions`,
  },
};

export default function DirectionsPage() {
  // Просто рендерим клиентский компонент внутри серверной страницы
  return <DirectionsClient />;
}