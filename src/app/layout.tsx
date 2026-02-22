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

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Турклуб ЭВА",
    default: "Турклуб ЭВА | Походы и приключения",
  },
  description: "Авторские путешествия, сплавы и походы по Молдове и миру.",
  metadataBase: new URL("https://evatur.club"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`scroll-smooth ${inter.variable}`} suppressHydrationWarning>
      <body
        suppressHydrationWarning={true}
        className="font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white antialiased min-h-screen flex flex-col"
      >
        <Providers>
          <ToastProvider>
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
      </body>
    </html>
  );
}