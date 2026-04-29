// src/features/account/components/WishlistToggle.tsx
'use client';

import { useTransition } from 'react';
import { Heart, Loader } from 'lucide-react';
import { toggleTourWishlistAction } from '@/features/account/actions/tourWishlist'; // ← новый импорт

interface WishlistToggleProps {
  tourId: string;
  // memberId и watchlistId больше не нужны новому экшену,
  // но оставляем для совместимости с родительским компонентом
  memberId?: string;
  watchlistId?: string;
  inWishlist: boolean;
}

export default function WishlistToggle({
  tourId,
  inWishlist,
  // memberId и watchlistId можно игнорировать
}: WishlistToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleTourWishlistAction(tourId);

      // Если вдруг понадобится обработка (пока не нужно, т.к. пользователь уже в кабинете)
      if (!res.success) {
        console.error('Ошибка toggle wishlist');
      }
    });
  }

 return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="shrink-0 p-1 text-ui-muted hover:text-rose-400 transition-colors disabled:opacity-50"
      title={inWishlist ? 'Убрать из вишлиста' : 'Добавить в вишлист'}
    >
      {isPending ? (
        <Loader size={14} className="animate-spin" />
      ) : (
        <Heart
          size={14}
          className={inWishlist ? 'text-rose-400 fill-rose-400' : ''}
        />
      )}
    </button>
  );
}