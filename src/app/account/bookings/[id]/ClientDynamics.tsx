// src/app/account/bookings/[id]/ClientDynamics.tsx
'use client';

import dynamic from 'next/dynamic';

export const PaymentActionBlock = dynamic(
  () =>
    import('@/features/account/components/PaymentActionBlock').then(
      (mod) => mod.PaymentActionBlock,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 p-6 bg-ui-panel rounded-2xl border border-ui-border">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-10 w-full bg-white/5 rounded" />
      </div>
    ),
  },
);