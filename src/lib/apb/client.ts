// src/lib/apb/client.ts
// Выполняется ТОЛЬКО на сервере (Server Actions, API Routes)
import crypto from 'crypto';
import { env } from '@/lib/env';

// ─────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────

// Коды статусов из документации АПБ (поле <state>)
export type ApbStateCode = 0 | 1 | 2 | 3 | 4;

export const APB_STATE: Record<ApbStateCode, string> = {
  0: 'Не оплачен',
  1: 'Оплачен',
  2: 'Отменён',
  3: 'Ошибка платежа',
  4: 'Просрочен',
};

export interface ApbPaymentState {
  stateCode: ApbStateCode;         // Числовой код (0-4)
  stateDescription: string;        // Текст из <statedescription>
  isPaid: boolean;                 // stateCode === 1
  rrn: string | null;              // <rrn> — нужен для возвратов
  authCode: string | null;         // <authcode> из блока <trx>
  lastDigits: string | null;       // <lastdgt> — последние 4 цифры карты
  sum: number | null;              // <sum> — сумма в копейках
  currency: string | null;         // <currency>
  paidAt: Date | null;             // <enddate> — дата завершения
  rawResponse: string;             // Полный XML для логов
}

export interface ApbRefundResult {
  success: boolean;
  error: string | null;
  rawResponse: string;
}

// ─────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────

function md5(str: string): string {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'is'));
  return match?.[1]?.trim() || null;
}

// ─────────────────────────────────────────────
// КЛИЕНТ АПБ
// ─────────────────────────────────────────────

