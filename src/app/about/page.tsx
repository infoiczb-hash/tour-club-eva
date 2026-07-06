import { Metadata } from 'next';
import AboutContent from './about-content';

export const metadata: Metadata = {
  title: 'О клубе | Турклуб «Эва»',
  description:
    'Узнайте больше о турклубе «Эва»: наша история, философия активного отдыха, безопасность на маршрутах и команда профессиональных гидов.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'О клубе | Турклуб «Эва»',
    description: 'Узнайте больше о турклубе «Эва»: история, философия и команда.',
    url: 'https://evatur.club/about',
    siteName: 'Турклуб «Эва»',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'О турклубе Эва',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О клубе | Турклуб «Эва»',
    description: 'Узнайте больше о турклубе «Эва»: история, философия и команда.',
    images: ['/og-default.jpg'],
  },
};

// JSON-LD: Organization + AboutPage в одном @graph.
// Организация — источник правды о клубе (контакты, имя), AboutPage
// ссылается на неё через "about" и на сайт через "isPartOf".
// Подставьте реальный /logo.png и, если появятся, соцсети в sameAs.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://evatur.club/#organization',
      name: 'Турклуб «Эва»',
      alternateName: 'ТК Эва',
      url: 'https://evatur.club',
      logo: 'https://evatur.club/logo.png',
      description:
        'Турклуб «Эва» — сообщество активного отдыха: походы в горы, сплавы на байдарках и SUP, детские и семейные программы, психологические туры.',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+373-777-70141',
          email: 'info@evatur.club',
          contactType: 'customer service',
          areaServed: 'MD',
          availableLanguage: ['ru'],
        },
      ],
      sameAs: [],
    },
    {
      '@type': 'AboutPage',
      '@id': 'https://evatur.club/about#webpage',
      url: 'https://evatur.club/about',
      name: 'О клубе | Турклуб «Эва»',
      description:
        'История турклуба «Эва», философия «подожди меня», безопасность на маршрутах и команда.',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://evatur.club/#website',
        url: 'https://evatur.club',
        name: 'Турклуб «Эва»',
      },
      about: {
        '@id': 'https://evatur.club/#organization',
      },
      inLanguage: 'ru-RU',
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutContent />
    </>
  );
}