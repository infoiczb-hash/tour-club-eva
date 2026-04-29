'use client';

import dynamic from 'next/dynamic';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

const SocialGrid = dynamic(() => import('./SocialGrid'), {
  ssr: false,
  loading: () => <section className="min-h-[600px] bg-slate-950 w-full animate-pulse" />,
});

export default function LazySocialGrid() {
  return (
    <SectionErrorBoundary label="Социальная лента" minHeight="600px">
      <SocialGrid />
    </SectionErrorBoundary>
  );
}