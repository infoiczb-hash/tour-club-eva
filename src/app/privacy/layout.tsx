import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика Конфиденциальности | Турклуб «Эва»',
  description: 'Как мы собираем, храним и защищаем ваши персональные данные. Политика конфиденциальности туристического клуба «Эва».',
  openGraph: {
    title: 'Политика Конфиденциальности | Турклуб «Эва»',
    description: 'Как мы работаем с вашими данными.',
    url: 'https://evatur.club/privacy',
    siteName: 'Турклуб «Эва»',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  }
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}