import { createClient } from '@supabase/supabase-js';

// Эти ключи вы получите из Supabase и замените здесь
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://nglywosdwqxxctybwjeb.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbHl3b3Nkd3F4eGN0eWJ3amViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzQ5NzksImV4cCI6MjA4NDkxMDk3OX0.D5aiIgPJ4tQWGMKPwBkrn1PgYuNcCoL9qE754yxwdfk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