export const apbClient = {

  /**
   * 1. ИНИЦИАЦИЯ ПЛАТЕЖА
   * Генерирует URL для редиректа клиента на страницу оплаты АПБ.
   * Документация: раздел "3. Инициация оплаты"
   *
   * @param invoiceId  Уникальный ID заказа, макс 25 символов (например EVA-1234)
   * @param amountKop  Сумма в копейках (например 150000 = 1500 руб)
   * @param desc       Описание заказа (макс 255 символов)
   * @param lifetimeMin Время жизни счёта в минутах (например 30)
   */
  buildPaymentUrl(
    invoiceId: string,
    amountKop: number,
    desc: string,
    lifetimeMin: number = 30,
  ): string {
    const merchantId = env.APB_MERCHANT_ID;
    const isTest     = env.APB_IS_TEST;      // '0' или '1'
    const currCode   = '000';                 // Рубль ПМР по справочнику ЦБ ПМР

    // Подпись строго по документации:
    // MD5(MerchantLogin:nIvId:istest:RequestSum:RequestCurrCode:Desc:MerchantPass)
    const signatureStr = [
      merchantId,
      invoiceId,
      isTest,
      amountKop.toString(),
      currCode,
      desc,
      env.APB_MERCHANT_PASS,
    ].join(':');

    const signature = md5(signatureStr);

    // Все обязательные параметры из документации
    const baseUrl = env.NEXT_PUBLIC_SITE_URL;
    const params = new URLSearchParams({
      MerchantLogin:  merchantId,
      RequestSum:     amountKop.toString(),
      RequestCurrCode: currCode,
      nivid:          invoiceId,
      Desc:           desc.slice(0, 255),
      IsTest:         isTest,
      LifeTime:       lifetimeMin.toString(),
      SignatureValue: signature,
      // URL-ы возврата клиента
      SuccessURL:     `${baseUrl}/payment/success?invoiceId=${invoiceId}`,
      FailURL:        `${baseUrl}/payment/fail?invoiceId=${invoiceId}`,
      ResultURL:      `${baseUrl}/api/webhooks/apb`,
    });

    return `${env.APB_PAYMENT_URL}?${params.toString()}`;
  },

  /**
   * 2. ПРОВЕРКА СТАТУСА ПЛАТЕЖА (GetState)
   * SOAP-запрос к банку. Всегда вызывать после получения вебхука —
   * не доверять вебхуку на слово (требование документации АПБ).
   * Документация: раздел "6.1 Получение состояния операции"
   *
   * @param invoiceId Уникальный ID заказа
   */
  async getPaymentState(invoiceId: string): Promise<ApbPaymentState> {
    const merchantId = env.APB_MERCHANT_ID;

    // Подпись: MD5(MerchantId:InvoiceId:MerchantPass)
    const signature = md5([merchantId, invoiceId, env.APB_MERCHANT_PASS].join(':'));

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://agroprombank.com/">
  <soap:Body>
    <tns:GetState>
      <tns:MerchantId>${merchantId}</tns:MerchantId>
      <tns:InvoiceId>${invoiceId}</tns:InvoiceId>
      <tns:Signature>${signature}</tns:Signature>
    </tns:GetState>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(env.APB_SOAP_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction':   'http://agroprombank.com/GetState',
      },
      body:  soapBody,
      cache: 'no-store', // Критично для Next.js — статусы нельзя кэшировать
    });

    if (!response.ok) {
      throw new Error(`APB GetState HTTP ${response.status}`);
    }

    const xml = await response.text();

    // Документация возвращает числовой код в <state> (0-4)
    const stateRaw   = extractTag(xml, 'state');
    const stateCode  = (stateRaw !== null ? parseInt(stateRaw, 10) : 3) as ApbStateCode;

    // <enddate> формат: "01.01.2025 9:01:02"
    const endDateRaw = extractTag(xml, 'enddate');
    let paidAt: Date | null = null;
    if (endDateRaw && stateCode === 1) {
      // Парсим молдавское время (UTC+2 / UTC+3 летом)
      const [datePart, timePart] = endDateRaw.split(' ');
      const [day, month, year]   = datePart.split('.');
      paidAt = new Date(`${year}-${month}-${day}T${timePart}+02:00`);
    }

    // <sum> — сумма в копейках
    const sumRaw = extractTag(xml, 'sum');

    // Данные карты из блока <trx>
    const trxBlock   = xml.match(/<trx[^>]*>([\s\S]*?)<\/trx>/i)?.[1] ?? '';
    const authCode   = extractTag(trxBlock, 'authcode');
    const lastDigits = extractTag(xml, 'lastdgt'); // lastdgt есть и в основном блоке

    return {
      stateCode,
      stateDescription: extractTag(xml, 'statedescription') ?? APB_STATE[stateCode] ?? 'Неизвестно',
      isPaid:      stateCode === 1,
      rrn:         extractTag(xml, 'rrn'),
      authCode,
      lastDigits,
      sum:         sumRaw !== null ? parseInt(sumRaw, 10) : null,
      currency:    extractTag(xml, 'currency'),
      paidAt,
      rawResponse: xml,
    };
  },

  /**
   * 3. ВОЗВРАТ / ОТМЕНА (CancelOperation / RefundOperation)
   * Логика выбора операции по документации АПБ:
   * - CancelOperation  → если оплата была СЕГОДНЯ (в пределах дня)
   * - RefundOperation  → если оплата была в другой день
   * Документация: разделы "6.3 Отмена" и "6.4 Частичный возврат"
   *
   * @param invoiceId   ID заказа
   * @param amountKop   Сумма возврата в копейках
   * @param paidAt      Дата оплаты (из поля booking.paidAt) — определяет Cancel vs Refund
   */
  async processRefund(
    invoiceId: string,
    amountKop: number,
    paidAt: Date,
  ): Promise<ApbRefundResult> {
    const merchantId = env.APB_MERCHANT_ID;

    // Сравниваем даты по молдавскому времени (UTC+2)
    const nowMD     = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Chisinau' }));
    const paidAtMD  = new Date(paidAt.toLocaleString('en-US', { timeZone: 'Europe/Chisinau' }));
    const isToday   = nowMD.toDateString() === paidAtMD.toDateString();

    let soapBody: string;
    let soapAction: string;

    if (isToday) {
      // CancelOperation: MD5(MerchantId:InvoiceId:MerchantPass)
      const signature = md5([merchantId, invoiceId, env.APB_MERCHANT_PASS].join(':'));
      soapAction = 'http://agroprombank.com/CancelOperation';
      soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://agroprombank.com/">
  <soap:Body>
    <tns:CancelOperation>
      <tns:MerchantId>${merchantId}</tns:MerchantId>
      <tns:InvoiceId>${invoiceId}</tns:InvoiceId>
      <tns:Signature>${signature}</tns:Signature>
    </tns:CancelOperation>
  </soap:Body>
</soap:Envelope>`;
    } else {
      // RefundOperation: MD5(MerchantId:InvoiceId:refundAmount:MerchantPass)
      const signature = md5([merchantId, invoiceId, amountKop.toString(), env.APB_MERCHANT_PASS].join(':'));
      soapAction = 'http://agroprombank.com/RefundOperation';
      soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://agroprombank.com/">
  <soap:Body>
    <tns:RefundOperation>
      <tns:MerchantId>${merchantId}</tns:MerchantId>
      <tns:InvoiceId>${invoiceId}</tns:InvoiceId>
      <tns:RefundAmount>${amountKop}</tns:RefundAmount>
      <tns:Signature>${signature}</tns:Signature>
    </tns:RefundOperation>
  </soap:Body>
</soap:Envelope>`;
    }

    const response = await fetch(env.APB_SOAP_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction':   soapAction,
      },
      body:  soapBody,
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success:     false,
        error:       `HTTP ${response.status}`,
        rawResponse: '',
      };
    }

    const xml = await response.text();

    // Документация: <Code>1</Code> = успех, <Code>0</Code> = ошибка
    const codeRaw     = extractTag(xml, 'Code');
    const success     = codeRaw === '1';
    const description = extractTag(xml, 'Description');

    if (!success) {
      console.error(`[APB] Refund failed for ${invoiceId}:`, description);
    }

    return {
      success,
      error:       success ? null : (description ?? 'Неизвестная ошибка АПБ'),
      rawResponse: xml,
    };
  },

  /**
   * ВСПОМОГАТЕЛЬНЫЙ МЕТОД
   * Верификация подписи входящего вебхука (ResultURL).
   * Документация раздел "4. Оповещение об оплате":
   * Успех:  MD5(invoiceid:status:paymentsum:paymentcurrency:date:MerchantPass)
   * Неуспех: MD5(invoiceid:status:date:MerchantPass)
   */
  verifyWebhookSignature(params: Record<string, string>): boolean {
    const { invoiceid, status, paymentsum, paymentcurrency, date, signature } = params;

    let signatureStr: string;

    if (status === 'paid') {
      signatureStr = [
        invoiceid,
        status,
        paymentsum,
        paymentcurrency,
        date,
        env.APB_MERCHANT_PASS,
      ].join(':');
    } else {
      // status === 'fail'
      signatureStr = [
        invoiceid,
        status,
        date,
        env.APB_MERCHANT_PASS,
      ].join(':');
    }

    const expected = md5(signatureStr);
    return expected === signature?.toLowerCase();
  },
};