// __tests__/integration/admin-tours.test.ts
import { prisma } from '@/lib/prisma';
import { saveTour, getToursAdmin, updateTourStatus, deleteTour } from '@/features/admin/actions/tour';
import { notifySubscribersOnNewDates } from '@/lib/telegram/notify';

// Мокаем Telegram‑функции
jest.mock('@/features/admin/actions/telegram', () => ({
  publishToTelegram: jest.fn().mockResolvedValue({ success: true }),
  sendToUserTelegramAdvanced: jest.fn().mockResolvedValue({ success: true }),
}));

// Мокаем NotificationHub
jest.mock('@/lib/notifications/hub', () => ({
  NotificationHub: { dispatch: jest.fn() },
}));

// Мокаем уведомления подписчиков о новых датах
jest.mock('@/lib/telegram/notify', () => ({
  notifySubscribersOnNewDates: jest.fn().mockResolvedValue(undefined),
}));

// Мокаем аудит и авторизацию
jest.mock('@/lib/audit', () => ({
  withAdminAudit: () => (fn: any) => fn,
}));
jest.mock('@/lib/auth', () => ({
  withAdminAuth: (fn: any) => fn,
}));

// ХЕЛПЕРЫ ВРЕМЕНИ
function daysOffset(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0); 
  d.setDate(d.getDate() + n);
  return d;
}

