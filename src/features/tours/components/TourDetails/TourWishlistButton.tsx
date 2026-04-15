// src/features/tours/components/TourDetails/TourWishlistButton.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { toggleTourWishlistAction } from '@/features/account/actions/tourWishlist';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

interface Props {
  tourId: string;
  initialIsWished: boolean;
  className?: string;
}

export default function TourWishlistButton({ 
  tourId, 
  initialIsWished, 
  className 
}: Props) {
  const [isWished, setIsWished] = useState(initialIsWished);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const previousState = isWished;
    setIsWished(!isWished);

    startTransition(async () => {
      const res = await toggleTourWishlistAction(tourId);

      if (res.needsAuth) {
        setIsWished(previousState);
        showToast('Войдите в личный кабинет, чтобы добавлять туры в избранное', 'info');
        return;
      }

      if (!res.success) {
        setIsWished(previousState);
        showToast('Произошла ошибка, попробуйте позже', 'error');
        return;
      }

      showToast(
        res.isWished ? 'Тур добавлен в избранное' : 'Тур удален из избранного',
        'success'
      );

      router.refresh();
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isWished ? "Убрать из избранного" : "Добавить в избранное"}
      className={clsx(
        "flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg group active:scale-90",
        isWished
          ? "bg-rose-500/20 border-rose-500/50 text-rose-500 hover:bg-rose-500/30"
          : "bg-slate-900/60 border-white/10 text-white hover:bg-slate-800 hover:text-rose-400 hover:border-rose-400/30",
        className
      )}
      aria-label="Добавить в избранное"
    >
      <Heart
        size={22}
        strokeWidth={isWished ? 2.5 : 2}
        className={clsx(
          "transition-all duration-300",
          isWished
            ? "fill-current scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
            : "group-hover:scale-110"
        )}
      />
    </button>
  );
}