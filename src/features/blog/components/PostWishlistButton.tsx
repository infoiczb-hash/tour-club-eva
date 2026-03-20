// src/features/blog/components/PostWishlistButton.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { Bookmark } from 'lucide-react'; // Для блога логичнее использовать закладку, а не сердце
import { useRouter } from 'next/navigation';
import { toggleFavoritePostAction } from '@/features/account/actions/blogWishlist';

interface PostWishlistButtonProps {
  postId: string;
  initialIsFavorite?: boolean;
}

export default function PostWishlistButton({ 
  postId, 
  initialIsFavorite = false 
}: PostWishlistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isFav, setIsFav] = useState(initialIsFavorite);
  const router = useRouter();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    setIsFav(!isFav); // Optimistic UI

    startTransition(async () => {
      const res = await toggleFavoritePostAction(postId);
      
      if (res.success) {
        setIsFav(res.isFavorite ?? false);
      } else {
        setIsFav(!isFav); // Откат при ошибке
        if (res.error === 'unauthorized') router.push(`/login?next=/blog`);
      }
    });
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center transition-all hover:bg-black/60 active:scale-90"
      aria-label="Сохранить статью"
    >
      <Bookmark 
        size={20} 
        className={`transition-colors duration-300 ${
          isFav ? 'fill-teal-500 text-teal-500' : 'fill-transparent text-white hover:text-teal-400'
        }`} 
      />
    </button>
  );
}