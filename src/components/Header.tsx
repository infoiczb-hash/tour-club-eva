import React, { Suspense } from 'react';
import { cookies } from 'next/headers';

// ❌ УДАЛЯЕМ ErrorBoundary (он ломал сайт)
// import { ErrorBoundary } from 'react-error-boundary';

// Убедись, что путь правильный. 
// Если HeaderClient лежит просто в components, исправь на "@/components/HeaderClient"
import HeaderClient from "@/components/layout/HeaderClient"; 

const baseNavLinks = [
  { name: "Туры", href: "/tour" },
  { name: "Направления", href: "/directions" },
  { name: "Fan-сектор", href: "/fun" },
  { name: "Блог", href: "/blog" },
];

// ❌ Функция ErrorFallback больше не нужна

export default async function Header() {
  const cookieStore = await cookies();
  const userPref = cookieStore.get('user_preference')?.value || 'default';
  const visitCount = parseInt(cookieStore.get('visit_count')?.value || '0');
  const isReturning = visitCount > 1;

  // Логика персонализации
  let navLinks = [...baseNavLinks];

  if (isReturning) {
    navLinks = navLinks.map(link => 
      link.name === "Туры" ? { ...link, name: "Новые маршруты" } : link
    );
  }

  if (userPref === 'adventure') {
    navLinks = navLinks.map(link => 
        link.name === "Туры" ? { ...link, name: "Экспедиции" } : link
    );
  }

  const welcomeMessage = isReturning ? "С возвращением!" : null;

  return (
    // ❌ Убрали обертку ErrorBoundary
    <Suspense fallback={<div className="h-20" />}>
     <HeaderClient navLinks={navLinks} />
    </Suspense>
  );
};