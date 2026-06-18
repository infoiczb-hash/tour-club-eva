// src/app/faq/page.tsx
import { Metadata } from 'next';
import FaqClient from './FaqClient';
import { faqData } from '@/data/faq';
import { BASE_URL } from '@/lib/constants';

// ─── SEO МЕТАДАННЫЕ ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Частые Вопросы о Турах | Турклуб «Эва»",
  description: "Ответы на вопросы о сплавах, походах и детских программах. Снаряжение, безопасность, возраст, трансфер, оплата, отмена. Тирасполь.",
  keywords: [
    "вопросы о сплаве байдарки",
    "FAQ туры Приднестровье",
    "безопасность сплав Днестр",
    "что взять в поход",
  ],
  alternates: {
    canonical: `${BASE_URL}/faq`,
  },
  openGraph: {
    title: "Частые Вопросы о Турах | Турклуб «Эва»",
    description: "Ответы на популярные вопросы о сплавах на байдарках, походах и SUP-прогулках в Приднестровье.",
    url: `${BASE_URL}/faq`,
    siteName: "Турклуб «Эва»",
    locale: "ru_RU",
    type: "website",
    images: [{
      url: `${BASE_URL}/og-default.jpg`,
      width: 1200,
      height: 630,
      alt: "Частые вопросы о турах — Турклуб Эва",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Частые Вопросы о Турах | Турклуб «Эва»",
    description: "Ответы на популярные вопросы о сплавах на байдарках, походах и SUP-прогулках в Приднестровье.",
    images: [`${BASE_URL}/og-default.jpg`],
  }
};

// ─── СТРАНИЦА ────────────────────────────────────────────────────────
export default function FAQPage() {
  // Формируем JSON-LD схему для Google (FAQPage)
  // Маппим ключи 'q' и 'a' из нашего файла данных
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          // Заменяем символы < для защиты от XSS
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') 
        }}
      />
      <FaqClient />
    </>
  );
}