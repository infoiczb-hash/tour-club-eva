import ReactDOM from 'react-dom';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import FunWrapper from './FunWrapper'; // 👈 Подключаем наш новый мост

export const revalidate = 3600;

// ✅ ТВОЙ SEO-БЛОК ПОЛНОСТЬЮ НА МЕСТЕ
export const metadata: Metadata = {
  title: 'Фан-сектор: Тесты, квизы и подбор туров | Турклуб «Эва»',
  description: 'Интерактивные тесты для туристов. Узнай свой психотип в походе, пройди тест на выживание, собери идеальный рюкзак и позволь AI подобрать тебе маршрут.',
  keywords: [
    'тесты для туристов', 'какой ты турист', 'подобрать тур',
    'квиз выживание в лесу', 'туристические игры', 'турклуб Эва'
  ],
  alternates: { canonical: '/fun' },
  openGraph: {
    title: 'Фан-сектор: Тесты и квизы | Турклуб «Эва»',
    description: 'Интерактивные тесты для туристов. Пройди квиз и позволь AI подобрать тебе идеальный маршрут.',
    url: 'https://evatur.club/fun',
    siteName: 'Турклуб «Эва»',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Фан-сектор: Тесты и интерактивы от Турклуба Эва' }],
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Фан-сектор: Тесты и квизы | Турклуб Эва',
    description: 'Узнай свой психотип в походе и собери виртуальный рюкзак.',
    images: ['/og-default.jpg'],
  }
};

export default async function FunSectorPage() {
  // ✅ ТВОЙ ПРИЗМА-ЗАПРОС
  const tests = await prisma.funTest.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  // ✅ ТВОЙ PRELOAD
  const firstImage = tests[0]?.image;
  if (firstImage) {
    ReactDOM.preload(firstImage, {
      as: 'image',
      fetchPriority: 'high',
      imageSizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    });
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 animate-pulse" />}>
      {/* Используем Wrapper, который прокинет данные в FunClient без SSR */}
      <FunWrapper activeTests={tests} />
    </Suspense>
  );
}