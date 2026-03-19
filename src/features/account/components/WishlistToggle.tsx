'use client';

import { useTransition } from 'react';
import { Heart, Loader } from 'lucide-react';
import { toggleWishlist } from '@/features/account/actions/wishlistActions';

interface WishlistToggleProps {
  tourId: string;
  memberId: string;
  watchlistId?: string;
  inWishlist: boolean;
}

export default function WishlistToggle({
  tourId,
  memberId,
  watchlistId,
  inWishlist,
}: WishlistToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleWishlist({ tourId, memberId, watchlistId, inWishlist });
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="shrink-0 p-1 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50"
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
