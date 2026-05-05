// src/features/blog/components/PostWishlistButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Props {
  postId: string;
  initialIsFavorite: boolean;
}

export default function PostWishlistButton({ postId, initialIsFavorite }: Props) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Защита от несовпадения серверного и клиентского HTML
  useEffect(() => setMounted(true), []);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mounted || isLoading) return;

    setIsLoading(true);
    const previousState = isFavorite;
    
    // Оптимистичное обновление
    setIsFavorite(!previousState);

    try {
      const res = await fetch('/api/blog/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Войдите, чтобы сохранить статью');
          setIsFavorite(previousState);
          router.push('/login');
          return;
        }
        throw new Error();
      }
      
      router.refresh();
    } catch (err) {
      setIsFavorite(previousState);
      toast.error('Не удалось обновить избранное');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`p-2.5 rounded-full transition-all border ${
        isFavorite 
          ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
          : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
      }`}
    >
      <Heart 
        size={20} 
        className={isFavorite ? 'fill-current' : ''} 
      />
    </button>
  );
}