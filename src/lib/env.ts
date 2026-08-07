// src/lib/env.ts
import { z } from 'zod';

// 1. Схема для ПУБЛИЧНЫХ (клиентских) переменных
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url('Некорректный URL Supabase'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Отсутствует Anon Key Supabase'),
  NEXT_PUBLIC_SITE_URL:          z.string().url().default('https://evatur.club'),
  NEXT_PUBLIC_SENTRY_DSN:        z.string().url('Некорректный DSN Sentry').optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Отсутствует Cloudinary Cloud Name'),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1, 'Отсутствует Cloudinary Upload Preset'), 
});

// 2. Схема для СЕКРЕТНЫХ (серверных) переменных
const serverSchema = z.object({
  TELEGRAM_BOT_TOKEN:            z.string().min(1, 'TELEGRAM_BOT_TOKEN не задан'),
  TELEGRAM_ADMIN_CHAT_ID:        z.string().min(1, 'TELEGRAM_ADMIN_CHAT_ID не задан'),
  TELEGRAM_AUTH_BOT:             z.string().min(1, 'TELEGRAM_AUTH_BOT не задан'),
  TELEGRAM_PUBLIC_BOT_TOKEN:     z.string().min(1, 'TELEGRAM_PUBLIC_BOT_TOKEN не задан'),
  TELEGRAM_CHANNEL_ID:           z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET:       z.string().min(1, 'TELEGRAM_WEBHOOK_SECRET не задан'),
  CRON_SECRET:                   z.string().min(1, 'CRON_SECRET не задан'),
  GOOGLE_GENERATIVE_AI_API_KEY:  z.string().optional(),
  GROQ_API_KEY:                  z.string().optional(),
  FAL_KEY:                       z.string().optional(),
  OPENAI_API_KEY:                z.string().optional(),
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL:        z.string().url('Некорректный URL Upstash Redis'),
  UPSTASH_REDIS_REST_TOKEN:      z.string().min(1, 'Отсутствует Token Upstash Redis'),

  // Resend
  RESEND_API_KEY:                z.string().optional(),

  // Токен Sentry для выгрузки Source Maps
  SENTRY_AUTH_TOKEN:             z.string().optional(),

  // Supabase Admin
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY не задан'),

  // Топики и ключи очередей
  QSTASH_TOKEN:                  z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY:    z.string().optional(), // 🔥 ДОБАВЛЕНО ДЛЯ БЕЗОПАСНОСТИ КРОНОВ
  QSTASH_NEXT_SIGNING_KEY:       z.string().optional(), // 🔥 ДОБАВЛЕНО ДЛЯ БЕЗОПАСНОСТИ КРОНОВ
  TELEGRAM_TOPIC_BOOKINGS:       z.string().optional(),
  TELEGRAM_TOPIC_MONEY:          z.string().optional(),
  TELEGRAM_TOPIC_SUPPORT:        z.string().optional(),
  TELEGRAM_TOPIC_REVIEWS:        z.string().optional(),
  TELEGRAM_TOPIC_HR:             z.string().optional(),

// APB CLEVER ACQUIRING
   APB_MERCHANT_ID:   z.string().min(1, 'APB_MERCHANT_ID не задан'),
  APB_MERCHANT_PASS: z.string().min(1, 'APB_MERCHANT_PASS не задан'),
  APB_IS_TEST:       z.enum(['0', '1']).default('1'),
  APB_PAYMENT_URL:   z.string().url().default('https://epay.apb.online/PaymentStart'),
  APB_SOAP_URL:      z.string().url().default('https://ws.agroprombank.com/merchant/APB.SV.WebPayment.AgentService.asmx'),
});

const isServer = typeof window === 'undefined';

const parsedClient = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL:          process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SENTRY_DSN:        process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, 
});

const parsedServer = isServer 
  ? serverSchema.parse({
      TELEGRAM_BOT_TOKEN:            process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_AUTH_BOT:             process.env.TELEGRAM_AUTH_BOT,
      TELEGRAM_ADMIN_CHAT_ID:        process.env.TELEGRAM_ADMIN_CHAT_ID,
      TELEGRAM_PUBLIC_BOT_TOKEN:     process.env.TELEGRAM_PUBLIC_BOT_TOKEN,
      TELEGRAM_CHANNEL_ID:           process.env.TELEGRAM_CHANNEL_ID,
      TELEGRAM_WEBHOOK_SECRET:       process.env.TELEGRAM_WEBHOOK_SECRET,
      CRON_SECRET:                   process.env.CRON_SECRET,
      GOOGLE_GENERATIVE_AI_API_KEY:  process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      GROQ_API_KEY:                  process.env.GROQ_API_KEY,
      FAL_KEY:                       process.env.FAL_KEY,
      OPENAI_API_KEY:                  process.env.OPENAI_API_KEY,
      UPSTASH_REDIS_REST_URL:        process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN:      process.env.UPSTASH_REDIS_REST_TOKEN,
      RESEND_API_KEY:                process.env.RESEND_API_KEY,
      SENTRY_AUTH_TOKEN:             process.env.SENTRY_AUTH_TOKEN,
      SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      QSTASH_TOKEN:                  process.env.QSTASH_TOKEN,
      QSTASH_CURRENT_SIGNING_KEY:    process.env.QSTASH_CURRENT_SIGNING_KEY, // 🔥 ПРОКИНУТО В ПАРСЕР
      QSTASH_NEXT_SIGNING_KEY:       process.env.QSTASH_NEXT_SIGNING_KEY,    // 🔥 ПРОКИНУТО В ПАРСЕР
      TELEGRAM_TOPIC_BOOKINGS:       process.env.TELEGRAM_TOPIC_BOOKINGS,
      TELEGRAM_TOPIC_MONEY:          process.env.TELEGRAM_TOPIC_MONEY,
      TELEGRAM_TOPIC_SUPPORT:        process.env.TELEGRAM_TOPIC_SUPPORT,
      TELEGRAM_TOPIC_REVIEWS:        process.env.TELEGRAM_TOPIC_REVIEWS,
      TELEGRAM_TOPIC_HR:             process.env.TELEGRAM_TOPIC_HR,

      APB_MERCHANT_ID:   process.env.APB_MERCHANT_ID,
      APB_MERCHANT_PASS: process.env.APB_MERCHANT_PASS,
      APB_IS_TEST:       process.env.APB_IS_TEST,
      APB_PAYMENT_URL:   process.env.APB_PAYMENT_URL,
      APB_SOAP_URL:      process.env.APB_SOAP_URL,
    }) 
  : {} as z.infer<typeof serverSchema>;

export const env = {
  ...parsedClient,
  ...parsedServer,
};