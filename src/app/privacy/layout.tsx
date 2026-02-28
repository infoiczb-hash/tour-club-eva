import { Metadata } from 'next';

// 🔥 СЕРВЕРНЫЕ МЕТАДАННЫЕ (Изолированы от клиентского page.tsx)
export const metadata: Metadata = {
  title: 'Политика Конфиденциальности | Турклуб «Эва»',
  description: 'Как мы работаем с вашими данными и контентом в турклубе.',
  // Главное оружие: запрещаем Гуглу индексировать техническую страницу
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Просто прокидываем клиентскую страницу (page.tsx) внутрь
  return <>{children}</>;
}