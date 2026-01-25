import { createClient } from '@supabase/supabase-js';

// Эти ключи вы получите из Supabase и замените здесь
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ЗАМЕНИТЬ.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'ЗАМЕНИТЬ_НА_ВАШ_КЛЮЧ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
