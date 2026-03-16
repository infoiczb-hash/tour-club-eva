// src/lib/env.ts
import { z } from 'zod';

// 1. Схема для ПУБЛИЧНЫХ (клиентских) переменных
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url('Некорректный URL Supabase'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Отсутствует Anon Key Supabase'),
  NEXT_PUBLIC_SITE_URL:          z.string().url().default('https://evatur.club'),
});

// 2. Схема для СЕКРЕТНЫХ (серверных) переменных
const serverSchema = z.object({
  TELEGRAM_BOT_TOKEN:      z.string().min(1, 'TELEGRAM_BOT_TOKEN не задан'),
  TELEGRAM_ADMIN_CHAT_ID:  z.string().min(1, 'TELEGRAM_ADMIN_CHAT_ID не задан'),
  TELEGRAM_CHANNEL_ID:     z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY:               z.string().optional(),
  
  // ✅ ДОБАВЛЕНО: Ключи для Upstash Redis
  UPSTASH_REDIS_REST_URL:       z.string().url('Некорректный URL Upstash Redis'),
  UPSTASH_REDIS_REST_TOKEN:     z.string().min(1, 'Отсутствует Token Upstash Redis'),
});

// Проверяем, где мы сейчас находимся: на сервере или в браузере
const isServer = typeof window === 'undefined';

// Клиентские переменные проверяем всегда
const parsedClient = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL:          process.env.NEXT_PUBLIC_SITE_URL,
});

// Серверные переменные проверяем ТОЛЬКО на сервере
const parsedServer = isServer 
  ? serverSchema.parse({
      TELEGRAM_BOT_TOKEN:            process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_ADMIN_CHAT_ID:        process.env.TELEGRAM_ADMIN_CHAT_ID,
      TELEGRAM_CHANNEL_ID:           process.env.TELEGRAM_CHANNEL_ID,
      GOOGLE_GENERATIVE_AI_API_KEY:  process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      OPENAI_API_KEY:                process.env.OPENAI_API_KEY,
      
      // ✅ ДОБАВЛЕНО: Прокидываем ключи в парсер
      UPSTASH_REDIS_REST_URL:        process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN:      process.env.UPSTASH_REDIS_REST_TOKEN,
    }) 
  : {} as z.infer<typeof serverSchema>; // В браузере просто отдаем пустышку, чтобы не было ошибки

// Экспортируем всё вместе
export const env = {
  ...parsedClient,
  ...parsedServer,
};