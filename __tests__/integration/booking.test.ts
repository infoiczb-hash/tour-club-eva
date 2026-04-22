import { createBookingAction } from '@/features/tours/actions/createBooking';
import { prisma } from '@/lib/prisma';
import { 
  mockNotificationHubDispatch, 
  mockSendToTelegram,
  mockResendEmailsSend // ✅ Добавили импорт мока Resend
} from '../../__mocks__/external-services';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe('createBookingAction – интеграционные тесты', () => {
  let tourId: string;
  let tourDateId: string;
  let memberId: string | null = null; 

  beforeEach(async () => {
    (createServerSupabaseClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockGetUser },
    });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const category = await prisma.tourCategory.create({
      data: { slug: 'test-category', title: 'Test Category', icon: 'Compass' },
    });

    const tour = await prisma.tour.create({
      data: {
        slug: 'test-tour-' + Date.now(),
        title: 'Тестовый тур',
        location: 'Тестовая локация',
        price: 1000,
        currency: 'RUB',
       spots: 20,
       spotsLeft: 20,
        categoryId: category.id,
        duration: '2 дня',
        isActive: true,
      },
    });
    tourId = tour.id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tourDate = await prisma.tourDate.create({
      data: {
        tourId,
        startDate: tomorrow,
        spots: 20,
        spotsLeft: 20,
      },
    });
    tourDateId = tourDate.id;

    const member = await prisma.memberProfile.create({
      data: {
        userId: 'member-' + Date.now(),
        phone: '+37377711111',
        name: 'Участник клуба',
        level: 'Первопроходец',
        balance: 500, 
      },
    });
    memberId = member.id;
  });

  // 1. УСПЕШНАЯ БРОНЬ ГОСТЯ (tourDateId присутствует)
  it('успешно создаёт бронь, списывает места и отправляет уведомления в TG', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тестовый тур', tourDate: 'завтра',
      name: 'Иван Петров', phone: '+37377712345', social: 'ivan@example.com',
      ticketsAdult: 2, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };

    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');

    const booking = await prisma.booking.findUnique({ where: { id: result.bookingId } });
    expect(booking!.status).toBe('pending');
    expect(booking!.ticketsAdult).toBe(2);

    const updatedTourDate = await prisma.tourDate.findUnique({ where: { id: tourDateId } });
    expect(updatedTourDate!.spotsLeft).toBe(18); // 20 - 2 = 18

    expect(mockNotificationHubDispatch).toHaveBeenCalledTimes(0);
    expect(mockSendToTelegram).toHaveBeenCalled();
  });

  // 2. БЛОКИРОВКА ПРИ НЕХВАТКЕ МЕСТ
  it('возвращает ошибку при недостатке мест', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const input = {
        tourId, tourDateId, tourTitle: 'Тестовый тур', tourDate: 'завтра',
        name: 'Иван Петров', phone: '+37377799999', social: '',
        ticketsAdult: 25, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
        currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
      };
      const result = await createBookingAction(input);
      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected failure');
      expect(result.error).toContain('доступн');
    } finally {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });

  // 3. БЛОКИРОВКА ДУБЛИКАТОВ
  it('блокирует дублирующуюся заявку с того же телефона', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тестовый тур', tourDate: 'завтра',
      name: 'Иван Петров', phone: '+37377712345', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    const first = await createBookingAction(input);
    expect(first.success).toBe(true);

    const second = await createBookingAction(input);
    expect(second.success).toBe(false);
    if (!second.success) expect(second.error).toMatch(/уже есть|неоплаченная заявка/i);
  });

  // 4. ПРОМОКОД (PERCENT) + КЭШБЭК ВЛАДЕЛЬЦУ
  it('применяет процентный промокод и начисляет кэшбэк владельцу', async () => {
    const promo = await prisma.promoCode.create({
      data: { code: 'TEST10', discount: 10, type: 'percent', isActive: true, memberId: memberId },
    });
    const input = {
      tourId, tourDateId, tourTitle: 'Тестовый тур', tourDate: 'завтра',
      name: 'Гость', phone: '+37377712345', social: '',
      ticketsAdult: 2, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, promoCode: 'TEST10', website: '',
    };

    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.totalPrice).toBe(1800); // 2000 - 10%

    const updatedOwner = await prisma.memberProfile.findUnique({ where: { id: memberId! } });
    expect(updatedOwner!.balance).toBe(510); // 500 + 10 cashback

    expect(mockNotificationHubDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'CASHBACK_RECEIVED', memberId: memberId })
    );
  });

  // 5. АВТОРИЗОВАННЫЙ УЧАСТНИК (СПИСАНИЕ БОНУСОВ)
  it('авторизованный участник списывает бонусы и получает BOOKING_CREATED', async () => {
    const member = await prisma.memberProfile.findFirst({ where: { id: memberId! } });
    mockGetUser.mockResolvedValue({ data: { user: { id: member!.userId } }, error: null });

    const input = {
      tourId, tourDateId, tourTitle: 'Тестовый тур', tourDate: 'завтра',
      name: 'Участник клуба', phone: '+37377711111', social: '',
      ticketsAdult: 2, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: true, website: '',
    };

    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    
    expect(result.totalPrice).toBe(1800); // Max 10% from 2000 = 200

    const updatedMember = await prisma.memberProfile.findUnique({ where: { id: memberId! } });
    expect(updatedMember!.balance).toBe(300); // 500 - 200 = 300

    expect(mockNotificationHubDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'BOOKING_CREATED', memberId: memberId })
    );
  });

  // 6. УЧАСТНИК С ПУСТЫМ БАЛАНСОМ
  it('игнорирует useBonuses, если у авторизованного участника 0 баллов', async () => {
    const poorMember = await prisma.memberProfile.create({
      data: { userId: 'poor-' + Date.now(), phone: '+37377722222', name: 'Новичок', level: 'Новичок', balance: 0 },
    });
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: poorMember.userId } }, error: null });

    const input = {
      tourId, tourDateId, tourTitle: 'Тестовый тур', tourDate: 'завтра',
      name: 'Новичок', phone: '+37377722222', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: true, website: '',
    };

    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    expect(result.totalPrice).toBe(1000); // Нет скидки

    const updatedMember = await prisma.memberProfile.findUnique({ where: { id: poorMember.id } });
    expect(updatedMember!.balance).toBe(0); // Баланс не ушел в минус
  });

  // 7. НЕСУЩЕСТВУЮЩИЙ ПРОМОКОД
  it('возвращает ошибку при использовании несуществующего промокода', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тестовый тур', tourDate: 'завтра',
      name: 'Гость', phone: '+37377755555', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, promoCode: 'FAKE_123', website: '',
    };
    const result = await createBookingAction(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/промокод|недействителен|не найден/i);
  });

  // 8. RACE CONDITION (Овербукинг)
  it('справляется с Race Condition: предотвращает овербукинг при одновременных запросах', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const input1 = {
        tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
        name: 'Гонщик 1', phone: '+37377788881', social: '',
        ticketsAdult: 11, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
        currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
      };
      const input2 = {
        ...input1, name: 'Гонщик 2', phone: '+37377788882'
      };

      const [result1, result2] = await Promise.all([
        createBookingAction(input1),
        createBookingAction(input2),
      ]);

      const successes = [result1.success, result2.success].filter(Boolean).length;
      expect(successes).toBe(1); // Строго одна из броней должна пройти (11+11=22 > 20 мест)

      const updatedTourDate = await prisma.tourDate.findUnique({ where: { id: tourDateId } });
      expect(updatedTourDate!.spotsLeft).toBe(9); // 20 - 11 = 9
    } finally {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });

  // 9. ОШИБКИ ВАЛИДАЦИИ (ZOD)
  it('возвращает ошибки Zod: неверный UUID, слишком короткое имя, сломанный телефон', async () => {
    const input = {
      tourId: 'not-a-uuid', 
      tourDateId: 'bad-uuid',
      tourTitle: 'Тур', tourDate: 'завтра',
      name: 'И', // Слишком короткое
      phone: 'abc', // Невалидный телефон
      social: '', ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const result = await createBookingAction(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Ожидаем, что парсер вернёт объект fields с конкретными полями
      expect(result.error).toBeDefined();
      expect(result.error).not.toBeNull();
    }
  });

  // 10. БРОНИРОВАНИЕ 0 БИЛЕТОВ (БАГ-ЧЕК)
  it('проваливает валидацию: нельзя забронировать 0 билетов (проверка бага)', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Гость', phone: '+37377733333', social: '',
      ticketsAdult: 0, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0, // Все билеты по нулям
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const result = await createBookingAction(input);
    // ВАЖНО: Если этот тест падает с Received: true, значит баг всё ещё в коде 
    // и экшен пропускает бронь на 0 билетов. Нужно добавить `.refine()` в Zod-схему.
    expect(result.success).toBe(false);
  });

  // 11. HONEYPOT (ЗАЩИТА ОТ БОТОВ)
  it('тихо игнорирует бота: возвращает success=true если заполнено honeypot-поле website', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Spam Bot', phone: '+37377744444', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, 
      website: 'http://spam-link.com', // Боты часто заполняют скрытые поля
    };
    
    const result = await createBookingAction(input);
    
    // Бот должен думать, что всё хорошо
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.bookingId).toBe('sp-checked');
    }
    
    // Но в базе не должно появиться заявки с таким телефоном
    const botBooking = await prisma.booking.findFirst({ where: { phone: '+37377744444' } });
    expect(botBooking).toBeNull();
  });

  // 12. БРОНЬ БЕЗ TOUR_DATE_ID
  it('успешно бронирует тур БЕЗ указания даты (tourDateId не передан) и списывает места с тура', async () => {
    const input = {
      tourId, 
      tourDateId: '', // Пустая дата или null
      tourTitle: 'Тур без расписания', tourDate: 'Открытая дата',
      name: 'Прямой Бронировщик', phone: '+37377766666', social: '',
      ticketsAdult: 2, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');

    const booking = await prisma.booking.findUnique({ where: { id: result.bookingId } });
    expect(booking!.tourDateId).toBeNull();

    // Места должны списаться с самого Tour (было 10, стало 8)
    const updatedTour = await prisma.tour.findUnique({ where: { id: tourId } });
    expect(updatedTour!.spotsLeft).toBe(18); // 20 - 2 = 18
  });

  // 13. НЕАКТИВНЫЙ ТУР
  it('возвращает ошибку при попытке забронировать выключенный (неактивный) тур', async () => {
    const inactiveTour = await prisma.tour.create({
      data: {
        slug: 'inactive-tour', title: 'Старый тур', location: 'Локация',
        price: 1000, currency: 'RUB', spots: 10, spotsLeft: 10,
        categoryId: (await prisma.tourCategory.findFirst())!.id,
        duration: '1 день', isActive: false, // <-- ВАЖНО
      },
    });

    const input = {
      tourId: inactiveTour.id, tourDateId: '', tourTitle: 'Старый тур', tourDate: 'Открытая дата',
      name: 'Гость', phone: '+37377777777', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const result = await createBookingAction(input);
      expect(result.success).toBe(false);
    } finally {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });

  // 14. СТАТУСЫ AWAITING_PAYMENT ДЛЯ БЕЗНАЛА
  it('устанавливает статус awaiting_payment для безналичных методов (biletpmr, qr, foreign)', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Карточник', phone: '+37377755511', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'biletpmr' as const, useBonuses: false, website: '',
    };
    
    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');

    const booking = await prisma.booking.findUnique({ where: { id: result.bookingId } });
    expect(booking!.status).toBe('awaiting_payment');
  });

  // 15. ПРОМОКОД ТИПА FIXED БЕЗ ВЛАДЕЛЬЦА
  it('применяет промокод типа fixed и НЕ вызывает кэшбэк если нет владельца', async () => {
    await prisma.promoCode.create({
      data: { code: 'MINUS100', discount: 100, type: 'fixed', isActive: true, memberId: null }, // Владельца нет
    });

    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Скидочник', phone: '+37377755522', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, promoCode: 'MINUS100', website: '',
    };
    
    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    
    // 1 взрослый = 1000. Скидка fixed 100. Итого 900.
    expect(result.totalPrice).toBe(900);
    // Кэшбэк не должен триггериться
    expect(mockNotificationHubDispatch).not.toHaveBeenCalled();
  });

  // 16. ИСТЕКШИЙ И НЕАКТИВНЫЙ ПРОМОКОД
  it('блокирует просроченные и выключенные (isActive=false) промокоды', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Вчера

    await prisma.promoCode.create({
      data: { code: 'EXPIRED', discount: 10, type: 'percent', isActive: true, validUntil: pastDate },
    });
    await prisma.promoCode.create({
      data: { code: 'OFF', discount: 10, type: 'percent', isActive: false },
    });

    const baseInput = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Хакер', phone: '+37377755533', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const resultExpired = await createBookingAction({ ...baseInput, promoCode: 'EXPIRED' });
    expect(resultExpired.success).toBe(false);
    if (!resultExpired.success) expect(resultExpired.error).toMatch(/истёк|недействителен/i);

    const resultOff = await createBookingAction({ ...baseInput, promoCode: 'OFF' });
    expect(resultOff.success).toBe(false);
  });

  // 17. ИГНОРИРОВАНИЕ ПРОМОКОДА ПРИ АВТОРИЗАЦИИ
  it('игнорирует переданный промокод, если юзер авторизован (списываются только бонусы)', async () => {
    const member = await prisma.memberProfile.findFirst({ where: { id: memberId! } });
    mockGetUser.mockResolvedValue({ data: { user: { id: member!.userId } }, error: null });

    // Создадим промокод, который даёт скидку 90% (чтобы явно увидеть, что он НЕ применился)
    await prisma.promoCode.create({
      data: { code: 'SUPER90', discount: 90, type: 'percent', isActive: true },
    });

    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Участник', phone: '+37377755544', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, 
      useBonuses: true, // И бонусы
      promoCode: 'SUPER90', // И дикий промокод
      website: '',
    };

    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    
    // Цена 1 билета = 1000. Списание бонусов = макс 10% (100). Итого 900.
    // Если бы сработал SUPER90, цена была бы 100.
    expect(result.totalPrice).toBe(900); 
  });

  // 18. ТИПЫ БИЛЕТОВ (СОЛЯНКА)
  it('корректно сохраняет смешанные типы билетов', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Семья', phone: '+37377755599', social: '',
      ticketsAdult: 1, ticketsChild: 2, ticketsMember: 1, ticketsFamily: 1,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');

    const booking = await prisma.booking.findUnique({ where: { id: result.bookingId } });
    expect(booking!.ticketsAdult).toBe(1);
    expect(booking!.ticketsChild).toBe(2);
    expect(booking!.ticketsMember).toBe(1);
    expect(booking!.ticketsFamily).toBe(1);
    // Сумма всех билетов = 5. Проверяем, что места списались правильно (5 - 5 = 0)
    const updatedDate = await prisma.tourDate.findUnique({ where: { id: tourDateId } });
    // Сумма мест: adult=1 + child=2 + member=1 + family=1×3=3 → итого 7
    // tourDate.spotsLeft: 20 - 7 = 13
    expect(updatedDate!.spotsLeft).toBe(13);
  });

  // 19. EMAIL-УВЕДОМЛЕНИЯ ПРИ НАЛИЧИИ @ В SOCIAL
  it('вызывает отправку Email (Resend), если в поле social передан валидный email-адрес', async () => {
    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Почтовик', phone: '+37377755566', social: 'tourist@gmail.com', // Валидный email
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    
    // Resend мок должен был быть вызван
    expect(mockResendEmailsSend).toHaveBeenCalled();
  });

  // 20. ОТСУТСТВИЕ EMAIL-УВЕДОМЛЕНИЙ ЕСЛИ ЭТО ТЕЛЕГРАМ
  it('НЕ вызывает отправку Email (Resend), если в поле social передан никнейм (без @domain.com)', async () => {
    mockResendEmailsSend.mockClear(); // Очищаем историю от предыдущего теста

    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Телеграммер', phone: '+37377755577', social: '@ivan_tg_123', // Никнейм, а не email
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    };
    
    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    
    // Resend мок НЕ должен вызываться
    expect(mockResendEmailsSend).not.toHaveBeenCalled();
  });

  // 21. ПРОМОКОД FIXED БОЛЬШЕ СУММЫ ЗАКАЗА
  it('промокод fixed со скидкой больше суммы заказа: totalPrice не уходит в минус', async () => {
    await prisma.promoCode.create({
      data: { code: 'BIGDISCOUNT', discount: 9999, type: 'fixed', isActive: true },
    });

    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Гость', phone: '+37377756001', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false,
      promoCode: 'BIGDISCOUNT', website: '',
    };

    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');

    expect(result.totalPrice).toBe(0);
    const booking = await prisma.booking.findUnique({ where: { id: result.bookingId } });
    expect(booking!.totalPrice).toBe(0);
    expect(booking!.discount).toBe(1000); // списалось не больше суммы заказа
  });

  // 22. CAP 10% НА БОНУСЫ
  it('списывает бонусы не более 10% от суммы заказа, даже если баланс больше', async () => {
    const member = await prisma.memberProfile.findFirst({ where: { id: memberId! } });
    mockGetUser.mockResolvedValue({ data: { user: { id: member!.userId } }, error: null });

    const input = {
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Участник', phone: '+37377756002', social: '',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: true, website: '',
    };

    const result = await createBookingAction(input);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');

    // 1 билет = 1000, 10% = 100, баланс 500 → спишется 100, останется 400
    expect(result.totalPrice).toBe(900);
    const updatedMember = await prisma.memberProfile.findUnique({ where: { id: memberId! } });
    expect(updatedMember!.balance).toBe(400);
  });

  // 23. ПОЛЕ EMAIL КОРРЕКТНО ЗАПИСЫВАЕТСЯ В БРОНЬ
  it('сохраняет email в booking.email если social валидный адрес, иначе null', async () => {
    const r1 = await createBookingAction({
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Почтовик', phone: '+37377756003', social: 'client@mail.com',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    });
    expect(r1.success).toBe(true);
    if (!r1.success) throw new Error('Expected success');
    const b1 = await prisma.booking.findUnique({ where: { id: r1.bookingId } });
    expect(b1!.email).toBe('client@mail.com');

    const r2 = await createBookingAction({
      tourId, tourDateId, tourTitle: 'Тур', tourDate: 'завтра',
      name: 'Телеграммер', phone: '+37377756004', social: '@tg_user',
      ticketsAdult: 1, ticketsChild: 0, ticketsMember: 0, ticketsFamily: 0,
      currency: 'RUB', paymentMethod: 'cash' as const, useBonuses: false, website: '',
    });
    expect(r2.success).toBe(true);
    if (!r2.success) throw new Error('Expected success');
    const b2 = await prisma.booking.findUnique({ where: { id: r2.bookingId } });
    expect(b2!.email).toBeNull();
  });

});