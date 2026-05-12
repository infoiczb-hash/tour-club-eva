// src/components/blog/RelatedTour.tsx
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Compass } from 'lucide-react';

interface Props {
  tour: { 
    title: string; 
    slug: string; 
    coverImage: string | null; 
    price: number | null; 
    currency: string | null 
  };
}

export default function RelatedTour({ tour }: Props) {
  return (
    <div className="my-10 relative overflow-hidden rounded-3xl bg-slate-900/80 border border-teal-500/30 p-6 md:p-8 group shadow-xl">
      {/* Декоративный засвет */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-500" />
      
      <div className="flex items-center gap-2 mb-5 relative z-10">
        <Compass size={18} className="text-teal-500" />
        <span className="text-xs font-black uppercase tracking-widest text-teal-400">
          Поехали с нами
        </span>
      </div>

      <Link 
        href={`/tour/${tour.slug}`} 
        className="flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-6 relative z-10"
      >
        {tour.coverImage && (
          <div className="relative w-full sm:w-32 h-40 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-md">
            <Image 
              src={tour.coverImage} 
              alt={tour.title} 
              fill 
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-bold text-lg md:text-xl text-white leading-tight mb-2 group-hover:text-teal-400 transition-colors">
            {tour.title}
          </h3>
          {tour.price && (
            <p className="text-sm md:text-base text-slate-300 font-medium">
              от <span className="font-bold text-white">{tour.price.toLocaleString('ru-RU')} {tour.currency}</span>
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-900 shrink-0 transition-all">
          <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}