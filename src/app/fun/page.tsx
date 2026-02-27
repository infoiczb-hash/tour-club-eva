import { prisma } from '@/lib/prisma';
import FunClient from './FunClient';

// Опционально: кэшируем страницу на 60 секунд для скорости
export const revalidate = 60; 

export default async function FunSectorPage() {
  // Достаем из базы ВСЕ активные тесты
  const tests = await prisma.funTest.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  // Передаем их в клиентский компонент
  return <FunClient activeTests={tests} />;
}