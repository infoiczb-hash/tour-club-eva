import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
/**
 * Универсальная функция загрузки файлов в Supabase Storage
 * @param file - Объект файла (из input type="file")
 * @param folder - Папка назначения ('tours', 'docs', 'blog', 'guides'). По умолчанию 'tours'.
 */
export const uploadFile = async (file: File, folder: string = 'tours'): Promise<{ url: string | null; error?: string }> => {
  try {
    // 1. Генерация безопасного имени файла
    // Убираем кириллицу и спецсимволы, добавляем время для уникальности
    const fileExt = file.name.split('.').pop();
    // Оставляем только латинские буквы и цифры в названии, остальное заменяем на "_"
    const safeName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${Date.now()}_${safeName}.${fileExt}`;
    
    // Итоговый путь: "tours/1709823_foto.jpg" или "docs/1709823_contract.pdf"
    const filePath = `${folder}/${fileName}`;

    // 2. Загрузка в бакет 'tours-images'
    const { error: uploadError } = await supabase.storage
      .from('tours-images') 
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      throw uploadError;
    }

    // 3. Получение публичной ссылки
    const { data } = supabase.storage
      .from('tours-images')
      .getPublicUrl(filePath);

    return { url: data.publicUrl };

  } catch (error: any) {
    console.error('Global Upload Error:', error);
    return { url: null, error: error.message || 'Ошибка при загрузке файла' };
  }
};