import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env'; // 👈 Импортируем нашу валидацию

// Нам больше не нужны проверки if (!url), Zod это уже сделал
export const supabase = await createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);