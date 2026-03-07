import React, { Suspense } from 'react';
import HeaderClient from "@/components/layout/HeaderClient"; 

const baseNavLinks = [
  { name: "Туры", href: "/tour" },
  { name: "Направления", href: "/directions" },
  { name: "Fan-сектор", href: "/fun" },
  { name: "Блог", href: "/blog" },
  { name: "Гиды", href: "/guides" },
  { name: "О клубе", href: "/about" },
];

export default function Header() {
  // ❌ МЫ ПОЛНОСТЬЮ УБРАЛИ import { cookies }
  // Теперь этот компонент 100% статичный!

  return (
        <HeaderClient navLinks={baseNavLinks} />
  
  );
};

