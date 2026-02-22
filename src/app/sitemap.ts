import { MetadataRoute } from 'next';
import { getTours } from '@/features/tours/api';

// Укажи здесь свой реальный домен (когда выложишь на Vercel)
const BASE_URL = 'https://tour-club-eva.vercel.app'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Получаем все туры из базы данных
  const tours = await getTours();

  // 2. Генерируем ссылки для каждого тура
  const tourUrls = tours.map((tour) => ({
    url: `${BASE_URL}/tour/${tour.id}`,
    lastModified: new Date(), // Или дата обновления тура, если она есть в базе
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. Возвращаем общий список (Главная страница + Туры)
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...tourUrls,
  ];
}