"use client";

import { usePathname } from "next/navigation";

interface Props {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  promo: React.ReactNode;
}

export default function MainLayoutWrapper({ children, header, footer, promo }: Props) {
  const pathname = usePathname();
  
  // 1. Проверка Админки
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans">
        {children}
      </div>
    );
  }

  // 2. Проверка страниц без футера и промо-блока
  const isTourPage = pathname?.startsWith('/tour');
  const isAccountPage = pathname?.startsWith('/account');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Хедер оставляем везде */}
      {header}
      
      <main className="flex-grow">
        {children}
      </main>

      {/* Показываем Промо и Футер ТОЛЬКО если это НЕ страница тура и НЕ личный кабинет */}
      {!isTourPage && !isAccountPage && (
        <>
          {promo}
          {footer}
        </>
      )}
    </div>
  );
}