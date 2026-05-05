import { createClient } from '@/lib/supabase/client'; //   SSR-клиент с cookies (сессия работает)

// ==========================================
// 1. ПОЛУЧЕНИЕ КОНТЕНТА
// ==========================================
export async function getContentBlock(slug: string): Promise<Record<string, unknown> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .select('content')
    .eq('slug', slug)
    .maybeSingle(); // 👈 было .single()

  if (error || !data) return null;
  return data.content as Record<string, unknown>;
}

// ==========================================
// 2. ЗАГРУЗКА ФАЙЛА (С компьютера)
// Корзина зафиксирована: 'tours-images'
// ==========================================
export async function uploadImage(file: File, folder: string = ''): Promise<string | null> {
    try {
        //   ФАЗА 1: Жёсткий лимит размера файла (5 MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        if (file.size > MAX_FILE_SIZE) {
            alert(`Файл слишком большой! Максимальный размер 5 МБ. Размер вашего файла: ${(file.size / 1024 / 1024).toFixed(2)} МБ.`);
            return null;
        }

        const supabase = createClient();

        //   ФАЗА 2: Базовая проверка авторизации (чтобы не делать лишний запрос в хранилище)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Ошибка: Вы не авторизованы. Только администраторы могут загружать файлы.');
            return null;
        }

        const bucket = 'tours-images';
        const fileExt = file.name.split('.').pop();
        const safeName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `${Date.now()}-${safeName}.${fileExt}`;
        
        // Склеиваем путь
        const filePath = folder ? `${folder}/${fileName}` : fileName; 
        
        //   ФАЗА 3: Загрузка в Supabase (Здесь отработает наша RLS политика)
        const { error } = await supabase.storage.from(bucket).upload(filePath, file);
        
        if (error) {
            console.error("Supabase Upload Error:", error);
            // Перехватываем ошибку RLS и выдаем понятный текст
            if (error.message.includes('row-level security') || error.message.includes('Unauthorized')) {
                 alert('Доступ запрещен: У вас нет прав администратора для загрузки файлов в хранилище!');
            } else {
                 alert('Ошибка при загрузке картинки: ' + error.message);
            }
            return null;
        }
        
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error("Upload error:", error);
        return null;
    }
}

// ==========================================
// 3. ЗАГРУЗКА ПО ССЫЛКЕ (Для AI / DALL-E)
// ==========================================
export async function uploadImageFromUrl(url: string, folder: string = ''): Promise<string | null> {
    try {
        // 1. Скачиваем картинку
        const response = await fetch(url);
        const blob = await response.blob();
        
        // 2. Создаем файл
        const file = new File([blob], `ai-gen-${Date.now()}.png`, { type: 'image/png' });
        
        // 3. Загружаем как обычный файл, прокидывая папку дальше (лимит проверится внутри)
        return await uploadImage(file, folder);
    } catch (error) {
        console.error("URL Upload error:", error);
        return null;
    }
}