import { Metadata } from 'next';

// 🔥 СЕРВЕРНЫЕ МЕТАДАННЫЕ (Защита от индексации)
export const metadata: Metadata = {
  title: 'Публичная Оферта | Турклуб «Эва»',
  description: 'Официальная публичная оферта и условия оказания услуг турклуба «Эва».',
  // Закрываем юридическую страницу от поисковых роботов
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Оборачиваем клиентский page.tsx
  return <>{children}</>;
}