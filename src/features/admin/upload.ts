'use server';

import { withAdminAuth } from '@/lib/auth'; // 👈 ИМПОРТ БРОНИ
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ==========================================
// 🛡 ФУНКЦИЯ ПРОВЕРКИ СИГНАТУР (MAGIC BYTES)
// ==========================================
function validateImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  
  // PNG: 89 50 4E 47
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  
  // WEBP: Начинается с RIFF, а с 8-го байта идет строка WEBP
  const isWebp =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  // GIF: GIF8 (47 49 46 38)
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;

  return isJpeg || isPng || isWebp || isGif;
}

export const uploadFile = withAdminAuth(async (
  formData: FormData
): Promise<{ url: string | null; error?: string }> => {
  try {
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'tours';

    if (!file) {
      return { url: null, error: 'Файл не найден в запросе' };
    }

    // ── Валидация размера (Делаем ПЕРЕД чтением в память) ──
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { url: null, error: 'Файл слишком большой (макс. 5МБ)' };
    }

    // ── Чтение файла в буфер ──
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ==========================================
    // 🛡 ЗАЩИТА ОТ ПОДДЕЛКИ РАСШИРЕНИЙ (SEC-ADV-02)
    // ==========================================
    if (!validateImageMagicBytes(buffer)) {
      console.warn(`[Security] Блокировка поддельного файла. Имя: ${file.name}, заявленный тип: ${file.type}`);
      return { url: null, error: 'Неверный тип файла. Разрешены только настоящие изображения (JPG, PNG, WebP, GIF)' };
    }

    // ── Генерация имени файла ──
    const EXT_MAP: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const fileExt = EXT_MAP[file.type] ?? 'jpg';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 40);

    const fileName = `${Date.now()}_${crypto.randomUUID()}_${safeName}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // ── Загрузка в Supabase Storage ──
    const supabase = await createServerSupabaseClient();

    const { error: uploadError } = await supabase.storage
      .from('tours-images')
      .upload(filePath, arrayBuffer, {
        upsert: false,
        contentType: file.type, // Тип мы уже валидировали по байтам, заголовок оставляем для браузера
        cacheControl: '31536000', // 1 год кеша
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return { url: null, error: `Ошибка хранилища: ${uploadError.message}` };
    }

    // ── Получение render URL ──
    const { data } = supabase.storage.from('tours-images').getPublicUrl(filePath);
    const renderUrl = data.publicUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );

    return { url: renderUrl };

  } catch (error: unknown) {
    console.error('Upload Action Error:', error);
    return { url: null, error: 'Внутренняя ошибка сервера при загрузке' };
  }
});