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
    if (process.env.NODE_ENV !== 'production') {
      console.error("Global Error caught:", error);
    }
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
      
      <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center max-w-lg w-full">
         <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Произошла внутренняя ошибка. Попробуйте обновить страницу или обратитесь в поддержку.
         </p>
         {error.digest && (
           <p className="text-xs text-slate-400 mt-2 font-mono">ID: {error.digest}</p>
         )}
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