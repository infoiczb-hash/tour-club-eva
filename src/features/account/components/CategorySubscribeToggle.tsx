'use client';

import { useState, useTransition } from 'react';
import { Bell, BellOff, Loader } from 'lucide-react';
import { toggleCategorySubscription } from '@/features/account/actions/wishlistActions';
import { clsx } from 'clsx';

interface CategorySubscribeToggleProps {
  categoryId: string;
  memberId: string;
  title: string;
  icon: string;
  isSubscribed: boolean;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}

export default function CategorySubscribeToggle({
  categoryId,
  memberId,
  title,
  icon,
  isSubscribed: initialSubscribed,
  colorBg,
  colorText,
  colorBorder,
}: CategorySubscribeToggleProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !subscribed;
    setSubscribed(next); // оптимистичный апдейт

    startTransition(async () => {
      const result = await toggleCategorySubscription({
        categoryId,
        memberId,
        subscribe: next,
      });
      // Откатываем если ошибка
      if (!result.success) setSubscribed(!next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={clsx(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left',
        subscribed
          ? `${colorBg} ${colorText} ${colorBorder}`
          : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/10 hover:text-slate-300'
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="flex-1 text-xs font-bold truncate">{title}</span>
      {isPending ? (
        <Loader size={12} className="animate-spin shrink-0" />
      ) : subscribed ? (
        <Bell size={12} className="shrink-0" />
      ) : (
        <BellOff size={12} className="shrink-0 opacity-40" />
      )}
    </button>
  );
}
