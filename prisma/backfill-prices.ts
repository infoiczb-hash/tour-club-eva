import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log(' Запуск скрипта бэкфилла категорий цен...');

  // 1. Получаем все существующие туры
  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      priceChild: true,
      priceFamily: true,
      priceMember: true,
    },
  });

  console.log(` Найдено туров для обработки: ${tours.length}`);

  let createdCategoriesCount = 0;

  for (const tour of tours) {
    // Структурированный массив конфигураций для генерации категорий
    const categoriesToCreate = [
      {
        key: 'adult',
        label: 'Стандарт',
        price: tour.price,
        spotsPerUnit: 1,
        minQuantity: 0, // Устанавливаем 0, чтобы убрать принудительный хардкод "минимум 1"
        sortOrder: 1,
      },
    ];

    // Добавляем детские билеты, если цена была задана
    if (tour.priceChild !== null && tour.priceChild > 0) {
      categoriesToCreate.push({
        key: 'child',
        label: 'Детский',
        price: tour.priceChild,
        spotsPerUnit: 1,
        minQuantity: 0,
        sortOrder: 2,
      });
    }

    // Добавляем семейные билеты (вес = 3 места)
    if (tour.priceFamily !== null && tour.priceFamily > 0) {
      categoriesToCreate.push({
        key: 'family',
        label: 'Семейный пакет',
        price: tour.priceFamily,
        spotsPerUnit: 3,
        minQuantity: 0,
        sortOrder: 3,
      });
    }

    // Добавляем клубные билеты
    if (tour.priceMember !== null && tour.priceMember > 0) {
      categoriesToCreate.push({
        key: 'member',
        label: 'Участник клуба',
        price: tour.priceMember,
        spotsPerUnit: 1,
        minQuantity: 0,
        sortOrder: 4,
      });
    }

    // 2. Безопасно записываем категории через upsert (защита от дублирования)
    for (const cat of categoriesToCreate) {
      await prisma.tourPriceCategory.upsert({
        where: {
          tourId_key: {
            tourId: tour.id,
            key: cat.key,
          },
        },
        update: {
          price: cat.price,
          spotsPerUnit: cat.spotsPerUnit,
          label: cat.label,
        },
        create: {
          tourId: tour.id,
          key: cat.key,
          label: cat.label,
          price: cat.price,
          spotsPerUnit: cat.spotsPerUnit,
          minQuantity: cat.minQuantity,
          sortOrder: cat.sortOrder,
          isActive: true,
        },
      });
      createdCategoriesCount++;
    }
    console.log(`Обработан тур: "${tour.title}"`);
  }

  console.log(`\n Бэкфилл успешно завершен! Создано/обновлено категорий: ${createdCategoriesCount}`);
}

main()
  .catch((error: unknown) => {
    console.error('Ошибка при выполнении бэкфилла:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });