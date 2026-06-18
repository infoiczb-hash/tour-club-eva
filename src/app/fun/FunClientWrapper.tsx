"use client";

import dynamic from 'next/dynamic';

// 🔥 Безопасно отключаем SSR внутри клиентской обертки
const FunClient = dynamic(() => import('./FunClient'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] animate-pulse bg-white/5 rounded-3xl" />
});

export default function FunClientWrapper({ activeTests }: { activeTests: any[] }) {
  return <FunClient activeTests={activeTests} />;
}