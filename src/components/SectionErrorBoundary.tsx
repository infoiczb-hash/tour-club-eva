"use client";

// src/components/SectionErrorBoundary.tsx
//
// Переиспользуемый ErrorBoundary для секций главной страницы.
// Если секция падает с JS ошибкой — показывает тихий fallback
// вместо белого экрана на всю страницу.
//
// Использование:
//   <SectionErrorBoundary label="ToursBrowser">
//     <ToursBrowserWrapper />
//   </SectionErrorBoundary>

import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  // label используется в console.error для быстрой диагностики
  label?: string;
  // Минимальная высота fallback-плашки, чтобы не ломать layout
  minHeight?: string;
}

function SectionFallback({
  label,
  minHeight,
  resetErrorBoundary,
}: {
  label?: string;
  minHeight?: string;
  resetErrorBoundary: () => void;
}) {
  return (
    <section
      className="flex flex-col items-center justify-center gap-4 py-16 px-4 bg-slate-950 border-y border-white/5"
      style={{ minHeight: minHeight ?? "200px" }}
      aria-label={label ? `Ошибка секции: ${label}` : "Ошибка секции"}
    >
      <p className="text-slate-300 text-sm font-medium text-center max-w-xs">
        Эта секция временно недоступна. Попробуйте обновить страницу.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-teal-500 hover:border-teal-500 transition-colors"
      >
        Попробовать снова
      </button>
    </section>
  );
}

export default function SectionErrorBoundary({
  children,
  label,
  minHeight,
}: Props) {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <SectionFallback
          label={label}
          minHeight={minHeight}
          resetErrorBoundary={resetErrorBoundary}
        />
      )}
      onError={(error) => {
        // В продакшене сюда можно подключить Sentry/LogRocket
        console.error(`[ErrorBoundary${label ? ` | ${label}` : ""}]`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}