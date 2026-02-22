"use client"; // 👈 Обязательно для обработчика ошибок

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку в консоль браузера, чтобы ты мог её увидеть
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center bg-slate-50 dark:bg-slate-950">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Упс! Что-то пошло не так.
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          К сожалению, произошла ошибка при загрузке этой страницы.
        </p>
      </div>
      
      <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-left max-w-lg w-full overflow-auto">
         <p className="text-xs font-mono text-red-600 break-words">
            {error.message || "Unknown error"}
         </p>
      </div>

      <button
        onClick={() => reset()}
        className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg hover:shadow-teal-500/30 active:scale-95"
      >
        Попробовать снова
      </button>
    </div>
  );
}