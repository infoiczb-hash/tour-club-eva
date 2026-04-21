import { Metadata } from 'next';
import DirectionsClient from './DirectionsClient';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Направления — Сплавы, SUP, Походы | Турклуб «Эва»',
  description: 'Все направления Турклуба Эва: сплавы на байдарках, SUP, горные походы, детские туры и корпоративные программы. Активный отдых в Приднестровье и Молдове.',
  alternates: { canonical: `${BASE_URL}/directions` },
  openGraph: {
    title: 'Направления | Турклуб «Эва»',
    url: `${BASE_URL}/directions`,
    images: [{ url: `${BASE_URL}/og-default.jpg` }],
  },
};

export default function DirectionsPage() {
  return <DirectionsClient />;
}