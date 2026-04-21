import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Направления и Туры в Приднестровье | Турклуб «Эва»',
  description: 'Выберите свое приключение: сплавы на байдарках по Днестру, SUP-прогулки, горные походы, детские лагеря и корпоративные туры. Активный отдых в Приднестровье и Молдове.',
  keywords: [
    'туры Приднестровье', 'активный отдых Молдова', 'сплавы Днестр', 'SUP Тирасполь',
    'горные походы', 'детские туры', 'корпоративный отдых'
  ],
  alternates: {
    canonical: `${BASE_URL}/directions`,
    languages: {
      'ru': `${BASE_URL}/directions`,
      'ro': `${BASE_URL}/directions?lang=ro`,
      'en': `${BASE_URL}/directions?lang=en`,
    },
  },
  openGraph: {
    title: 'Направления и Туры в Приднестровье | Турклуб «Эва»',
    description: 'Сплавы, SUP, походы, детские и корпоративные туры в Приднестровье и Молдове.',
    url: `${BASE_URL}/directions`,
    siteName: 'Турклуб «Эва»',
    images: [{ url: `${BASE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Направления | Турклуб Эва',
    description: 'Сплавы, походы, SUP и корпоративные выезды.',
    images: [`${BASE_URL}/og-default.jpg`],
  },
};

export default function DirectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}