"use client";

import { LazyMotion, domMax } from 'framer-motion';
import { ToastProvider } from "@/shared/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <ToastProvider>
        {children}
      </ToastProvider>
    </LazyMotion>
  );
}