// src/lib/env.ts
import { z } from 'zod';

// 1. Схема для ПУБЛИЧНЫХ (клиентских) переменных
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url('Некорректный URL Supabase'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Отсутствует Anon Key Supabase'),
  NEXT_PUBLIC_SITE_URL:          z.string().url().default('https://evatur.club'),
  NEXT_PUBLIC_SENTRY_DSN:        z.string().url('Некорректный DSN Sentry').optional(),
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
  OPENAI_API_KEY:                z.string().optional(),
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL:        z.string().url('Некорректный URL Upstash Redis'),
  UPSTASH_REDIS_REST_TOKEN:      z.string().min(1, 'Отсутствует Token Upstash Redis'),

  // Resend
  RESEND_API_KEY:                z.string().optional(),

  // ✅ ДОБАВЛЕНО: Токен Sentry для выгрузки Source Maps
  SENTRY_AUTH_TOKEN:            z.string().optional(),

  // Supabase Admin
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY не задан'),
});

const isServer = typeof window === 'undefined';

const parsedClient = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL:          process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SENTRY_DSN:        process.env.NEXT_PUBLIC_SENTRY_DSN,
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
      OPENAI_API_KEY:                process.env.OPENAI_API_KEY,
      UPSTASH_REDIS_REST_URL:        process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN:      process.env.UPSTASH_REDIS_REST_TOKEN,
      RESEND_API_KEY:                process.env.RESEND_API_KEY,
      SENTRY_AUTH_TOKEN:             process.env.SENTRY_AUTH_TOKEN,
      SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY,
    }) 
  : {} as z.infer<typeof serverSchema>;

export const env = {
  ...parsedClient,
  ...parsedServer,
};