// src/lib/apb/client.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import crypto from 'crypto';

// Устанавливаем переменные окружения ДО импорта apbClient
process.env.APB_MERCHANT_ID = 'TEST_MERCHANT';
process.env.APB_IS_TEST = '1';
process.env.APB_MERCHANT_PASS = 'secret-pass-123';
process.env.NEXT_PUBLIC_SITE_URL = 'https://evatur.club';
process.env.APB_PAYMENT_URL = 'https://pay.apb.com/payment';
process.env.APB_SOAP_URL = 'https://pay.apb.com/soap';

// Теперь импортируем клиент (он прочитает process.env)
import { apbClient } from './client';

describe('APB Client Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildPaymentUrl', () => {
    it('формирует корректный URL для инициации платежа', () => {
      const invoiceId = 'EVA-001';
      const amount = 50000;
      const description = 'Тур в Горы';
      const lifetime = 30;

      const url = apbClient.buildPaymentUrl(invoiceId, amount, description, lifetime);
      const parsedUrl = new URL(url);

      // Базовый URL
      expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://pay.apb.com/payment');

      // Обязательные параметры
      expect(parsedUrl.searchParams.get('MerchantLogin')).toBe('TEST_MERCHANT');
      expect(parsedUrl.searchParams.get('nivid')).toBe(invoiceId);
      expect(parsedUrl.searchParams.get('RequestSum')).toBe(amount.toString());
      expect(parsedUrl.searchParams.get('RequestCurrCode')).toBe('000');
      expect(parsedUrl.searchParams.get('Desc')).toBe(description);
      expect(parsedUrl.searchParams.get('IsTest')).toBe('1');
      expect(parsedUrl.searchParams.get('LifeTime')).toBe(lifetime.toString());

      // URL возврата
      expect(parsedUrl.searchParams.get('SuccessURL')).toBe(
        `https://test.com/payment/success?invoiceId=${invoiceId}`
      );
      expect(parsedUrl.searchParams.get('FailURL')).toBe(
        `https://test.com/payment/fail?invoiceId=${invoiceId}`
      );
      expect(parsedUrl.searchParams.get('ResultURL')).toBe('https://test.com/api/webhooks/apb');

      // Проверка подписи
      const signature = parsedUrl.searchParams.get('SignatureValue');
      expect(signature).toMatch(/^[a-f0-9]{32}$/);

      // Вычисляем ожидаемую подпись (по правилам из client.ts)
      const expectedSignature = crypto
        .createHash('md5')
        .update(
          [
            'TEST_MERCHANT',
            invoiceId,
            '1',
            amount.toString(),
            '000',
            description,
            'secret-pass-123',
          ].join(':')
        )
        .digest('hex');
      expect(signature).toBe(expectedSignature);
    });
  });

  describe('verifyWebhookSignature', () => {
    // Вспомогательная функция для вычисления ожидаемой подписи (как в client.ts)
    const computeExpectedSignature = (params: Record<string, string>) => {
      const { invoiceid, status, paymentsum, paymentcurrency, date } = params;
      const pass = 'secret-pass-123';
      let signatureString: string;

      if (status === 'paid') {
        signatureString = [invoiceid, status, paymentsum, paymentcurrency, date, pass].join(':');
      } else {
        signatureString = [invoiceid, status, date, pass].join(':');
      }

      return crypto.createHash('md5').update(signatureString).digest('hex');
    };

    it('возвращает true для успешного платежа (status = paid) с правильной подписью', () => {
      const params = {
        invoiceid: 'EVA-002',
        status: 'paid',
        paymentsum: '150000',
        paymentcurrency: '000',
        date: '2026-05-01',
      };
      const correctSignature = computeExpectedSignature(params);
      const paramsWithSignature = { ...params, signature: correctSignature };
      const result = apbClient.verifyWebhookSignature(paramsWithSignature);
      expect(result).toBe(true);
    });

    it('возвращает false, если подпись не совпадает', () => {
      const params = {
        invoiceid: 'EVA-002',
        status: 'paid',
        paymentsum: '150000',
        paymentcurrency: '000',
        date: '2026-05-01',
        signature: 'wrong-hash-123',
      };
      const result = apbClient.verifyWebhookSignature(params);
      expect(result).toBe(false);
    });

    it('корректно формирует строку для подписи при status = fail', () => {
      const params = {
        invoiceid: 'EVA-003',
        status: 'fail',
        date: '2026-05-01',
      };
      const correctSignature = computeExpectedSignature(params);
      const paramsWithSignature = { ...params, signature: correctSignature };
      const result = apbClient.verifyWebhookSignature(paramsWithSignature);
      expect(result).toBe(true);
    });

    it('игнорирует paymentsum и paymentcurrency при status = fail (подпись без них)', () => {
      const params = {
        invoiceid: 'EVA-004',
        status: 'fail',
        paymentsum: '999999',
        paymentcurrency: '999',
        date: '2026-05-01',
      };
      const correctSignature = computeExpectedSignature({
        invoiceid: params.invoiceid,
        status: params.status,
        date: params.date,
      });
      const paramsWithSignature = { ...params, signature: correctSignature };
      const result = apbClient.verifyWebhookSignature(paramsWithSignature);
      expect(result).toBe(true);
    });
  });
});