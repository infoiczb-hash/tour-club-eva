"use client";

import dynamic from 'next/dynamic';
import { Tour } from '@/features/tours/types';

const ToursBrowser = dynamic(
  () => import('@/features/tours/components/ToursBrowser'),
  { ssr: false }
);

export default function ToursBrowserWrapper({ tours }: { tours: Tour[] }) {
  return <ToursBrowser tours={tours} />;
}