'use server';

import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Универсальная функция загрузки файлов (Server Action)
 * @param formData - Данные формы, содержащие 'file' и опционально 'folder'
 */
export const uploadFile = async (formData: FormData): Promise<{ url: string | null; error?: string }> => {
  try {
    // 1. Проверка авторизации на сервере
    // Бросает исключение, если пользователь не вошел в админку
    await requireAuth(); // 

    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'tours';

    if (!file) {
      return { url: null, error: 'Файл не найден в запросе' };
    }

    // 2. Валидация размера (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { url: null, error: 'Файл слишком большой (макс. 5Мб)' };
    }

    // 3. Генерация безопасного имени файла
    const fileExt = file.name.split('.').pop();
    const safeName = file.name
      .replace(/\.[^/.]+$/, "") // убираем расширение
      .replace(/[^a-zA-Z0-9]/g, "_"); // заменяем спецсимволы на _
    
    const fileName = `${Date.now()}_${safeName}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // 4. Инициализация серверного клиента Supabase
    const supabase = await createServerSupabaseClient(); // 

    // 5. Загрузка в бакет 'tours-images'
    // На сервере мы используем ArrayBuffer для загрузки
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('tours-images') 
      .upload(filePath, fileBuffer, {
        upsert: true,
        cacheControl: '31536000',
        contentType: file.type // сохраняем MIME-тип
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return { url: null, error: 'Ошибка хранилища при загрузке' };
    }

    // 6. Получение публичной ссылки
    const { data } = supabase.storage
      .from('tours-images')
      .getPublicUrl(filePath);

    return { url: data.publicUrl };

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Global Upload Action Error:', err);
    
    if (err.message === 'Unauthorized') {
        return { url: null, error: 'Доступ запрещен' };
    }
    
    return { url: null, error: 'Внутренняя ошибка сервера при загрузке' };
  }
};