import { createClient } from '@supabase/supabase-js';

// Эти ключи вы получите из Supabase и замените здесь
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tour-club-eva.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_fVP8Wf997YL4Ix_zUWQOaw_kF4N8g9d';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
