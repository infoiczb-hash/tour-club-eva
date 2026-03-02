"use client";

import dynamic from 'next/dynamic';

// Здесь мы находимся в клиентском компоненте, поэтому ssr: false разрешен!
const SocialGrid = dynamic(() => import('./SocialGrid'), { 
  ssr: false,
  loading: () => <section className="min-h-[600px] bg-slate-950 w-full animate-pulse" />
});

export default function LazySocialGrid() {
  return <SocialGrid />;
}