"use client";

import dynamic from 'next/dynamic';

const FunSectorWidget = dynamic(() => import('./FunSectorWidget'), { 
  ssr: false,
  loading: () => <section className="min-h-[400px] bg-slate-950 w-full animate-pulse" />
});

export default function LazyFunSector() {
  return <FunSectorWidget />;
}