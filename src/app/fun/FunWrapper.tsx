"use client";

import dynamic from 'next/dynamic';
import type { FunTest } from "@prisma/client";

// Динамический импорт с жестким отключением SSR
const FunClient = dynamic(() => import('./FunClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 animate-pulse flex items-center justify-center text-slate-500 uppercase tracking-widest font-bold">
      Загрузка интерактивов...
    </div>
  ),
});

export default function FunWrapper({ activeTests }: { activeTests: FunTest[] }) {
  return <FunClient activeTests={activeTests} />;
}