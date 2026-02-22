import { supabase } from './supabaseClient'; // Убедись, что путь верный

// ==========================================
// 1. ПОЛУЧЕНИЕ КОНТЕНТА
// ==========================================
export async function getContentBlock(slug: string): Promise<any> {
  const { data, error } = await supabase
    .from('content_blocks')
    .select('content')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data.content;
}

// ==========================================
// 2. ЗАГРУЗКА ФАЙЛА (С компьютера)
// Бакет по умолчанию: 'tours-images'
// ==========================================
export async function uploadImage(file: File, bucket: string = 'tours-images'): Promise<string | null> {
    try {
        const fileExt = file.name.split('.').pop();
        // Уникальное имя файла
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        
        if (error) {
            console.error("Supabase Upload Error:", error);
            return null;
        }
        
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error("Upload error:", error);
        return null;
    }
}

// ==========================================
// 3. ЗАГРУЗКА ПО ССЫЛКЕ (Для AI / DALL-E)
// ==========================================
export async function uploadImageFromUrl(url: string, bucket: string = 'tours-images'): Promise<string | null> {
    try {
        // 1. Скачиваем картинку
        const response = await fetch(url);
        const blob = await response.blob();
        
        // 2. Создаем файл
        const file = new File([blob], `ai-gen-${Date.now()}.png`, { type: 'image/png' });
        
        // 3. Загружаем как обычный файл
        return await uploadImage(file, bucket);
    } catch (error) {
        console.error("URL Upload error:", error);
        return null;
    }
}