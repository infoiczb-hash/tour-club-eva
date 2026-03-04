import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Направления и Туры в Приднестровье | Турклуб «Эва»',
  description: 'Выберите свое приключение: сплавы на байдарках по Днестру, SUP-прогулки, горные походы, детские лагеря и корпоративные туры. Активный отдых в Приднестровье и Молдове.',
  keywords: [
    'туры Приднестровье',
    'активный отдых Молдова',
    'направления турклуба Эва',
    'походы',
    'сплавы',
    'SUP Тирасполь'
  ],
  alternates: {
    canonical: 'https://evatur.club/directions',
  },
  openGraph: {
    title: 'Направления и Туры в Приднестровье | Турклуб «Эва»',
    description: 'Выберите свое приключение: сплавы на байдарках, SUP-прогулки, горные походы и детские лагеря.',
    url: 'https://evatur.club/directions',
    siteName: 'Турклуб «Эва»',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Все направления турклуба Эва',
      }
    ],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Направления и Туры | Турклуб Эва',
    description: 'Сплавы, походы, SUP и корпоративные выезды.',
    images: ['/og-default.jpg'],
  }
};

export default function DirectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Просто прокидываем клиентскую страницу внутрь
  return <>{children}</>;
}