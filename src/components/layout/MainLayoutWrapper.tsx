"use client";

import { usePathname } from "next/navigation";

interface Props {
  children: React.ReactNode;
  header: React.ReactNode; // Если вы передаете хедер пропсом, иначе просто компонент <Header />
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

  // 2. Проверка Страницы Тура (НОВОЕ)
  // Если путь начинается с /tour (например /tours/altai или /tour/altai),
  // то считаем, что это страница тура.
  const isTourPage = pathname?.startsWith('/tour');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Хедер оставляем везде */}
      {header}
      
      <main className="flex-grow">
        {children}
      </main>

      {/* Показываем Промо и Футер ТОЛЬКО если это НЕ страница тура.
          На странице тура будет виден только контент тура.
      */}
      {!isTourPage && (
        <>
          {promo}
          {footer}
        </>
      )}
    </div>
  );
}