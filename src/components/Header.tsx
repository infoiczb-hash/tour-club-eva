import React, { Suspense } from 'react';
import HeaderClient from "@/components/layout/HeaderClient"; 

const baseNavLinks = [
  { name: "Туры", href: "/tour" },
  { name: "Направления", href: "/directions" },
  { name: "Fan-сектор", href: "/fun" },
  { name: "Блог", href: "/blog" },
];

export default function Header() {
  // ❌ МЫ ПОЛНОСТЬЮ УБРАЛИ import { cookies }
  // Теперь этот компонент 100% статичный!

  return (
    <Suspense fallback={<div className="h-20" />}>
     <HeaderClient navLinks={baseNavLinks} />
    </Suspense>
  );
};