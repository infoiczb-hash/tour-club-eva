'use client';

import dynamic from 'next/dynamic';
import type { FunTest } from '@prisma/client';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

const FunSectorWidget = dynamic(() => import('./FunSectorWidget'), {
  ssr: false,
  loading: () => <section className="min-h-[400px] bg-slate-950 w-full animate-pulse" />,
});

export default function LazyFunSector({ activeTests }: { activeTests?: FunTest[] }) {
  return (
    <SectionErrorBoundary label="Fun-сектор" minHeight="400px">
      <FunSectorWidget activeTests={activeTests} />
    </SectionErrorBoundary>
  );
}