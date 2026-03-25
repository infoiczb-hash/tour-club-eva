"use client";

import { useTransition, useOptimistic } from "react";
import { toggleCategorySubscription } from "@/app/account/wishlist/actions";

interface Category {
  id: string;
  title: string;
}

interface CategoryPillsProps {
  categories: Category[];
  subscribedIds: string[];
}

export default function CategoryPills({ categories, subscribedIds }: CategoryPillsProps) {
  const [, startTransition] = useTransition();

  // 1. Добавляем оптимистичное состояние
  // Оно берет актуальные данные с сервера (subscribedIds) и позволяет менять их мгновенно на клиенте
  const [optimisticSubscribedIds, toggleOptimistic] = useOptimistic(
    subscribedIds,
    (state: string[], categoryId: string) =>
      state.includes(categoryId)
        ? state.filter((id) => id !== categoryId) // Если был подписан - убираем
        : [...state, categoryId]                  // Если не был - добавляем
  );

  const handleToggle = (categoryId: string) => {
    startTransition(async () => {
      // 2. Мгновенно меняем UI для пользователя
      toggleOptimistic(categoryId);
      
      // 3. Отправляем запрос на сервер в фоне
      await toggleCategorySubscription(categoryId);
    });
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-3 mt-4">
      {categories.map((category) => {
        // 4. Проверяем подписку по ОПТИМИСТИЧНОМУ массиву, а не серверному
        const isSubscribed = optimisticSubscribedIds.includes(category.id);

        return (
          <button
            key={category.id}
            onClick={() => handleToggle(category.id)}
            // Убрал disabled={isPending}, чтобы юзер мог быстро выбрать несколько категорий подряд
            className={`
              relative px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300
              overflow-hidden
              ${isSubscribed 
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]" 
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-600"
              }
            `}
          >
            {isSubscribed && (
              <span className="absolute inset-0 bg-teal-400/10 animate-pulse pointer-events-none" />
            )}
            {category.title}
          </button>
        );
      })}
    </div>
  );
}