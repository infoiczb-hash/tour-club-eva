'use server';

import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const uploadFile = async (
  formData: FormData
): Promise<{ url: string | null; error?: string }> => {
  try {
    await requireAuth();

    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'tours';

    if (!file) {
      return { url: null, error: 'Файл не найден в запросе' };
    }

    // ── Валидация типа ──
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { url: null, error: 'Разрешены только JPG, PNG, WebP, GIF' };
    }

    // ── Валидация размера ──
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { url: null, error: 'Файл слишком большой (макс. 5МБ)' };
    }

    // ── Генерация имени файла ──
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 40);

    const fileName = `${Date.now()}_${crypto.randomUUID()}_${safeName}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // ── Загрузка в Supabase Storage ──
    const supabase = await createServerSupabaseClient();
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('tours-images')
      .upload(filePath, fileBuffer, {
        upsert: false,
        contentType: file.type,
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
    const err = error as Error;
    console.error('Upload Action Error:', err);

    if (err.message === 'Unauthorized') {
      return { url: null, error: 'Доступ запрещён' };
    }

    return { url: null, error: 'Внутренняя ошибка сервера при загрузке' };
  }
};
