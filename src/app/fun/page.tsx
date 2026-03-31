import { Suspense } from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import FunClient from './FunClient';

export const revalidate = 3600;

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
  // 1. Детерминированная сортировка для стабильного LCP
  const tests = await prisma.funTest.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  const firstImage = tests[0]?.image;
  
  // Генерация srcSet, идентичного Next.js <Image> (качество 65 для priority)
  // Это гарантирует 100% Cache-Hit в Cloudinary CDN
  const imageSrcSet = firstImage 
    ? `/_next/image?url=${encodeURIComponent(firstImage)}&w=640&q=65 640w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=750&q=65 750w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=828&q=65 828w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=1080&q=65 1080w, ` +
      `/_next/image?url=${encodeURIComponent(firstImage)}&w=1200&q=65 1200w`
    : undefined;

  const serializedTests = JSON.parse(JSON.stringify(tests));

  return (
    <main>
      {/* 2. Нативный Preload с fetchpriority="high". React 18 поднимет его в <head> */}
      {firstImage && (
        <link
          rel="preload"
          as="image"
          href={`/_next/image?url=${encodeURIComponent(firstImage)}&w=1200&q=65`}
          imageSrcSet={imageSrcSet}
          imageSizes="(max-width: 768px) 92vw, (max-width: 1024px) 48vw, 400px"
          fetchPriority="high"
        />
      )}
      
      <Suspense fallback={null}>
        <FunClient activeTests={serializedTests} />
      </Suspense>
    </main>
  );
}