// src/app/api/blog/favorite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { toggleFavoritePostAction } from '@/features/account/actions/blogWishlist';

/**
 * API Route для переключения состояния "Избранное" у статьи блога.
 * Является оберткой над Server Action для поддержки старых вызовов через fetch.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId } = body;

    // Валидация входных данных
    if (!postId || typeof postId !== 'string') {
      return NextResponse.json(
        { error: 'ID статьи (postId) обязателен' }, 
        { status: 400 }
      );
    }

    // Вызов существующей бизнес-логики
    const result = await toggleFavoritePostAction(postId);

    // Обработка авторизации
    if (result.error === 'unauthorized') {
      return NextResponse.json(
        { error: 'Для добавления в избранное необходимо войти в аккаунт' }, 
        { status: 401 }
      );
    }

    // Обработка прочих ошибок из экшена
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Не удалось обновить избранное' }, 
        { status: 500 }
      );
    }

    // Успешный ответ
    return NextResponse.json({ 
      success: true,
      isFavorite: result.isFavorite 
    });

  } catch (error) {
    console.error('[API_BLOG_FAVORITE_ERROR]:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    );
  }
}