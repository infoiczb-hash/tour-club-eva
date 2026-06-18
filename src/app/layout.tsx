import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

import { ToastProvider } from "@/shared/context/ToastContext";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";

import Header from "@/components/Header"; 
import { Footer } from "@/components/layout/Footer";
import PromoBlock from "@/components/layout/PromoBlock"; 
import HeaderSkeleton from "@/components/layout/HeaderSkeleton";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ModalsWrapper from "@/components/modals/ModalsWrapper";

// ИМПОРТ КОНСТАНТЫ ДЛЯ СХЕМЫ И МЕТАДАННЫХ
import { BASE_URL } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "700", "900"],
  //  400 — text-base (обычный текст)
  //  500 — font-medium (подписи, мелкий текст)
  //  700 — font-bold (заголовки h3, кнопки)
  //  900 — font-black (главные h1/h2, дизайн-акценты)
  //
  //  600 убрали — font-semibold в дизайне не используется.
  //  Без нужного weight браузер синтезирует его искусственно
  //  (browser font synthesis) → FOUT + лишний вес.
  //
  //  ЭКОНОМИЯ: Inter на Google Fonts отдаёт только запрошенные
  //  начертания. 4 weight вместо 3 (но правильных) = тот же размер,
  //  зато нет FOUT и font-synthesis артефактов.
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | Турклуб «Эва»",
    default: "Турклуб «Эва» — Активный отдых в Приднестровье",
  },
  description: "Турклуб «Эва» — сплавы на байдарках по Днестру, походы и SUP в Приднестровье (ПМР) и Молдове. Активный отдых каждые выходные из Тирасполя.",
  keywords: [
    "турклуб Приднестровье", 
    "ПМР туризм",
    "активный отдых Тирасполь", 
    "сплав Днестр", 
    "байдарки Приднестровье", 
    "походы Молдова",
    "Transnistria tours"
  ],
  openGraph: {
    title: "Турклуб «Эва» — Активный отдых в Приднестровье",
    description: "Турклуб «Эва» — сплавы на байдарках по Днестру, походы и SUP в Приднестровье и Молдове. Активный отдых каждые выходные из Тирасполя. Туры в румынские горы.",
    url: BASE_URL,
    siteName: "Турклуб «Эва»",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Турклуб Эва — сплавы и приключенческие туры",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Турклуб «Эва» — Активный отдых в Приднестровье",
    description: "Сплавы на байдарках, приключенческие туры и SUP в Приднестровье и Молдове.",
    images: ["/og-default.jpg"],
  },
  verification: {
    google: "bQzEK-w6DrRPryfEde5_dJSFHBskbBJRcWeiPgMu0N0",
    yandex: "d9d080aa11f7b5b3",
  },
 };

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['TravelAgency', 'LocalBusiness'],
  name: 'Турклуб «Эва»',
  alternateName: ['ТурклубЭВА', 'EvaClub', 'evatur.club'],
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/icon.png`, 
    width: 200,
    height: 200,
  },
  image: `${BASE_URL}/og-default.jpg`,
  openingHours: ['Mo-Fr 15:00-18:00', 'Sa 07:00-21:00'],
  telephone: '+37377770141',
  email: 'info@evatur.club',
  priceRange: "$$", 
  foundingDate: '2022',
  
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Городской пляж', 
    addressLocality: 'Тирасполь',
    addressRegion: 'Приднестровье',
    addressCountry: 'MD',
    postalCode: '3300'
  },
  areaServed: [
    { "@type": "Place", "name": "Приднестровье" },
    { "@type": "Place", "name": "ПМР" },
    { "@type": "Place", "name": "Молдова" },
    { "@type": "Place", "name": "Transnistria" },
    { "@type": "Place", "name": "Тирасполь" },
    { "@type": "Place", "name": "Бендеры" },
    { "@type": "Place", "name": "Румыния" },
    { "@type": "Place", "name": "Карпаты" },
    { "@type": "Place", "name": "Кишинев" },
    { "@type": "Place", "name": "Moldova" }
  ],
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 46.8403,  
    longitude: 29.6433,
  },
  sameAs: [
    'https://www.instagram.com/evaturclub',
    'https://t.me/evaturclub',
    'https://www.facebook.com/evaturclub',
    'https://www.tiktok.com/@evaturclub'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+37377770141',
    contactType: 'customer service',
    availableLanguage: ['Russian'],
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

  return (
    <html lang="ru" className={`scroll-smooth ${inter.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* ✅ ИСПРАВЛЕНО: Убран неиспользуемый preconnect к Supabase, 
            оставлен только Cloudinary — Главный CDN для всех изображений проекта. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Telegram — ускорение авторизации и виджетов (важно для /login) */}
        <link rel="preconnect" href="https://telegram.org" />
        <link rel="dns-prefetch" href="https://telegram.org" />

        {/* YouTube — превью VideoGuide на каякинге и SUP */}
        <link rel="dns-prefetch" href="https://img.youtube.com" />

        <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }} />
      </head>
      <body suppressHydrationWarning={true} className="font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white antialiased min-h-screen flex flex-col">
        
          <ToastProvider>
            <MainLayoutWrapper 
              header={
                <Suspense fallback={<HeaderSkeleton />}>
                  <Header />
                </Suspense>
              } 
              footer={
                <Suspense fallback={<div className="h-64 bg-slate-900/50 animate-pulse w-full" />}>
                  <Footer />
                </Suspense>
              } 
              promo={<PromoBlock />}
            >
              {children}
            </MainLayoutWrapper>
          </ToastProvider>
        <ModalsWrapper />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  ); 
}