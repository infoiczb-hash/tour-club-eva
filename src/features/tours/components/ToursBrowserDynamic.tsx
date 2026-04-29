'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';

const ToursBrowser = dynamic(() => import('./ToursBrowser'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] w-full animate-pulse bg-slate-900 rounded-xl" />
});

// Вытягиваем типы пропсов автоматически из самого компонента
type ToursBrowserProps = React.ComponentProps<typeof ToursBrowser>;

export default function ToursBrowserDynamic(props: ToursBrowserProps) {
  return (
    <SectionErrorBoundary label="Каталог туров" minHeight="400px">
      <ToursBrowser {...props} />
    </SectionErrorBoundary>
  );
}