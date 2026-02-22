import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Некорректный URL Supabase"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Отсутствует Anon Key Supabase"),
});

// parse() выбросит ошибку, если переменные не заданы или некорректны
export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});