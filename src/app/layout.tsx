import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";
import { ToastProvider } from "@/shared/context/ToastContext";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";

// Импортируем компоненты, которые должны быть глобальными
import Header from "@/components/Header"; 
import { Footer } from "@/components/layout/Footer";
import PromoBlock from "@/components/layout/PromoBlock"; 
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AxeReporter from '@/components/AxeReporter'; 

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://evatur.club"),
  title: {
    template: "%s | Турклуб «Эва»",
    default: "Турклуб «Эва» — Активный отдых в Приднестровье",
  },
  description: "Турклуб «Эва» — сплавы на байдарках по Днестру, походы и SUP в Приднестровье и Молдове. Активный отдых каждые выходные из Тирасполя.",
  keywords: [
    "турклуб Приднестровье", 
    "активный отдых Тирасполь", 
    "сплав Днестр", 
    "байдарки Приднестровье", 
    "походы Молдова"
  ],
  openGraph: {
    title: "Турклуб «Эва» — Активный отдых в Приднестровье",
    description: "Турклуб «Эва» — сплавы на байдарках по Днестру, походы и SUP в Приднестровье и Молдове. Активный отдых каждые выходные из Тирасполя. Туры в румынские горы.",
    url: "https://evatur.club",
    siteName: "Турклуб «Эва»",
    images: [
      {
        url: "/og-default.jpg", // ⚠️ ВАЖНО: положи картинку 1200x630 с таким названием в папку public
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
    description: "Сплавы на байдарках, приключенчиские туры и SUP в Приднестровье и Молдове.",
    images: ["/og-default.jpg"],
  },
  verification: {
    google: "bQzEK-w6DrRPryfEde5_dJSFHBskbBJRcWeiPgMu0N0",
    yandex: "d9d080aa11f7b5b3",
  },
  alternates: {
    canonical: "/",
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['TravelAgency', 'LocalBusiness'],
  name: 'Турклуб «Эва»',
  alternateName: ['ТурклубЭВА', 'EvaClub', 'evatur.club'],
  url: 'https://evatur.club',
  logo: {
    '@type': 'ImageObject',
    url: 'https://evatur.club/icon.png', // Твой будущий фавикон/лого
    width: 200,
    height: 200,
  },
  image: 'https://evatur.club/og-default.jpg',
  telephone: '+37377770141',
  email: 'info@evatur.club',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '', // Если есть физический офис, впиши сюда
    addressLocality: 'Тирасполь',
    addressRegion: 'Приднестровье',
    addressCountry: 'MD',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 46.8403,  // Координаты Тирасполя
    longitude: 29.6433,
  },
  areaServed: [
    { '@type': 'State', name: 'Приднестровье' },
    { '@type': 'Country', name: 'Молдова' },
    { '@type': 'City', name: 'Тирасполь' },
    { '@type': 'City', name: 'Бендеры' },
  ],
  knowsAbout: [
    'Активный туризм', 'Байдарки', 'Сплавы по Днестру',
    'SUP', 'Пешие походы', 'Детские лагеря',
  ],
  priceRange: '$$', // Средний ценовой сегмент
  sameAs: [
    'https://instagram.com/evaturclub',
    'https://t.me/evaturclub',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="ru" 
      className={`scroll-smooth ${inter.variable}`} 
      suppressHydrationWarning
      // ✅ Добавляем только эту строку, чтобы Next.js не ругался на плавный скролл
      data-scroll-behavior="smooth" 
    >
      <body
        suppressHydrationWarning={true}
        className="font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white antialiased min-h-screen flex flex-col"
      >
        <Providers>
          <ToastProvider>
            {/* 👇 СКРЫТЫЙ СКРИПТ ОРГАНИЗАЦИИ */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            {/* ✅ ПЕРЕДАЕМ КОМПОНЕНТЫ КАК ПРОПСЫ */}
            <MainLayoutWrapper
              header={<Header />}
              footer={<Footer />}
              promo={<PromoBlock />}
            >
              {children}
            </MainLayoutWrapper>
          </ToastProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
        <AxeReporter />
      </body>
    </html>
  );
}