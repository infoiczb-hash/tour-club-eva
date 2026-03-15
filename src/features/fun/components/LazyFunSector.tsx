"use client";

import dynamic from 'next/dynamic';
import type { FunTest } from "@prisma/client";

const FunSectorWidget = dynamic(() => import('./FunSectorWidget'), { 
  ssr: false,
  loading: () => <section className="min-h-[400px] bg-slate-950 w-full animate-pulse" />
});

export default function LazyFunSector({ activeTests }: { activeTests?: FunTest[] }) {
  return <FunSectorWidget activeTests={activeTests} />;
}