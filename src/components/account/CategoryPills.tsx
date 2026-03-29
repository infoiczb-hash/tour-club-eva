"use client";

import { useTransition, useOptimistic } from "react";
// ✅ Используем единственную надёжную версию из wishlistActions.ts
// (там есть проверка memberId → гарантия что чужой профиль не тронуть)
// Старый импорт из @/app/account/wishlist/actions — УДАЛЁН
import { toggleCategorySubscription } from "@/features/account/actions/wishlistActions";

interface Category {
  id: string;
  title: string;
}

interface CategoryPillsProps {
  categories: Category[];
  subscribedIds: string[];
  memberId: string; // ✅ Добавили: нужен для безопасного action
}

export default function CategoryPills({
  categories,
  subscribedIds,
  memberId,
}: CategoryPillsProps) {
  const [, startTransition] = useTransition();

  // Оптимистичное состояние: мгновенно обновляет UI без ожидания сервера
  const [optimisticSubscribedIds, toggleOptimistic] = useOptimistic(
    subscribedIds,
    (state: string[], categoryId: string) =>
      state.includes(categoryId)
        ? state.filter((id) => id !== categoryId)
        : [...state, categoryId]
  );

  const handleToggle = (categoryId: string) => {
    const isCurrentlySubscribed = optimisticSubscribedIds.includes(categoryId);

    startTransition(async () => {
      // 1. Мгновенно меняем UI
      toggleOptimistic(categoryId);

      // 2. Отправляем на сервер с полными данными для авторизации
      await toggleCategorySubscription({
        categoryId,
        memberId,
        subscribe: !isCurrentlySubscribed,
      });
    });
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-3 mt-4">
      {categories.map((category) => {
        const isSubscribed = optimisticSubscribedIds.includes(category.id);

        return (
          <button
            key={category.id}
            onClick={() => handleToggle(category.id)}
            className={`
              relative px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300
              overflow-hidden
              ${
                isSubscribed
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