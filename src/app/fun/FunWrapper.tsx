"use client";

import dynamic from 'next/dynamic';

// Переносим динамический импорт сюда
const FunClient = dynamic(() => import('./FunClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 animate-pulse flex items-center justify-center text-slate-500 uppercase tracking-widest font-bold">
      Загрузка интерактивов...
    </div>
  ),
});

export default function FunWrapper({ activeTests }: { activeTests: any }) {
  return <FunClient activeTests={activeTests} />;
}