describe('Admin Tours Actions', () => {
  let categoryId: string;
  let guideId: string;

  //   ФИКС: Используем beforeEach вместо beforeAll, 
  // чтобы глобальная очистка БД не удаляла наши данные до запуска теста
  beforeEach(async () => {
    jest.clearAllMocks();

    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const cat = await prisma.tourCategory.create({
      data: { slug: `test-cat-${uniqueSuffix}`, title: 'Test Category', icon: 'Compass' },
    });
    categoryId = cat.id;

    const guide = await prisma.guide.create({
      data: { name: `Test Guide ${uniqueSuffix}`, role: 'Guide', isActive: true },
    });
    guideId = guide.id;
  });

  afterEach(async () => {
    await prisma.tourDate.deleteMany(); 
    await prisma.tour.deleteMany(); 
    if (categoryId) await prisma.tourCategory.deleteMany({ where: { id: categoryId } });
    if (guideId) await prisma.guide.deleteMany({ where: { id: guideId } });
  });

  // ==================== SAVE TOUR ====================
  describe('saveTour', () => {
    it('создаёт новый тур (черновик, без вызова Telegram)', async () => {
      const input = {
        title: 'Новый черновик',
        slug: `new-draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        categoryId,
        location: 'Локация',
        duration: '1 день',
        price: 1000,
        currency: 'RUB',
        spots: 10,
        spotsLeft: 10,
        isActive: false,
        dates: [],
        difficulty: '1', 
      };
      const result = await saveTour(input as any) as { success: boolean; error?: string };
      expect(result.success).toBe(true);
      const tour = await prisma.tour.findFirst({ where: { slug: input.slug } });
  expect(tour).not.toBeNull();
  expect(tour!.isActive).toBe(false);
     });

     it('при добавлении новых дат вызывает notifySubscribersOnNewDates', async () => {
      const startDate = daysOffset(5);
      const slug = `tour-new-dates-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const input = {
        title: 'Тур с новыми датами',
        slug,
        categoryId,
        location: 'Loc',
        duration: '2d',
        price: 1000,
        currency: 'RUB',
        spots: 10,
        spotsLeft: 10,
        isActive: true,
        difficulty: '3', 
        dates: [{ start: startDate.toISOString().split('T')[0] }], 
      };
      const result = await saveTour(input as any) as { success: boolean };
      expect(result.success).toBe(true);
      expect(notifySubscribersOnNewDates).toHaveBeenCalled();
    });

    it('при обновлении тура с новыми датами вызывает уведомления', async () => {
      const slug = `tour-update-dates-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const tour = await prisma.tour.create({
        data: {
          slug,
          title: 'Тур обновление',
          location: 'Loc',
          price: 500,
          currency: 'RUB',
          spots: 10,
          spotsLeft: 10,
          categoryId,
          duration: '1d',
          isActive: true,
        },
      });

      const futureDate = daysOffset(3);
      const updateInput = {
        id: tour.id,
        title: 'Тур обновление',
        slug,
        categoryId,
        location: 'Loc',
        duration: '1d',
        price: 500,
        currency: 'RUB',
        spots: 10,
        spotsLeft: 10,
        isActive: true,
        difficulty: '1', 
        dates: [{ start: futureDate.toISOString().split('T')[0] }],
      };
      const result = await saveTour(updateInput as any) as { success: boolean };
      expect(result.success).toBe(true);
      expect(notifySubscribersOnNewDates).toHaveBeenCalled();
    });
  });

  // ==================== UPDATE TOUR STATUS ====================
  describe('updateTourStatus', () => {
   it('при включении черновика обновляет статус тура', async () => {
      const slug = `draft-to-active-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const tour = await prisma.tour.create({
        data: {
          slug,
          title: 'Черновик для активации',
          location: 'Локация',
          price: 100,
          currency: 'RUB',
          spots: 10,
          spotsLeft: 10,
          categoryId,
          duration: '1d',
          isActive: false,
        },
      });

     const result = await updateTourStatus(tour.id, true) as { success: boolean };
  expect(result.success).toBe(true);

  const updated = await prisma.tour.findUnique({ where: { id: tour.id } });
  expect(updated!.isActive).toBe(true);
  });

   it('при выключении активного тура обновляет isActive в false', async () => {
      const slug = `active-to-draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const tour = await prisma.tour.create({
        data: {
          slug,
          title: 'Активный тур',
          location: 'Локация',
          price: 200,
          currency: 'RUB',
          spots: 10,
          spotsLeft: 10,
          categoryId,
          duration: '2d',
          isActive: true,
        },
      });

      const result = await updateTourStatus(tour.id, false) as { success: boolean };
      expect(result.success).toBe(true);
      const updated = await prisma.tour.findUnique({ where: { id: tour.id } });
  expect(updated!.isActive).toBe(false);
    });
  });

  // ==================== GET TOURS ADMIN ====================
  describe('getToursAdmin', () => {
    //   ФИКС: Тоже меняем на beforeEach для гарантии изоляции
    beforeEach(async () => {
      const futureDate = daysOffset(10);
      const pastDate = daysOffset(-10);

      const futureTour = await prisma.tour.create({
        data: { slug: `future-tour-${Date.now()}-${Math.floor(Math.random() * 1000)}`, title: 'Будущий тур', location: 'Loc', price: 100, currency: 'RUB', spots: 10, spotsLeft: 10, categoryId, duration: '1d', isActive: true },
      });
      await prisma.tourDate.create({ data: { tourId: futureTour.id, startDate: futureDate, spots: 10, spotsLeft: 10 } });

      const pastTour = await prisma.tour.create({
        data: { slug: `past-tour-${Date.now()}-${Math.floor(Math.random() * 1000)}`, title: 'Прошедший тур', location: 'Loc', price: 100, currency: 'RUB', spots: 10, spotsLeft: 10, categoryId, duration: '1d', isActive: true },
      });
      await prisma.tourDate.create({ data: { tourId: pastTour.id, startDate: pastDate, spots: 10, spotsLeft: 10 } });

      await prisma.tour.create({
        data: { slug: `draft-tour-${Date.now()}-${Math.floor(Math.random() * 1000)}`, title: 'Черновик', location: 'Loc', price: 100, currency: 'RUB', spots: 10, spotsLeft: 10, categoryId, duration: '1d', isActive: false },
      });
    });

    it('фильтр upcoming – только будущие туры', async () => {
      const res = await getToursAdmin({ page: 1, limit: 10, filter: 'upcoming' }) as { success: boolean; tours: any[] };
      expect(res.success).toBe(true);
      const titles = res.tours.map((t: any) => t.title);
      expect(titles).toContain('Будущий тур');
      expect(titles).not.toContain('Прошедший тур');
      expect(titles).not.toContain('Черновик');
    });

    it('фильтр drafts – только черновики', async () => {
      const res = await getToursAdmin({ page: 1, limit: 10, filter: 'drafts' }) as { success: boolean; tours: any[] };
      expect(res.success).toBe(true);
      const titles = res.tours.map((t: any) => t.title);
      expect(titles).toContain('Черновик');
    });

    it('поиск по названию', async () => {
      const res = await getToursAdmin({ page: 1, limit: 10, search: 'Будущий' }) as { success: boolean; tours: any[] };
      expect(res.success).toBe(true);
      expect(res.tours.some(t => t.title === 'Будущий тур')).toBe(true);
    });
  });

  // ==================== DELETE TOUR ====================
  describe('deleteTour', () => {
    it('soft-delete тур', async () => {
      const tour = await prisma.tour.create({
        data: {
          slug: `to-delete-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'To Delete',
          location: 'Loc',
          price: 100,
          currency: 'RUB',
          spots: 10,
          spotsLeft: 10,
          categoryId,
          duration: '1d',
          isActive: true,
        },
      });
      const result = await deleteTour(tour.id) as { success: boolean };
      expect(result.success).toBe(true);
      const deleted = await prisma.tour.findUnique({ where: { id: tour.id } });
      expect(deleted?.deletedAt).not.toBeNull();
      expect(deleted?.isActive).toBe(false);
    });
  });
});