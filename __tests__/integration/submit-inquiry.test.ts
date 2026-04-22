// __tests__/integration/submit-inquiry.test.ts
import { submitInquiry } from '@/features/inquiries/actions';
import { prisma } from '@/lib/prisma';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { basicRateLimit, getClientIp } from '@/lib/rate-limit';

// Мокаем rate-limit, чтобы не блокировать тесты
jest.mock('@/lib/rate-limit', () => ({
  basicRateLimit: { limit: jest.fn().mockResolvedValue({ success: true }) },
  getClientIp: jest.fn().mockResolvedValue('127.0.0.1'),
}));

// Мокаем Telegram
jest.mock('@/features/admin/actions/telegram', () => ({
  publishToTelegram: jest.fn().mockResolvedValue({ success: true }),
}));

describe('submitInquiry – форма обратной связи', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Очищаем созданные заявки
    await prisma.inquiry.deleteMany({ where: { name: { contains: 'Тест' } } });
  });

  // 1. Успешная отправка TOUR
  it('отправляет заявку TOUR', async () => {
    const input = {
      type: 'TOUR' as const,
      name: 'Тест Тур',
      phone: '+37377712345',
      social: '@test',
      message: 'Хочу узнать про сплав',
      tourTitle: 'Байдарки',
      honeypot: '',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(true);

    const inquiry = await prisma.inquiry.findFirst({
      where: { name: 'Тест Тур', type: 'TOUR' },
    });
    expect(inquiry).not.toBeNull();
    expect(inquiry?.message).toBe('Хочу узнать про сплав');
    expect(inquiry?.payload).toEqual({ tour: 'Байдарки' });

    expect(publishToTelegram).toHaveBeenCalledWith(
      expect.stringContaining('#Вопрос'),
      undefined,
      undefined,
      false,
      expect.objectContaining({ inlineKeyboard: [[{ text: 'Взять в работу', callback_data: expect.stringMatching(/tk_lead:/) }]] })
    );
  });

  // 2. HR заявка
  it('отправляет заявку HR', async () => {
    const input = {
      type: 'HR' as const,
      name: 'Тест HR',
      phone: '+37377722222',
      social: '@hr_candidate',
      role: 'guide' as const,
      experience: '3 года в горах',
      motivation: 'Хочу водить группы',
      honeypot: '',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(true);

    const inquiry = await prisma.inquiry.findFirst({
      where: { name: 'Тест HR', type: 'HR' },
    });
    expect(inquiry?.payload).toEqual({ role: 'guide', experience: '3 года в горах', motivation: 'Хочу водить группы' });
    expect(publishToTelegram).toHaveBeenCalledWith(
      expect.stringContaining('#Команда'),
      undefined,
      undefined,
      false,
      expect.objectContaining({ messageThreadId: process.env.TELEGRAM_TOPIC_HR })
    );
  });

  // 3. B2B заявка
  it('отправляет заявку B2B', async () => {
    const input = {
      type: 'B2B' as const,
      name: 'Тест B2B',
      phone: '+37377733333',
      social: 'company@example.com',
      company: 'ООО Ромашка',
      message: 'Хотим корпоратив на 20 человек',
      honeypot: '',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(true);

    const inquiry = await prisma.inquiry.findFirst({
      where: { name: 'Тест B2B', type: 'B2B' },
    });
    expect(inquiry?.payload).toEqual({ company: 'ООО Ромашка' });
    expect(inquiry?.message).toBe('Хотим корпоратив на 20 человек');
  });

  // 4. REVIEW заявка
  it('отправляет заявку REVIEW', async () => {
    const input = {
      type: 'REVIEW' as const,
      name: 'Тест Отзыв',
      phone: '+37377744444',
      social: '@reviewer',
      rating: 5,
      message: 'Отличный тур!',
      honeypot: '',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(true);

    const inquiry = await prisma.inquiry.findFirst({
      where: { name: 'Тест Отзыв', type: 'REVIEW' },
    });
    expect(inquiry?.payload).toEqual({ rating: 5 });
    expect(inquiry?.message).toBe('Отличный тур!');
  });

// 5. Валидация: отсутствие контактов
  it('возвращает ошибку если нет ни телефона, ни social', async () => {
    const input = {
      type: 'TOUR' as const,
      name: 'Тест Без Контактов',
      phone: '',
      social: '',
      message: 'Вопрос',
      honeypot: '',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Ошибка данных'); // Проверяем общее сообщение
    
    // Zod flatten() прячет детали в formErrors или fieldErrors. 
    // Проще всего проверить всё дерево details:
    expect(JSON.stringify(result.details)).toMatch(/Укажите телефон или Telegram/);
  });

  // 6. Honeypot – бот
  it('игнорирует запрос с заполненным honeypot', async () => {
    const input = {
      type: 'TOUR' as const,
      name: 'Bot',
      phone: '+37377755555',
      social: '',
      message: 'spam',
      honeypot: 'http://spam.com',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(true);
    // Не должно быть записи в БД
    const inquiry = await prisma.inquiry.findFirst({
      where: { name: 'Bot' },
    });
    expect(inquiry).toBeNull();
    // Telegram не вызывается
    expect(publishToTelegram).not.toHaveBeenCalled();
  });

  // 7. Rate limiting (мокаем превышение)
  it('блокирует при превышении rate limit', async () => {
    // Временно подменяем rate limit на失败
    const { basicRateLimit } = require('@/lib/rate-limit');
    basicRateLimit.limit.mockResolvedValueOnce({ success: false });

    const input = {
      type: 'TOUR' as const,
      name: 'Спамер',
      phone: '+37377766666',
      social: '',
      message: 'Много запросов',
      honeypot: '',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Слишком много запросов/);
  });

  // 8. Экранирование HTML (XSS защита)
  it('экранирует HTML в Telegram-сообщении', async () => {
    const input = {
      type: 'TOUR' as const,
      name: '<script>alert("XSS")</script>',
      phone: '+37377777777',
      social: '',
      message: '<b>жирный текст</b>',
      honeypot: '',
    };
    const result = await submitInquiry(input);
    expect(result.success).toBe(true);

    // Проверяем, что в Telegram отправилось экранированное сообщение
    const call = (publishToTelegram as jest.Mock).mock.calls[0];
    const tgMessage = call[0];
    expect(tgMessage).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(tgMessage).not.toContain('<script>');
  });
});