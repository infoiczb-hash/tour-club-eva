"use client";

import { LazyMotion, domAnimation } from 'framer-motion';
import { ToastProvider } from "@/shared/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <ToastProvider>
        {children}
      </ToastProvider>
    </LazyMotion>
  );
}