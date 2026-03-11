// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Supabase — публичные, обязательные
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url('Некорректный URL Supabase'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Отсутствует Anon Key Supabase'),

  // Сайт — с fallback, не бросает ошибку в dev
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://evatur.club'),

  // Telegram — обязательные для уведомлений о бронях
  TELEGRAM_BOT_TOKEN:      z.string().min(1, 'TELEGRAM_BOT_TOKEN не задан'),
  TELEGRAM_ADMIN_CHAT_ID:  z.string().min(1, 'TELEGRAM_ADMIN_CHAT_ID не задан'),
  TELEGRAM_CHANNEL_ID:     z.string().optional(), // только для публичного канала

  // AI — опциональные (могут не быть в dev)
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY:               z.string().optional(),
});

// parse() бросает ZodError при старте приложения если что-то не задано —
// это лучше чем runtime-ошибка глубоко в коде
export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL:          process.env.NEXT_PUBLIC_SITE_URL,
  TELEGRAM_BOT_TOKEN:            process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_ADMIN_CHAT_ID:        process.env.TELEGRAM_ADMIN_CHAT_ID,
  TELEGRAM_CHANNEL_ID:           process.env.TELEGRAM_CHANNEL_ID,
  GOOGLE_GENERATIVE_AI_API_KEY:  process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  OPENAI_API_KEY:                process.env.OPENAI_API_KEY,
});