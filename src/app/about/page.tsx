import { Metadata } from 'next';
import AboutContent from './about-content';

export const metadata: Metadata = {
  title: 'О клубе «Эва» | Турклуб активного отдыха в Приднестровье',
  description:
    'Турклуб «Эва» — сообщество, где природа меняет людей. Походы, сплавы, SUP, семейные и психологические туры.',
  keywords: ['турклуб', 'походы Молдова', 'сплавы на байдарках', 'SUP', 'активный отдых', 'Эва', 'Турклуб Эва'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://evatur.club/about',
  },
  openGraph: {
    title: 'О клубе «Эва» — Турклуб, где рождаются настоящие истории',
    description: 'Сообщество людей, которые любят природу и друг друга. Узнай нашу философию «Эва!» и почему к нам возвращаются.',
    url: 'https://evatur.club/about',
    siteName: 'Турклуб «Эва»',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/og/about-2026.jpg', // рекомендуется подготовить специальное OG-изображение
        width: 1200,
        height: 630,
        alt: 'Турклуб Эва — природа, люди, свобода',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О клубе «Эва» | Турклуб активного отдыха',
    description: 'Природа меняет людей. Узнай историю, философию и ценности Турклуба «Эва».',
    images: ['/og/about-2026.jpg'],
  },
};

// Улучшенный JSON-LD 2026 (Organization + AboutPage + Person + FAQPage)
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
      description: 'Сообщество активного отдыха: походы, сплавы на байдарках и SUP, семейные туры и психологические программы в Молдове.',
      founder: {
        '@type': 'Person',
        name: 'Роман Санду',
        jobTitle: 'Основатель Турклуба «Эва»',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+373-777-70141',
          email: 'info@evatur.club',
          contactType: 'customer service',
          areaServed: 'MD',
          availableLanguage: ['ru', 'ro'],
        },
      ],
      sameAs: [], // добавь соцсети, когда будут
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'MD',
      },
    },
    {
      '@type': 'AboutPage',
      '@id': 'https://evatur.club/about#webpage',
      url: 'https://evatur.club/about',
      name: 'О клубе «Эва»',
      description: 'Философия, история и ценности Турклуба «Эва»',
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://evatur.club/#website',
      },
      about: {
        '@id': 'https://evatur.club/#organization',
      },
      inLanguage: 'ru-RU',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Главная',
            item: 'https://evatur.club',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'О клубе',
            item: 'https://evatur.club/about',
          },
        ],
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutContent />
    </>
  );
}