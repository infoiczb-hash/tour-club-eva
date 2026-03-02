import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Публичная Оферта | Турклуб «Эва»',
  description: 'Официальная публичная оферта и условия оказания услуг туристического клуба «Эва». Правила бронирования, возврата средств и участия в турах.',
  openGraph: {
    title: 'Публичная Оферта | Турклуб «Эва»',
    description: 'Официальные условия оказания туристических услуг.',
    url: 'https://evatur.club/offer',
    siteName: 'Турклуб «Эва»',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  }
};

export default function OfferLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}