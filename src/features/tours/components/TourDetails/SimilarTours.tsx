// src/features/tours/components/TourDetails/SimilarTours.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import TourCard from '@/features/tours/components/TourCard';
import { TourPreview } from '@/features/tours/types';

interface SimilarToursProps {
  toursPromise: Promise<TourPreview[]>; //   Меняем тип на Promise
}

export default async function SimilarTours({ toursPromise }: SimilarToursProps) {
  //   Ждем загрузки туров
  const tours = await toursPromise;

  if (!tours || tours.length === 0) return null;

  return (
    <section className="mt-24 mb-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Compass className="text-teal-500" size={24} />
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                Похожие маршруты
              </h2>
            </div>
            <p className="text-slate-300 font-medium">
              Возможно, вам также понравятся эти приключения
            </p>
          </div>
          
          <Link 
            href="/tour" 
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 font-bold uppercase text-sm tracking-widest transition-colors group"
          >
            В каталог 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}

//   ДОБАВЛЕНО: Скелетон
export function SimilarToursSkeleton() {
  return (
    <section className="mt-24 mb-12 relative animate-pulse">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="h-10 w-64 bg-slate-800 rounded-lg mb-2" />
            <div className="h-5 w-96 bg-slate-800/50 rounded-lg max-w-full" />
          </div>
          <div className="h-6 w-24 bg-slate-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[420px] bg-slate-800/50 rounded-2xl border border-white/5" />
          ))}
        </div>
      </div>
    </section>
  );
}